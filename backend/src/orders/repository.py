import logging
from datetime import date, datetime, timezone
from decimal import Decimal
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.customers.models import Customer
from src.orders.models import Order, OrderItem, OrderFile

logger = logging.getLogger(__name__)


class OrderRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_next_order_number(self) -> str:
        year = datetime.now().year
        prefix = f"ORD-{year}-"
        result = await self._db.execute(
            select(func.max(Order.order_number)).where(
                Order.order_number.like(f"{prefix}%")
            )
        )
        max_number = result.scalar_one_or_none()
        last_seq = int(max_number.split("-")[-1]) if max_number else 0
        return f"{prefix}{last_seq + 1:04d}"

    async def get_all(
        self,
        status: str | None,
        date_from: date | None,
        date_to: date | None,
        customer_id: str | None,
        is_paid: bool | None,
        payment_method: str | None,
        search: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[Order], int]:
        filters = [Order.is_deleted == False]
        if status:
            filters.append(Order.status == status)
        if date_from:
            filters.append(Order.date >= date_from)
        if date_to:
            filters.append(Order.date <= date_to)
        if customer_id:
            filters.append(Order.customer_id == customer_id)
        if is_paid is not None:
            filters.append(Order.is_paid == is_paid)
        if payment_method is not None:
            filters.append(Order.payment_method == payment_method)
        if search:
            term = f"%{search}%"
            customer_ids = select(Customer.id).where(Customer.name.ilike(term))
            item_order_ids = select(OrderItem.order_id).where(OrderItem.product_name.ilike(term))
            filters.append(or_(Order.customer_id.in_(customer_ids), Order.id.in_(item_order_ids)))

        query = select(Order).where(and_(*filters))
        count_q = select(func.count()).select_from(query.subquery())
        total = (await self._db.execute(count_q)).scalar_one()

        query = (
            query.options(selectinload(Order.items), selectinload(Order.customer))
            .order_by(Order.due_datetime.asc().nullslast(), Order.date.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._db.execute(query)
        return result.scalars().all(), total

    async def get_by_id(self, order_id: str) -> Order | None:
        result = await self._db.execute(
            select(Order)
            .options(selectinload(Order.items), selectinload(Order.files), selectinload(Order.customer))
            .where(Order.id == order_id, Order.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_customer(self, customer_id: str) -> list[Order]:
        result = await self._db.execute(
            select(Order)
            .options(selectinload(Order.items), selectinload(Order.customer))
            .where(Order.customer_id == customer_id, Order.is_deleted == False)
            .order_by(Order.due_datetime.asc().nullslast(), Order.date.desc())
        )
        return result.scalars().all()

    async def create(self, data: dict, items_data: list[dict]) -> Order:
        order = Order(**data)
        self._db.add(order)
        await self._db.flush()
        for item_data in items_data:
            item = OrderItem(order_id=order.id, **item_data)
            self._db.add(item)
        await self._db.flush()
        await self._recalculate_totals(order)
        return order

    async def update(self, order: Order, data: dict, items_data: list[dict] | None) -> Order:
        for key, value in data.items():
            setattr(order, key, value)
        if items_data is not None:
            for item in list(order.items):
                await self._db.delete(item)
            await self._db.flush()
            for item_data in items_data:
                item = OrderItem(order_id=order.id, **item_data)
                self._db.add(item)
            await self._db.flush()
        await self._recalculate_totals(order)
        return order

    async def _recalculate_totals(self, order: Order) -> None:
        result = await self._db.execute(
            select(
                func.coalesce(func.sum(OrderItem.total_price), 0),
                func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_cost), 0),
                func.coalesce(func.sum(OrderItem.profit), 0),
            ).where(OrderItem.order_id == order.id)
        )
        row = result.one()
        order.total_amount = row[0]
        order.total_cost = row[1]
        order.total_profit = row[2]

    async def soft_delete(self, order: Order) -> None:
        order.is_deleted = True
        order.deleted_at = datetime.now(timezone.utc)
        await self._db.flush()

    async def add_file(self, order_id: str, file_data: dict) -> OrderFile:
        f = OrderFile(order_id=order_id, **file_data)
        self._db.add(f)
        await self._db.flush()
        return f

    async def get_file(self, file_id: str, order_id: str) -> OrderFile | None:
        result = await self._db.execute(
            select(OrderFile).where(
                OrderFile.id == file_id, OrderFile.order_id == order_id
            )
        )
        return result.scalar_one_or_none()

    async def delete_file(self, order_file: OrderFile) -> None:
        await self._db.delete(order_file)
        await self._db.flush()

    async def get_customer_stats(self, customer_id: str) -> dict:
        result = await self._db.execute(
            select(
                func.count(Order.id),
                func.coalesce(func.sum(Order.total_amount), 0),
            ).where(Order.customer_id == customer_id, Order.is_deleted == False)
        )
        row = result.one()
        return {"total_orders": row[0], "total_spent": float(row[1])}
