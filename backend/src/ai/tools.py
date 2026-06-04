"""
Business tools available to the AI agent.
Each tool is an async function registered with tool_registry.
Adding a new tool: decorate with @tool_registry.register(...) — no other files change.
"""
import logging
from datetime import date
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.tool_registry import tool_registry
from src.customers.email_templates import build_customer_email
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
