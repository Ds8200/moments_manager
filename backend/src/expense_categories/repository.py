import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.expense_categories.models import ExpenseCategory

logger = logging.getLogger(__name__)


class ExpenseCategoryRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all(self) -> list[ExpenseCategory]:
        result = await self._db.execute(
            select(ExpenseCategory).order_by(ExpenseCategory.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, category_id: str) -> ExpenseCategory | None:
        result = await self._db.execute(
            select(ExpenseCategory).where(ExpenseCategory.id == category_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> ExpenseCategory | None:
        result = await self._db.execute(
            select(ExpenseCategory).where(ExpenseCategory.name == name)
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> ExpenseCategory:
        category = ExpenseCategory(**data)
        self._db.add(category)
        await self._db.flush()
        return category

    async def update(self, category: ExpenseCategory, data: dict) -> ExpenseCategory:
        for key, value in data.items():
            setattr(category, key, value)
        await self._db.flush()
        return category

    async def delete(self, category: ExpenseCategory) -> None:
        await self._db.delete(category)
        await self._db.flush()

    async def count_expenses(self, category_id: str) -> int:
        # Import here to avoid circular import at module level
        from src.expenses.models import Expense

        result = await self._db.execute(
            select(func.count())
            .select_from(Expense)
            .where(Expense.category_id == category_id, Expense.is_deleted.is_(False))
        )
        return result.scalar_one()
