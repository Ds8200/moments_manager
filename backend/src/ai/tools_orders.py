"""Order lookup and detail tools for the AI agent."""

import logging
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.tool_registry import tool_registry

logger = logging.getLogger(__name__)


# ── Search Orders ──────────────────────────────────────────────────────────────


@tool_registry.register(
    name="search_orders",
    description=(
        "Free-text search across order numbers, customer names, and order notes. "
        "Use when the user refers to a specific order by a description, name, or partial info. "
        "After finding an order number, use get_order_items to see what's inside it."
    ),
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search text to match against order number, customer name, or notes.",  # noqa: E501
            },
            "limit": {
                "type": "integer",
                "description": "Maximum results to return (1–20). Defaults to 10.",
            },
        },
        "required": ["query"],
    },
)
async def search_orders(
    db: AsyncSession,
    org_id: str,
    query: str,
    limit: int = 10,
    **_: object,
) -> dict:
    from src.ai.repository import AiRepository

    repo = AiRepository(db, org_id)
    capped = min(max(limit, 1), 20)
    return await repo.search_orders(query.strip(), capped)


# ── Unpaid Invoices ────────────────────────────────────────────────────────────


@tool_registry.register(
    name="get_unpaid_invoices",
    description=(
        "Returns a list of unpaid orders with customer names, amounts, and age in days. "
        "Use for cash flow analysis, debt tracking, and deciding who to follow up with."
    ),
    parameters={
        "type": "object",
        "properties": {
            "min_days_old": {
                "type": "integer",
                "description": (
                    "Only include orders placed at least this many days ago. "
                    "Defaults to 0 (all unpaid). Use 30 for overdue-30-days filter."
                ),
            },
        },
    },
)
async def get_unpaid_invoices(
    db: AsyncSession,
    org_id: str,
    min_days_old: int = 0,
    **_: object,
) -> dict:
    from src.ai.repository import AiRepository

    repo = AiRepository(db, org_id)
    days = max(0, min_days_old)
    invoices = await repo.get_unpaid_invoices(days)
    total = sum(Decimal(i["total_amount"]) for i in invoices)
    return {
        "invoices": invoices,
        "count": len(invoices),
        "total_unpaid": str(total),
        "filter_min_days": days,
    }


# ── Order Items ────────────────────────────────────────────────────────────────


@tool_registry.register(
    name="get_order_items",
    description=(
        "Returns the full item breakdown of a specific order: product names, quantities, "
        "unit prices, totals, profit per item, and design notes. "
        "Use when the user asks what's in an order, what was ordered, or for production details."
    ),
    parameters={
        "type": "object",
        "properties": {
            "order_number": {
                "type": "string",
                "description": "The order number to look up (e.g. 'ORD-2025-0042').",
            },
        },
        "required": ["order_number"],
    },
)
async def get_order_items(
    db: AsyncSession,
    org_id: str,
    order_number: str,
    **_: object,
) -> dict:
    from src.ai.repository import AiRepository

    repo = AiRepository(db, org_id)
    result = await repo.get_order_items_by_number(order_number.strip())
    if result is None:
        candidates = await repo.search_order_numbers(order_number.strip())
        return {
            "not_found": True,
            "searched_for": order_number,
            "candidates": candidates,
        }
    return {"found": True, **result}
