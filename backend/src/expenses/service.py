import logging
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import RESOURCE_EXPENSE
from src.core.exceptions import NotFoundError
from src.core.schemas import PaginatedResponse, PaginationParams
from src.expenses.repository import ExpenseRepository
from src.expenses.schemas import (
    ExpenseCreateSchema,
    ExpenseResponseSchema,
    ExpenseUpdateSchema,
)

logger = logging.getLogger(__name__)


class ExpenseService:
    def __init__(self, db: AsyncSession, org_id: str) -> None:
        self._db = db
        self._repo = ExpenseRepository(db, org_id)

    async def list_expenses(
        self,
        params: PaginationParams,
        date_from: date | None = None,
        date_to: date | None = None,
        category_id: str | None = None,
    ) -> PaginatedResponse[ExpenseResponseSchema]:
        expenses, total = await self._repo.get_all(
            date_from, date_to, category_id, params.page_size, params.offset
        )
        pages = params.compute_pages(total)
        return PaginatedResponse(
            items=[ExpenseResponseSchema.model_validate(e) for e in expenses],
            total=total,
            page=params.page,
            page_size=params.page_size,
            pages=pages,
        )

    async def create_expense(self, data: ExpenseCreateSchema) -> ExpenseResponseSchema:
        expense = await self._repo.create(data.model_dump(exclude_none=True))
        await self._db.commit()
        refreshed = await self._repo.get_by_id(expense.id)
        return ExpenseResponseSchema.model_validate(refreshed)

    async def update_expense(
        self, expense_id: str, data: ExpenseUpdateSchema
    ) -> ExpenseResponseSchema:
        expense = await self._repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundError(RESOURCE_EXPENSE, expense_id)
        update_data = data.model_dump(exclude_none=True)
        if "category_id" in data.model_fields_set and data.category_id is None:
            update_data["category_id"] = None
        await self._repo.update(expense, update_data)
        await self._db.commit()
        refreshed = await self._repo.get_by_id(expense_id)
        return ExpenseResponseSchema.model_validate(refreshed)

    async def delete_expense(self, expense_id: str) -> None:
        expense = await self._repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundError(RESOURCE_EXPENSE, expense_id)
        await self._repo.soft_delete(expense)
        await self._db.commit()
