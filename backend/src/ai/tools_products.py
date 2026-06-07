"""Product catalog tools for the AI agent."""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.tool_registry import tool_registry

logger = logging.getLogger(__name__)


# ── Product Catalog ────────────────────────────────────────────────────────────


@tool_registry.register(
    name="get_product_catalog",
    description=(
        "Returns the product/service catalog with names, categories, base prices, "
        "and average production time. Use when the user asks about pricing, "
        "what services the business offers, or the cost of a specific product type."
    ),
    parameters={
        "type": "object",
        "properties": {
            "search": {
                "type": "string",
                "description": "Optional product name to search for (partial match).",
            },
            "active_only": {
                "type": "boolean",
                "description": "If true, only return active products. Defaults to true.",
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of products to return (1–50). Defaults to 20.",
            },
        },
    },
)
async def get_product_catalog(
    db: AsyncSession,
    search: str | None = None,
    active_only: bool = True,
    limit: int = 20,
    **_: object,
) -> dict:
    from src.ai.repository import AiRepository

    repo = AiRepository(db)
    capped = min(max(limit, 1), 50)
    products = await repo.get_product_catalog(search, active_only, capped)
    if search and len(products) == 0:
        candidates = await repo.get_all_product_names(active_only=active_only)
        return {
            "not_found": True,
            "searched_for": search,
            "candidates": candidates,
        }
    return {
        "products": products,
        "count": len(products),
        "active_only": active_only,
    }
