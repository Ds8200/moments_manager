from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.core.exceptions import NotFoundError
from src.core.schemas import PaginationParams
from src.expenses.schemas import ExpenseCreateSchema, ExpenseUpdateSchema
from src.expenses.service import ExpenseService

pytestmark = pytest.mark.asyncio


def _make_expense() -> MagicMock:
    expense = MagicMock()
    expense.id = "e-1"
    expense.date = date.today()
    expense.category = "ink"
    expense.amount = Decimal("10")
    expense.notes = None
    expense.created_at = None
    expense.updated_at = None
    return expense


async def test_update_expense_not_found() -> None:
    db = AsyncMock()
    service = ExpenseService(db)
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.update_expense("missing", ExpenseUpdateSchema(category="x"))


async def test_delete_expense_not_found() -> None:
    db = AsyncMock()
    service = ExpenseService(db)
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.delete_expense("missing")


async def test_create_expense_commits() -> None:
    db = AsyncMock()
    service = ExpenseService(db)
    service._repo = AsyncMock()
    expense = _make_expense()
    service._repo.create.return_value = expense
    service._repo.get_by_id.return_value = expense

    await service.create_expense(
        ExpenseCreateSchema(date=date.today(), category="ink", amount=Decimal("10"))
    )

    db.commit.assert_awaited_once()


async def test_list_expenses_pagination() -> None:
    db = AsyncMock()
    service = ExpenseService(db)
    service._repo = AsyncMock()
    service._repo.get_all.return_value = ([_make_expense() for _ in range(3)], 7)

    result = await service.list_expenses(PaginationParams(page=1, page_size=3))

    assert result.total == 7
    assert result.pages == 3
