"""Customer analysis tools for the AI agent."""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.tool_registry import tool_registry
from src.reports.service import ReportService

logger = logging.getLogger(__name__)


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


# ── Customer Detail ────────────────────────────────────────────────────────────


@tool_registry.register(
    name="get_customer_detail",
    description=(
        "Returns the full profile of a named customer: contact info (phone, email), "
        "order statistics (count, total spent), last order date, and their 3 most recent orders. "
        "Use for specific customer questions, before drafting a customer email, or when "
        "the user mentions a customer by name."
    ),
    parameters={
        "type": "object",
        "properties": {
            "customer_name": {
                "type": "string",
                "description": "Customer name or partial name to search for.",
            },
        },
        "required": ["customer_name"],
    },
)
async def get_customer_detail(
    db: AsyncSession,
    customer_name: str,
    **_: object,
) -> dict:
    from src.ai.repository import AiRepository

    repo = AiRepository(db)
    profile = await repo.get_customer_profile(customer_name)
    if profile is None:
        candidates = await repo.get_all_customer_names()
        return {
            "not_found": True,
            "searched_for": customer_name,
            "candidates": candidates,
        }
    return {"found": True, **profile}


# ── Inactive Customers ─────────────────────────────────────────────────────────


@tool_registry.register(
    name="get_inactive_customers",
    description=(
        "Returns customers who have not placed an order in the last N days. "
        "Use for churn detection, re-engagement campaign planning, or identifying "
        "clients who may have moved to a competitor."
    ),
    parameters={
        "type": "object",
        "properties": {
            "days_since_last_order": {
                "type": "integer",
                "description": "Customers with no order in this many days. Defaults to 90.",
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of customers to return (1–50). Defaults to 10.",
            },
        },
    },
)
async def get_inactive_customers(
    db: AsyncSession,
    days_since_last_order: int = 90,
    limit: int = 10,
    **_: object,
) -> dict:
    from src.ai.repository import AiRepository

    repo = AiRepository(db)
    days = max(1, days_since_last_order)
    capped = min(max(limit, 1), 50)
    customers = await repo.get_inactive_customers(days, capped)
    return {
        "customers": customers,
        "count": len(customers),
        "threshold_days": days,
    }
