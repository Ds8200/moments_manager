from unittest.mock import AsyncMock, MagicMock

import pytest

from src.core.exceptions import ConflictError, NotFoundError
from src.product_categories.schemas import (
    ProductCategoryCreateSchema,
)
from src.product_categories.service import ProductCategoryService

pytestmark = pytest.mark.asyncio

_ORG_ID = "00000000-0000-0000-0000-000000000000"


def _make_category(id: str = "cat-1", name: str = "הדפסה"):
    cat = MagicMock()
    cat.id = id
    cat.name = name
    return cat


async def test_list_categories_returns_all(mocker) -> None:
    db = AsyncMock()
    svc = ProductCategoryService(db, _ORG_ID)
    cat = _make_category()
    mocker.patch.object(svc._repo, "get_all", return_value=[cat])
    mocker.patch(
        "src.product_categories.service.ProductCategoryResponseSchema.model_validate",
        return_value=MagicMock(id=cat.id, name=cat.name),
    )
    result = await svc.list_categories()
    assert len(result) == 1


async def test_create_category_conflict(mocker) -> None:
    db = AsyncMock()
    svc = ProductCategoryService(db, _ORG_ID)
    mocker.patch.object(svc._repo, "get_by_name", return_value=_make_category())
    with pytest.raises(ConflictError):
        await svc.create_category(ProductCategoryCreateSchema(name="הדפסה"))


async def test_delete_category_not_found(mocker) -> None:
    db = AsyncMock()
    svc = ProductCategoryService(db, _ORG_ID)
    mocker.patch.object(svc._repo, "get_by_id", return_value=None)
    with pytest.raises(NotFoundError):
        await svc.delete_category("missing")


async def test_delete_category_in_use(mocker) -> None:
    db = AsyncMock()
    svc = ProductCategoryService(db, _ORG_ID)
    mocker.patch.object(svc._repo, "get_by_id", return_value=_make_category())
    mocker.patch.object(svc._repo, "count_products", return_value=3)
    with pytest.raises(ConflictError) as exc_info:
        await svc.delete_category("cat-1")
    assert "CATEGORY_IN_USE" in str(exc_info.value.code)


async def test_delete_category_success(mocker) -> None:
    db = AsyncMock()
    svc = ProductCategoryService(db, _ORG_ID)
    mocker.patch.object(svc._repo, "get_by_id", return_value=_make_category())
    mocker.patch.object(svc._repo, "count_products", return_value=0)
    delete_mock = mocker.patch.object(svc._repo, "delete", return_value=None)
    await svc.delete_category("cat-1")
    delete_mock.assert_called_once()
