import logging
from datetime import date, datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.expenses.models import Expense

logger = logging.getLogger(__name__)


class ExpenseRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all(
        self,
        date_from: date | None,
        date_to: date | None,
        category: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[Expense], int]:
        query = select(Expense).where(Expense.is_deleted == False)
        if date_from:
            query = query.where(Expense.date >= date_from)
        if date_to:
            query = query.where(Expense.date <= date_to)
        if category:
            query = query.where(Expense.category == category)
        total = (await self._db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
        query = query.order_by(Expense.date.desc()).limit(limit).offset(offset)
        result = await self._db.execute(query)
        return result.scalars().all(), total

    async def get_by_id(self, expense_id: str) -> Expense | None:
        result = await self._db.execute(
            select(Expense).where(Expense.id == expense_id, Expense.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> Expense:
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
