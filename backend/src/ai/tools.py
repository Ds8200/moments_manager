"""
Business tools available to the AI agent.
Each tool is an async function registered with tool_registry.
Adding a new tool: decorate with @tool_registry.register(...) — no other files change.
"""
import logging
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.ai.tool_registry import tool_registry
from src.customers.email_templates import build_customer_email
from src.expense_categories.models import ExpenseCategory
from src.expenses.models import Expense
from src.orders.enums import OrderStatus
from src.orders.models import Order
from src.reports.service import ReportService

logger = logging.getLogger(__name__)

_PARAM_NONE = {"type": "object", "properties": {}}


# ── Dashboard KPIs ─────────────────────────────────────────────────────────────

@tool_registry.register(
    name="get_dashboard_kpis",
    description=(
        "Returns current business KPIs: open orders, ready orders, "
        "monthly revenue, monthly expenses, monthly profit, unpaid amount, "
        "and today's order count. Use for general business status questions."
    ),
    parameters=_PARAM_NONE,
)
async def get_dashboard_kpis(db: AsyncSession, **_: object) -> dict:
    svc = ReportService(db)
    kpi = await svc.get_dashboard_kpi()
    return {
        "open_orders": kpi.open_orders,
        "ready_orders": kpi.ready_orders,
        "monthly_revenue": str(kpi.monthly_revenue),
        "monthly_expenses": str(kpi.monthly_expenses),
        "monthly_profit": str(kpi.monthly_profit),
        "unpaid_amount": str(kpi.unpaid_amount),
        "today_orders": kpi.today_orders,
    }


# ── Monthly Report ─────────────────────────────────────────────────────────────

@tool_registry.register(
    name="get_monthly_report",
    description=(
        "Returns a detailed financial report for a specific month. "
        "Includes revenue, expenses, profit, order counts, and payment breakdown. "
        "Defaults to the current month if year/month are not provided."
    ),
    parameters={
        "type": "object",
        "properties": {
            "year": {
                "type": "integer",
                "description": "Calendar year (e.g. 2025). Defaults to current year.",
            },
            "month": {
                "type": "integer",
                "description": "Month number 1–12. Defaults to current month.",
            },
        },
    },
)
async def get_monthly_report(
    db: AsyncSession,
    year: int | None = None,
    month: int | None = None,
    **_: object,
) -> dict:
    today = date.today()
    y = year if year is not None else today.year
    m = month if month is not None else today.month
    svc = ReportService(db)
    r = await svc.get_monthly_report(y, m)
    return {
        "year": r.year,
        "month": r.month,
        "total_revenue": str(r.total_revenue),
        "total_expenses": str(r.total_expenses),
        "total_profit": str(r.total_profit),
        "net_profit": str(r.net_profit),
        "paid_count": r.paid_count,
        "unpaid_count": r.unpaid_count,
        "total_count": r.total_count,
        "collection_rate": r.collection_rate,
        "cash_revenue": str(r.cash_revenue),
        "transfer_revenue": str(r.transfer_revenue),
        "unpaid_amount": str(r.unpaid_amount),
    }


# ── Financial Year ─────────────────────────────────────────────────────────────

@tool_registry.register(
    name="get_financial_year",
    description=(
        "Returns annual financial summary and month-by-month breakdown. "
        "Use for trend analysis, annual comparisons, or when the user asks "
        "about yearly data."
    ),
    parameters={
        "type": "object",
        "properties": {
            "year": {
                "type": "integer",
                "description": "Calendar year (e.g. 2025). Defaults to current year.",
            },
        },
    },
)
async def get_financial_year(
    db: AsyncSession,
    year: int | None = None,
    **_: object,
) -> dict:
    y = year if year is not None else date.today().year
    svc = ReportService(db)
    data = await svc.get_financial_year(y)
    return {
        "year": data.year,
        "annual_revenue": str(data.annual_revenue),
        "annual_profit": str(data.annual_profit),
        "annual_expenses": str(data.annual_expenses),
        "annual_net": str(data.annual_net),
        "annual_unpaid": str(data.annual_unpaid),
        "months": [
            {
                "month": m.month,
                "total_revenue": str(m.total_revenue),
                "total_expenses": str(m.total_expenses),
                "net_profit": str(m.net_profit),
                "paid_count": m.paid_count,
            }
            for m in data.months
        ],
    }


# ── Top Customers ──────────────────────────────────────────────────────────────

@tool_registry.register(
    name="get_top_customers",
    description=(
        "Returns the top customers ranked by total revenue. "
        "Use when the user asks about best customers, most valuable clients, "
        "or customer ranking."
    ),
    parameters={
        "type": "object",
        "properties": {
            "limit": {
                "type": "integer",
                "description": "How many top customers to return (1–20). Defaults to 5.",
            },
        },
    },
)
async def get_top_customers(
    db: AsyncSession,
    limit: int = 5,
    **_: object,
) -> dict:
    capped = min(max(limit, 1), 20)
    svc = ReportService(db)
    customers = await svc.get_top_customers(capped)
    return {
        "customers": [
            {
                "name": c.customer_name,
                "order_count": c.order_count,
                "total_revenue": str(c.total_revenue),
                "total_profit": str(c.total_profit),
            }
            for c in customers
        ]
    }


# ── Orders Summary ─────────────────────────────────────────────────────────────

@tool_registry.register(
    name="get_orders_summary",
    description=(
        "Returns order count and revenue totals, optionally filtered by status "
        "or date range. Use when the user asks about order volume, pipeline, "
        "or counts for a specific period."
    ),
    parameters={
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "description": (
                    "Filter by order status. Valid values: "
                    "new, waiting_approval, approved, printing, ready, completed, cancelled. "
                    "Omit to include all statuses."
                ),
            },
            "date_from": {
                "type": "string",
                "description": "Start date filter in YYYY-MM-DD format.",
            },
            "date_to": {
                "type": "string",
                "description": "End date filter in YYYY-MM-DD format.",
            },
        },
    },
)
async def get_orders_summary(
    db: AsyncSession,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    **_: object,
) -> dict:
    filters = [Order.is_deleted.is_(False)]
    if status:
        filters.append(Order.status == status)
    if date_from:
        filters.append(Order.date >= date_from)
    if date_to:
        filters.append(Order.date <= date_to)

    result = await db.execute(
        select(
            func.count(Order.id),
            func.coalesce(func.sum(Order.total_amount), Decimal("0")),
        ).where(and_(*filters))
    )
    count, total_revenue = result.one()
    avg_value = (
        round(float(total_revenue) / count, 2) if count > 0 else 0.0
    )
    return {
        "count": count,
        "total_revenue": str(total_revenue),
        "avg_order_value": avg_value,
        "filters_applied": {
            "status": status,
            "date_from": date_from,
            "date_to": date_to,
        },
    }


# ── Recent Orders ─────────────────────────────────────────────────────────────

@tool_registry.register(
    name="get_recent_orders",
    description=(
        "Returns the most recent orders with details: order number, customer name, "
        "amount, status, urgency, and due date. Use to understand current workload, "
        "identify patterns, or answer questions about specific recent orders."
    ),
    parameters={
        "type": "object",
        "properties": {
            "limit": {
                "type": "integer",
                "description": "How many recent orders to return (1–20). Defaults to 10.",
            },
            "status": {
                "type": "string",
                "description": (
                    "Optional status filter: new, waiting_approval, approved, "
                    "printing, ready, completed, cancelled."
                ),
            },
        },
    },
)
async def get_recent_orders(
    db: AsyncSession,
    limit: int = 10,
    status: str | None = None,
    **_: object,
) -> dict:
    capped = min(max(limit, 1), 20)
    filters = [Order.is_deleted.is_(False)]
    if status:
        filters.append(Order.status == status)

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.customer))
        .where(and_(*filters))
        .order_by(Order.created_at.desc())
        .limit(capped)
    )
    orders = list(result.scalars().all())
    return {
        "orders": [
            {
                "order_number": o.order_number,
                "customer": o.customer.name if o.customer else "לקוח לא ידוע",
                "total_amount": str(o.total_amount),
                "status": o.status,
                "urgency": o.urgency,
                "date": str(o.date),
                "due_datetime": str(o.due_datetime) if o.due_datetime else None,
                "is_paid": o.is_paid,
            }
            for o in orders
        ],
        "count": len(orders),
    }


# ── Overdue Orders ─────────────────────────────────────────────────────────────

@tool_registry.register(
    name="get_overdue_orders",
    description=(
        "Returns orders that are past their due date and have not been completed or cancelled. "
        "Use to identify delayed orders, follow up with customers, or assess operational risk."
    ),
    parameters={"type": "object", "properties": {}},
)
async def get_overdue_orders(db: AsyncSession, **_: object) -> dict:
    now = datetime.now(timezone.utc)
    active_statuses = [
        OrderStatus.new.value,
        OrderStatus.waiting_approval.value,
        OrderStatus.approved.value,
        OrderStatus.printing.value,
        OrderStatus.ready.value,
    ]
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.customer))
        .where(
            and_(
                Order.is_deleted.is_(False),
                Order.due_datetime < now,
                Order.status.in_(active_statuses),
            )
        )
        .order_by(Order.due_datetime.asc())
    )
    orders = list(result.scalars().all())
    return {
        "overdue_orders": [
            {
                "order_number": o.order_number,
                "customer": o.customer.name if o.customer else "לקוח לא ידוע",
                "status": o.status,
                "due_datetime": str(o.due_datetime),
                "total_amount": str(o.total_amount),
                "is_paid": o.is_paid,
            }
            for o in orders
        ],
        "count": len(orders),
    }


# ── Monthly Comparison ─────────────────────────────────────────────────────────

@tool_registry.register(
    name="get_monthly_comparison",
    description=(
        "Compares the current month to the previous month: revenue, expenses, "
        "profit, order count, and collection rate. Use for trend analysis, "
        "'is the business improving?' questions, and strategic advice."
    ),
    parameters={"type": "object", "properties": {}},
)
async def get_monthly_comparison(db: AsyncSession, **_: object) -> dict:
    today = date.today()
    svc = ReportService(db)

    current = await svc.get_monthly_report(today.year, today.month)
    prev_month = today.month - 1 if today.month > 1 else 12
    prev_year = today.year if today.month > 1 else today.year - 1
    previous = await svc.get_monthly_report(prev_year, prev_month)

    def diff(curr: Decimal, prev: Decimal) -> str:
        d = curr - prev
        sign = "+" if d >= 0 else ""
        return f"{sign}{d}"

    return {
        "current_month": {"year": current.year, "month": current.month},
        "previous_month": {"year": previous.year, "month": previous.month},
        "revenue": {
            "current": str(current.total_revenue),
            "previous": str(previous.total_revenue),
            "change": diff(current.total_revenue, previous.total_revenue),
        },
        "expenses": {
            "current": str(current.total_expenses),
            "previous": str(previous.total_expenses),
            "change": diff(current.total_expenses, previous.total_expenses),
        },
        "net_profit": {
            "current": str(current.net_profit),
            "previous": str(previous.net_profit),
            "change": diff(current.net_profit, previous.net_profit),
        },
        "orders": {
            "current_total": current.total_count,
            "previous_total": previous.total_count,
            "current_paid": current.paid_count,
            "previous_paid": previous.paid_count,
        },
        "collection_rate": {
            "current": current.collection_rate,
            "previous": previous.collection_rate,
        },
    }


# ── Expense Breakdown ──────────────────────────────────────────────────────────

@tool_registry.register(
    name="get_expense_breakdown",
    description=(
        "Returns expenses grouped by category for a given month. "
        "Use to identify which cost areas are highest, give specific cost-cutting advice, "
        "or understand where the business is spending money."
    ),
    parameters={
        "type": "object",
        "properties": {
            "year": {
                "type": "integer",
                "description": "Year (e.g. 2025). Defaults to current year.",
            },
            "month": {
                "type": "integer",
                "description": "Month 1–12. Defaults to current month.",
            },
        },
    },
)
async def get_expense_breakdown(
    db: AsyncSession,
    year: int | None = None,
    month: int | None = None,
    **_: object,
) -> dict:
    today = date.today()
    y = year if year is not None else today.year
    m = month if month is not None else today.month
    first_day = date(y, m, 1)
    last_month = m % 12 + 1
    last_year = y if m < 12 else y + 1
    last_day = date(last_year, last_month, 1)

    result = await db.execute(
        select(
            ExpenseCategory.name,
            func.coalesce(func.sum(Expense.amount), Decimal("0")).label("total"),
        )
        .outerjoin(Expense, and_(
            Expense.category_id == ExpenseCategory.id,
            Expense.is_deleted.is_(False),
            Expense.date >= first_day,
            Expense.date < last_day,
        ))
        .group_by(ExpenseCategory.name)
        .order_by(func.sum(Expense.amount).desc().nullslast())
    )
    rows = result.all()

    # Also count uncategorised expenses
    uncat_result = await db.execute(
        select(func.coalesce(func.sum(Expense.amount), Decimal("0")))
        .where(
            and_(
                Expense.is_deleted.is_(False),
                Expense.category_id.is_(None),
                Expense.date >= first_day,
                Expense.date < last_day,
            )
        )
    )
    uncategorised = uncat_result.scalar_one()

    categories = [{"category": row[0], "total": str(row[1])} for row in rows]
    if uncategorised > 0:
        categories.append({"category": "ללא קטגוריה", "total": str(uncategorised)})

    return {
        "year": y,
        "month": m,
        "breakdown": categories,
        "total": str(sum(Decimal(c["total"]) for c in categories)),
    }


# ── Email Draft ────────────────────────────────────────────────────────────────

@tool_registry.register(
    name="draft_email",
    description=(
        "Generates a professional email draft using the Moments email template. "
        "Returns the subject line and body text. "
        "IMPORTANT: this only creates a draft — it does NOT send any email. "
        "Always tell the user the result is a draft they can review."
    ),
    parameters={
        "type": "object",
        "properties": {
            "customer_name": {
                "type": "string",
                "description": "Full name of the email recipient.",
            },
            "subject": {
                "type": "string",
                "description": "Email subject line.",
            },
            "body": {
                "type": "string",
                "description": "Email body text (plain text, no HTML).",
            },
        },
        "required": ["customer_name", "subject", "body"],
    },
)
async def draft_email(
    db: AsyncSession,
    customer_name: str,
    subject: str,
    body: str,
    **_: object,
) -> dict:
    final_subject, html_body = build_customer_email(customer_name, subject, body)
    return {
        "subject": final_subject,
        "body_text": body,
        "preview_html": html_body,
        "note": "This is a draft only — no email has been sent.",
    }
