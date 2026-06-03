import logging
from datetime import date
from decimal import Decimal

from sqlalchemy import and_, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.customers.models import Customer
from src.expenses.models import Expense
from src.orders.enums import OrderStatus, PaymentMethod
from src.orders.models import Order

logger = logging.getLogger(__name__)


class ReportRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def count_open_orders(self) -> int:
        active_statuses = [
            OrderStatus.new,
            OrderStatus.waiting_approval,
            OrderStatus.approved,
            OrderStatus.printing,
        ]
        result = await self._db.execute(
            select(func.count(Order.id)).where(
                Order.is_deleted == False,
                Order.status.in_([s.value for s in active_statuses]),
            )
        )
        return result.scalar_one()

    async def count_ready_orders(self) -> int:
        result = await self._db.execute(
            select(func.count(Order.id)).where(
                Order.is_deleted == False,
                Order.status == OrderStatus.ready.value,
            )
        )
        return result.scalar_one()

    async def sum_month_revenue(self, year: int, month: int) -> Decimal:
        result = await self._db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.is_deleted == False,
                extract("year", Order.date) == year,
                extract("month", Order.date) == month,
            )
        )
        return Decimal(str(result.scalar_one()))

    async def sum_month_profit(self, year: int, month: int) -> Decimal:
        result = await self._db.execute(
            select(func.coalesce(func.sum(Order.total_profit), 0)).where(
                Order.is_deleted == False,
                extract("year", Order.date) == year,
                extract("month", Order.date) == month,
            )
        )
        return Decimal(str(result.scalar_one()))

    async def sum_unpaid_amount(self) -> Decimal:
        result = await self._db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.is_deleted == False,
                Order.is_paid == False,
                Order.status != OrderStatus.cancelled.value,
            )
        )
        return Decimal(str(result.scalar_one()))

    async def count_orders_on_date(self, day: date) -> int:
        result = await self._db.execute(
            select(func.count(Order.id)).where(
                Order.is_deleted == False,
                Order.date == day,
            )
        )
        return result.scalar_one()

    async def month_orders_summary(
        self, year: int, month: int
    ) -> tuple[Decimal, Decimal, Decimal, int]:
        base_filter = and_(
            Order.is_deleted == False,
            extract("year", Order.date) == year,
            extract("month", Order.date) == month,
        )
        result = await self._db.execute(
            select(
                func.coalesce(func.sum(Order.total_amount), 0),
                func.coalesce(func.sum(Order.total_cost), 0),
                func.coalesce(func.sum(Order.total_profit), 0),
                func.count(Order.id),
            ).where(base_filter)
        )
        row = result.one()
        return (
            Decimal(str(row[0])),
            Decimal(str(row[1])),
            Decimal(str(row[2])),
            row[3],
        )

    async def month_revenue_by_payment_method(
        self, year: int, month: int, method: PaymentMethod
    ) -> Decimal:
        base_filter = and_(
            Order.is_deleted == False,
            Order.is_paid == True,
            extract("year", Order.date) == year,
            extract("month", Order.date) == month,
        )
        result = await self._db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                base_filter, Order.payment_method == method.value
            )
        )
        return Decimal(str(result.scalar_one()))

    async def sum_month_paid_revenue(self, year: int, month: int) -> Decimal:
        result = await self._db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.is_deleted == False,
                Order.is_paid == True,
                extract("year", Order.date) == year,
                extract("month", Order.date) == month,
            )
        )
        return Decimal(str(result.scalar_one()))

    async def sum_month_expenses(self, year: int, month: int) -> Decimal:
        result = await self._db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(
                Expense.is_deleted == False,
                extract("year", Expense.date) == year,
                extract("month", Expense.date) == month,
            )
        )
        return Decimal(str(result.scalar_one()))

    async def get_top_customers(self, limit: int) -> list[tuple]:
        result = await self._db.execute(
            select(
                Customer.id,
                Customer.name,
                func.count(Order.id).label("total_orders"),
                func.coalesce(func.sum(Order.total_amount), 0).label("total_spent"),
                func.coalesce(func.sum(Order.total_profit), 0).label("total_profit"),
            )
            .join(Order, Order.customer_id == Customer.id, isouter=True)
            .where(Customer.is_deleted == False, Order.is_deleted == False)
            .group_by(Customer.id, Customer.name)
            .order_by(func.sum(Order.total_amount).desc())
            .limit(limit)
        )
        return list(result.all())
