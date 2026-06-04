from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.core.exceptions import NotFoundError
from src.core.schemas import PaginationParams
from src.products.schemas import ProductCreateSchema, ProductUpdateSchema
from src.products.service import ProductService

pytestmark = pytest.mark.asyncio


def _make_product(name: str = "P1") -> MagicMock:
    product = MagicMock()
    product.id = "p-1"
    product.name = name
    product.category = None
    product.category_id = None
    product.base_price = Decimal("10")
    product.base_cost = Decimal("3")
    product.avg_production_days = 1
    product.is_active = True
    product.created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    product.updated_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    return product


async def test_get_product_not_found() -> None:
    db = AsyncMock()
    service = ProductService(db)
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.get_product("missing")


async def test_update_product_not_found() -> None:
    db = AsyncMock()
    service = ProductService(db)
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.update_product("missing", ProductUpdateSchema(name="X"))


async def test_delete_product_not_found() -> None:
    db = AsyncMock()
    service = ProductService(db)
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.delete_product("missing")


async def test_create_product_returns_response() -> None:
    db = AsyncMock()
    service = ProductService(db)
    service._repo = AsyncMock()
    product = _make_product("New")
    service._repo.create.return_value = product
    service._repo.get_by_id.return_value = product

    result = await service.create_product(ProductCreateSchema(name="New"))

    assert result.name == "New"
    db.commit.assert_awaited_once()


async def test_list_products_pagination() -> None:
    db = AsyncMock()
    service = ProductService(db)
    service._repo = AsyncMock()
    service._repo.get_all.return_value = ([_make_product() for _ in range(2)], 10)

    result = await service.list_products(PaginationParams(page=1, page_size=5))

    assert result.total == 10
    assert result.pages == 2
