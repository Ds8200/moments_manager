"""Financial and period-analysis tools for the AI agent."""

import logging
from datetime import date
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from src.ai.tool_registry import tool_registry
from src.expense_categories.models import ExpenseCategory
from src.expenses.models import Expense
from src.reports.service import ReportService

logger = logging.getLogger(__name__)


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
    org_id: str,
    year: int | None = None,
    month: int | None = None,
    **_: object,
) -> dict:
    today = date.today()
    y = year if year is not None else today.year
    m = month if month is not None else today.month
    svc = ReportService(db, org_id)
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
    org_id: str,
    year: int | None = None,
    **_: object,
) -> dict:
    y = year if year is not None else date.today().year
    svc = ReportService(db, org_id)
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
async def get_monthly_comparison(db: AsyncSession, org_id: str, **_: object) -> dict:
    today = date.today()
    svc = ReportService(db, org_id)

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
    org_id: str,
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

    # Raw SQL required: PostgreSQL SET LOCAL has no SQLAlchemy ORM equivalent.
    await db.execute(text("SET LOCAL app.current_org_id = :org_id"), {"org_id": org_id})

    result = await db.execute(
        select(
            ExpenseCategory.name,
            func.coalesce(func.sum(Expense.amount), Decimal("0")).label("total"),
        )
        .outerjoin(
            Expense,
            and_(
                Expense.category_id == ExpenseCategory.id,
                Expense.organization_id == org_id,
                Expense.is_deleted.is_(False),
                Expense.date >= first_day,
                Expense.date < last_day,
            ),
        )
        .where(ExpenseCategory.organization_id == org_id)
        .group_by(ExpenseCategory.name)
        .order_by(func.sum(Expense.amount).desc().nullslast())
    )
    rows = result.all()

    uncat_result = await db.execute(
        select(func.coalesce(func.sum(Expense.amount), Decimal("0"))).where(
            and_(
                Expense.organization_id == org_id,
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


# ── Product Performance ────────────────────────────────────────────────────────


@tool_registry.register(
    name="get_product_performance",
    description=(
        "Returns revenue and profit breakdown by product/service name for a period. "
        "Use for profitability analysis, identifying best-performing services, "
        "or deciding where to focus sales effort."
    ),
    parameters={
        "type": "object",
        "properties": {
            "year": {
                "type": "integer",
                "description": "Calendar year. Defaults to current year.",
            },
            "month": {
                "type": "integer",
                "description": "Month 1–12. Omit to include the full year.",
            },
            "limit": {
                "type": "integer",
                "description": "How many top products to return (1–20). Defaults to 10.",
            },
        },
    },
)
async def get_product_performance(
    db: AsyncSession,
    org_id: str,
    year: int | None = None,
    month: int | None = None,
    limit: int = 10,
    **_: object,
) -> dict:
    from src.ai.repository import AiRepository

    repo = AiRepository(db, org_id)
    y = year if year is not None else date.today().year
    capped = min(max(limit, 1), 20)
    products = await repo.get_product_performance(y, month, capped)
    return {"year": y, "month": month, "products": products, "count": len(products)}
