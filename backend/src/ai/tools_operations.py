"""Dashboard and order-overview tools for the AI agent."""

import logging
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import text

from src.ai.tool_registry import tool_registry
from src.orders.enums import OrderStatus
from src.orders.models import Order
from src.reports.service import ReportService

logger = logging.getLogger(__name__)


# ── Dashboard KPIs ─────────────────────────────────────────────────────────────


@tool_registry.register(
    name="get_dashboard_kpis",
    description=(
        "Returns current business KPIs: open orders, ready orders, "
        "monthly revenue, monthly expenses, monthly profit, unpaid amount, "
        "and today's order count. Use for general business status questions."
    ),
    parameters={"type": "object", "properties": {}},
)
async def get_dashboard_kpis(db: AsyncSession, org_id: str, **_: object) -> dict:
    svc = ReportService(db, org_id)
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
    org_id: str,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    **_: object,
) -> dict:
    # Raw SQL required: PostgreSQL SET LOCAL has no SQLAlchemy ORM equivalent.
    await db.execute(text("SET LOCAL app.current_org_id = :org_id"), {"org_id": org_id})

    filters = [Order.organization_id == org_id, Order.is_deleted.is_(False)]
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
    avg_value = round(float(total_revenue) / count, 2) if count > 0 else 0.0
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
        "identify patterns, or answer questions about specific recent orders. "
        "To see the items inside a specific order, use get_order_items."
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
    org_id: str,
    limit: int = 10,
    status: str | None = None,
    **_: object,
) -> dict:
    # Raw SQL required: PostgreSQL SET LOCAL has no SQLAlchemy ORM equivalent.
    await db.execute(text("SET LOCAL app.current_org_id = :org_id"), {"org_id": org_id})

    capped = min(max(limit, 1), 20)
    filters = [Order.organization_id == org_id, Order.is_deleted.is_(False)]
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
async def get_overdue_orders(db: AsyncSession, org_id: str, **_: object) -> dict:
    # Raw SQL required: PostgreSQL SET LOCAL has no SQLAlchemy ORM equivalent.
    await db.execute(text("SET LOCAL app.current_org_id = :org_id"), {"org_id": org_id})

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
                Order.organization_id == org_id,
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


# ── Pipeline Value ─────────────────────────────────────────────────────────────


@tool_registry.register(
    name="get_pipeline_value",
    description=(
        "Returns the total value and count of all active (open) orders, grouped by status. "
        "Use for forward-looking revenue estimation and workload capacity questions."
    ),
    parameters={"type": "object", "properties": {}},
)
async def get_pipeline_value(db: AsyncSession, org_id: str, **_: object) -> dict:
    from src.ai.repository import AiRepository

    repo = AiRepository(db, org_id)
    return await repo.get_pipeline_by_status()
