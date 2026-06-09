import logging
from datetime import date
from decimal import Decimal

from sqlalchemy import and_, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.customers.models import Customer
from src.database import BaseRepository
from src.expenses.models import Expense
from src.orders.enums import OrderStatus, PaymentMethod
from src.orders.models import Order

logger = logging.getLogger(__name__)


class ReportRepository(BaseRepository):
    def __init__(self, db: AsyncSession, org_id: str) -> None:
        super().__init__(db, org_id)

    async def get_dashboard_aggregate(
        self, year: int, month: int, today: date
    ) -> tuple[int, int, Decimal, Decimal, Decimal, int]:
        """Replaces 6 sequential order queries with one conditional-aggregation query."""
        await self._apply_org_rls()
        active = [
            OrderStatus.new.value,
            OrderStatus.waiting_approval.value,
            OrderStatus.approved.value,
            OrderStatus.printing.value,
        ]
        cancelled = OrderStatus.cancelled.value
        result = await self._db.execute(
            select(
                func.count(Order.id).filter(Order.status.in_(active)).label("open_orders"),
                func.count(Order.id).filter(
                    Order.status == OrderStatus.ready.value
                ).label("ready_orders"),
                func.coalesce(
                    func.sum(Order.total_amount).filter(
                        and_(
                            Order.is_paid == True,
                            extract("year", Order.date) == year,
                            extract("month", Order.date) == month,
                        )
                    ),
                    0,
                ).label("monthly_revenue"),
                func.coalesce(
                    func.sum(Order.total_profit).filter(
                        and_(
                            Order.is_paid == True,
                            extract("year", Order.date) == year,
                            extract("month", Order.date) == month,
                        )
                    ),
                    0,
                ).label("monthly_profit"),
                func.coalesce(
                    func.sum(Order.total_amount).filter(
                        and_(Order.is_paid == False, Order.status != cancelled)
                    ),
                    0,
                ).label("unpaid_amount"),
                func.count(Order.id).filter(Order.date == today).label("today_orders"),
            ).where(Order.is_deleted == False, Order.organization_id == self._org_id)
        )
        row = result.one()
        return (
            row.open_orders,
            row.ready_orders,
            Decimal(str(row.monthly_revenue)),
            Decimal(str(row.monthly_profit)),
            Decimal(str(row.unpaid_amount)),
            row.today_orders,
        )

    async def month_orders_summary(
        self, year: int, month: int
    ) -> tuple[Decimal, Decimal, Decimal, int]:
        await self._apply_org_rls()
        base_filter = and_(
            Order.is_deleted == False,
            Order.organization_id == self._org_id,
            Order.is_paid == True,
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
        await self._apply_org_rls()
        base_filter = and_(
            Order.is_deleted == False,
            Order.organization_id == self._org_id,
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
        await self._apply_org_rls()
        result = await self._db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.is_deleted == False,
                Order.organization_id == self._org_id,
                Order.is_paid == True,
                extract("year", Order.date) == year,
                extract("month", Order.date) == month,
            )
        )
        return Decimal(str(result.scalar_one()))

    async def count_month_unpaid_orders(self, year: int, month: int) -> int:
        await self._apply_org_rls()
        result = await self._db.execute(
            select(func.count(Order.id)).where(
                Order.is_deleted == False,
                Order.organization_id == self._org_id,
                Order.is_paid == False,
                Order.status != OrderStatus.cancelled.value,
                extract("year", Order.date) == year,
                extract("month", Order.date) == month,
            )
        )
        return result.scalar_one()

    async def sum_month_unpaid_amount(self, year: int, month: int) -> Decimal:
        await self._apply_org_rls()
        result = await self._db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.is_deleted == False,
                Order.organization_id == self._org_id,
                Order.is_paid == False,
                Order.status != OrderStatus.cancelled.value,
                extract("year", Order.date) == year,
                extract("month", Order.date) == month,
            )
        )
        return Decimal(str(result.scalar_one()))

    async def sum_month_expenses(self, year: int, month: int) -> Decimal:
        await self._apply_org_rls()
        result = await self._db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(
                Expense.is_deleted == False,
                Expense.organization_id == self._org_id,
                extract("year", Expense.date) == year,
                extract("month", Expense.date) == month,
            )
        )
        return Decimal(str(result.scalar_one()))

    async def get_year_orders_by_month(self, year: int) -> dict[int, dict]:
        """Replaces 12 × 6 sequential per-month order queries with one aggregation query."""
        await self._apply_org_rls()
        cancelled = OrderStatus.cancelled.value
        result = await self._db.execute(
            select(
                extract("month", Order.date).label("month"),
                func.coalesce(
                    func.sum(Order.total_amount).filter(Order.is_paid == True), 0
                ).label("paid_revenue"),
                func.coalesce(
                    func.sum(Order.total_cost).filter(Order.is_paid == True), 0
                ).label("total_cost"),
                func.coalesce(
                    func.sum(Order.total_profit).filter(Order.is_paid == True), 0
                ).label("total_profit"),
                func.count(Order.id).filter(Order.is_paid == True).label("paid_count"),
                func.count(Order.id).filter(
                    and_(Order.is_paid == False, Order.status != cancelled)
                ).label("unpaid_count"),
                func.coalesce(
                    func.sum(Order.total_amount).filter(
                        and_(Order.is_paid == False, Order.status != cancelled)
                    ),
                    0,
                ).label("unpaid_amount"),
                func.coalesce(
                    func.sum(Order.total_amount).filter(
                        and_(
                            Order.is_paid == True,
                            Order.payment_method == PaymentMethod.cash.value,
                        )
                    ),
                    0,
                ).label("cash_revenue"),
                func.coalesce(
                    func.sum(Order.total_amount).filter(
                        and_(
                            Order.is_paid == True,
                            Order.payment_method == PaymentMethod.transfer.value,
                        )
                    ),
                    0,
                ).label("transfer_revenue"),
            )
            .where(
                Order.is_deleted == False,
                Order.organization_id == self._org_id,
                extract("year", Order.date) == year,
            )
            .group_by(extract("month", Order.date))
        )
        return {int(row.month): dict(row._mapping) for row in result.all()}

    async def get_year_expenses_by_month(self, year: int) -> dict[int, Decimal]:
        """Replaces 12 sequential per-month expense queries with one aggregation query."""
        await self._apply_org_rls()
        result = await self._db.execute(
            select(
                extract("month", Expense.date).label("month"),
                func.coalesce(func.sum(Expense.amount), 0).label("total_expenses"),
            )
            .where(
                Expense.is_deleted == False,
                Expense.organization_id == self._org_id,
                extract("year", Expense.date) == year,
            )
            .group_by(extract("month", Expense.date))
        )
        return {int(row.month): Decimal(str(row.total_expenses)) for row in result.all()}

    async def get_top_customers(self, limit: int) -> list[tuple]:
        await self._apply_org_rls()
        result = await self._db.execute(
            select(
                Customer.id,
                Customer.name,
                func.count(Order.id).label("total_orders"),
                func.coalesce(func.sum(Order.total_amount), 0).label("total_spent"),
                func.coalesce(func.sum(Order.total_profit), 0).label("total_profit"),
            )
            .join(Order, Order.customer_id == Customer.id, isouter=True)
            .where(
                Customer.is_deleted == False,
                Customer.organization_id == self._org_id,
                Order.is_deleted == False,
                Order.organization_id == self._org_id,
            )
            .group_by(Customer.id, Customer.name)
            .order_by(func.sum(Order.total_amount).desc())
            .limit(limit)
        )
        return list(result.all())
