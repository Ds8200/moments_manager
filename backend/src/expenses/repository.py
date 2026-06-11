import logging
from datetime import date, datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.database import BaseRepository
from src.expenses.models import Expense

logger = logging.getLogger(__name__)


class ExpenseRepository(BaseRepository):
    def __init__(self, db: AsyncSession, org_id: str) -> None:
        super().__init__(db, org_id)

    async def get_all(
        self,
        date_from: date | None,
        date_to: date | None,
        category_id: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[Expense], int]:
        await self._apply_org_rls()
        base = select(Expense).where(
            Expense.is_deleted.is_(False),
            Expense.organization_id == self._org_id,
        )
        if date_from:
            base = base.where(Expense.date >= date_from)
        if date_to:
            base = base.where(Expense.date <= date_to)
        if category_id:
            base = base.where(Expense.category_id == category_id)

        count_q = select(func.count()).select_from(base.subquery())
        total = (await self._db.execute(count_q)).scalar_one()

        items_q = (
            base.options(selectinload(Expense.category))
            .order_by(Expense.date.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._db.execute(items_q)
        return list(result.scalars().all()), total

    async def get_by_id(self, expense_id: str) -> Expense | None:
        await self._apply_org_rls()
        result = await self._db.execute(
            select(Expense)
            .options(selectinload(Expense.category))
            .where(
                Expense.id == expense_id,
                Expense.is_deleted.is_(False),
                Expense.organization_id == self._org_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> Expense:
        await self._apply_org_rls()
        data["organization_id"] = self._org_id
        expense = Expense(**data)
        self._db.add(expense)
        await self._db.flush()
        return expense

    async def update(self, expense: Expense, data: dict) -> Expense:
        for key, value in data.items():
            setattr(expense, key, value)
        await self._db.flush()
        return expense

    async def soft_delete(self, expense: Expense) -> None:
        expense.is_deleted = True
        expense.deleted_at = datetime.now(timezone.utc)
        await self._db.flush()
