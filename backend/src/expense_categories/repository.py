import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import BaseRepository
from src.expense_categories.models import ExpenseCategory

logger = logging.getLogger(__name__)


class ExpenseCategoryRepository(BaseRepository):
    def __init__(self, db: AsyncSession, org_id: str) -> None:
        super().__init__(db, org_id)

    async def get_all(self) -> list[ExpenseCategory]:
        await self._apply_org_rls()
        result = await self._db.execute(
            select(ExpenseCategory)
            .where(ExpenseCategory.organization_id == self._org_id)
            .order_by(ExpenseCategory.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, category_id: str) -> ExpenseCategory | None:
        await self._apply_org_rls()
        result = await self._db.execute(
            select(ExpenseCategory).where(
                ExpenseCategory.id == category_id,
                ExpenseCategory.organization_id == self._org_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> ExpenseCategory | None:
        await self._apply_org_rls()
        result = await self._db.execute(
            select(ExpenseCategory).where(
                ExpenseCategory.name == name,
                ExpenseCategory.organization_id == self._org_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> ExpenseCategory:
        await self._apply_org_rls()
        data["organization_id"] = self._org_id
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
            .where(
                Expense.category_id == category_id,
                Expense.organization_id == self._org_id,
                Expense.is_deleted.is_(False),
            )
        )
        return result.scalar_one()
