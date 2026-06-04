import pytest
from unittest.mock import AsyncMock, MagicMock

from src.core.exceptions import ConflictError, NotFoundError
from src.expense_categories.schemas import (
    ExpenseCategoryCreateSchema,
    ExpenseCategoryUpdateSchema,
)
from src.expense_categories.service import ExpenseCategoryService

pytestmark = pytest.mark.asyncio


def _make_category(id: str = "cat-1", name: str = "ציוד"):
    cat = MagicMock()
    cat.id = id
    cat.name = name
    return cat


async def test_create_category_conflict(mocker) -> None:
    db = AsyncMock()
    svc = ExpenseCategoryService(db)
    mocker.patch.object(svc._repo, "get_by_name", return_value=_make_category())
    with pytest.raises(ConflictError):
        await svc.create_category(ExpenseCategoryCreateSchema(name="ציוד"))


async def test_delete_category_not_found(mocker) -> None:
    db = AsyncMock()
    svc = ExpenseCategoryService(db)
    mocker.patch.object(svc._repo, "get_by_id", return_value=None)
    with pytest.raises(NotFoundError):
        await svc.delete_category("missing")


async def test_delete_category_in_use(mocker) -> None:
    db = AsyncMock()
    svc = ExpenseCategoryService(db)
    mocker.patch.object(svc._repo, "get_by_id", return_value=_make_category())
    mocker.patch.object(svc._repo, "count_expenses", return_value=2)
    with pytest.raises(ConflictError) as exc_info:
        await svc.delete_category("cat-1")
    assert "CATEGORY_IN_USE" in str(exc_info.value.code)


async def test_delete_category_success(mocker) -> None:
    db = AsyncMock()
    svc = ExpenseCategoryService(db)
    mocker.patch.object(svc._repo, "get_by_id", return_value=_make_category())
    mocker.patch.object(svc._repo, "count_expenses", return_value=0)
    delete_mock = mocker.patch.object(svc._repo, "delete", return_value=None)
    await svc.delete_category("cat-1")
    delete_mock.assert_called_once()


async def test_update_category_not_found(mocker) -> None:
    db = AsyncMock()
    svc = ExpenseCategoryService(db)
    mocker.patch.object(svc._repo, "get_by_id", return_value=None)
    with pytest.raises(NotFoundError):
        await svc.update_category("missing", ExpenseCategoryUpdateSchema(name="חדש"))
