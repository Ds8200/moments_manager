import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.customers.models import Customer

logger = logging.getLogger(__name__)


class CustomerRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all(
        self, search: str | None, limit: int, offset: int, has_email: bool | None = None
    ) -> tuple[list[Customer], int]:
        query = select(Customer).where(Customer.is_deleted == False)
        if search:
            query = query.where(Customer.name.ilike(f"%{search}%"))
        if has_email:
            query = query.where(Customer.email.isnot(None))
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self._db.execute(count_query)
        total = total_result.scalar_one()
        query = query.order_by(Customer.name).limit(limit).offset(offset)
        result = await self._db.execute(query)
        return result.scalars().all(), total

    async def get_by_id(self, customer_id: str) -> Customer | None:
        result = await self._db.execute(
            select(Customer).where(Customer.id == customer_id, Customer.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> Customer:
        customer = Customer(**data)
        self._db.add(customer)
        await self._db.flush()
        return customer

    async def update(self, customer: Customer, data: dict) -> Customer:
        for key, value in data.items():
            setattr(customer, key, value)
        await self._db.flush()
        return customer

    async def soft_delete(self, customer: Customer) -> None:
        customer.is_deleted = True
        customer.deleted_at = datetime.now(timezone.utc)
        await self._db.flush()
