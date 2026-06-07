import logging

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import (
    EXPENSE_CATEGORY_IN_USE,
    EXPENSE_CATEGORY_NAME_EXISTS,
    RESOURCE_EXPENSE_CATEGORY,
)
from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import ConflictError, NotFoundError
from src.expense_categories.repository import ExpenseCategoryRepository
from src.expense_categories.schemas import (
    ExpenseCategoryCreateSchema,
    ExpenseCategoryResponseSchema,
    ExpenseCategoryUpdateSchema,
)

logger = logging.getLogger(__name__)


class ExpenseCategoryService:
    def __init__(self, db: AsyncSession, org_id: str) -> None:
        self._db = db
        self._repo = ExpenseCategoryRepository(db, org_id)

    async def list_categories(self) -> list[ExpenseCategoryResponseSchema]:
        categories = await self._repo.get_all()
        return [ExpenseCategoryResponseSchema.model_validate(c) for c in categories]

    async def create_category(
        self, data: ExpenseCategoryCreateSchema
    ) -> ExpenseCategoryResponseSchema:
        existing = await self._repo.get_by_name(data.name)
        if existing:
            raise ConflictError(EXPENSE_CATEGORY_NAME_EXISTS, ErrorCode.CATEGORY_NAME_EXISTS)
        category = await self._repo.create(data.model_dump())
        await self._db.commit()
        return ExpenseCategoryResponseSchema.model_validate(category)

    async def update_category(
        self, category_id: str, data: ExpenseCategoryUpdateSchema
    ) -> ExpenseCategoryResponseSchema:
        category = await self._repo.get_by_id(category_id)
        if not category:
            raise NotFoundError(RESOURCE_EXPENSE_CATEGORY, category_id)
        existing = await self._repo.get_by_name(data.name)
        if existing and existing.id != category_id:
            raise ConflictError(EXPENSE_CATEGORY_NAME_EXISTS, ErrorCode.CATEGORY_NAME_EXISTS)
        await self._repo.update(category, data.model_dump())
        await self._db.commit()
        refreshed = await self._repo.get_by_id(category_id)
        return ExpenseCategoryResponseSchema.model_validate(refreshed)

    async def delete_category(self, category_id: str) -> None:
        category = await self._repo.get_by_id(category_id)
        if not category:
            raise NotFoundError(RESOURCE_EXPENSE_CATEGORY, category_id)
        count = await self._repo.count_expenses(category_id)
        if count > 0:
            raise ConflictError(EXPENSE_CATEGORY_IN_USE, ErrorCode.CATEGORY_IN_USE)
        await self._repo.delete(category)
        await self._db.commit()
