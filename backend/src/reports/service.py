import logging
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import select, func, extract, and_
from sqlalchemy.ext.asyncio import AsyncSession

from src.customers.models import Customer
from src.expenses.models import Expense
from src.orders.enums import OrderStatus, PaymentMethod
from src.orders.models import Order
from src.reports.schemas import (
    DashboardKpiSchema,
    FinancialYearSchema,
    MonthlyReportSchema,
    TopCustomerSchema,
)

logger = logging.getLogger(__name__)


class ReportService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_dashboard_kpi(self) -> DashboardKpiSchema:
        today = date.today()
        active_statuses = [
            OrderStatus.new, OrderStatus.waiting_approval,
            OrderStatus.approved, OrderStatus.printing,
        ]

        open_result = await self._db.execute(
            select(func.count(Order.id)).where(
                Order.is_deleted == False,
                Order.status.in_([s.value for s in active_statuses]),
            )
        )
        open_orders = open_result.scalar_one()

        ready_result = await self._db.execute(
            select(func.count(Order.id)).where(
                Order.is_deleted == False,
                Order.status == OrderStatus.ready.value,
            )
        )
        ready_orders = ready_result.scalar_one()

        month_revenue_result = await self._db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.is_deleted == False,
                extract("year", Order.date) == today.year,
                extract("month", Order.date) == today.month,
            )
        )
        monthly_revenue = Decimal(str(month_revenue_result.scalar_one()))

        month_profit_result = await self._db.execute(
            select(func.coalesce(func.sum(Order.total_profit), 0)).where(
                Order.is_deleted == False,
                extract("year", Order.date) == today.year,
                extract("month", Order.date) == today.month,
            )
        )
        monthly_profit = Decimal(str(month_profit_result.scalar_one()))

        unpaid_result = await self._db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.is_deleted == False,
                Order.is_paid == False,
                Order.status != OrderStatus.cancelled.value,
            )
        )
        unpaid_amount = Decimal(str(unpaid_result.scalar_one()))

        today_result = await self._db.execute(
            select(func.count(Order.id)).where(
                Order.is_deleted == False,
                Order.date == today,
            )
        )
        today_orders = today_result.scalar_one()

        return DashboardKpiSchema(
            open_orders=open_orders,
            ready_orders=ready_orders,
            monthly_revenue=monthly_revenue,
            monthly_profit=monthly_profit,
            unpaid_amount=unpaid_amount,
            today_orders=today_orders,
        )

    async def get_monthly_report(self, year: int, month: int) -> MonthlyReportSchema:
        base_filter = and_(
            Order.is_deleted == False,
            extract("year", Order.date) == year,
            extract("month", Order.date) == month,
        )

        rev_result = await self._db.execute(
            select(
                func.coalesce(func.sum(Order.total_amount), 0),
                func.coalesce(func.sum(Order.total_cost), 0),
                func.coalesce(func.sum(Order.total_profit), 0),
                func.count(Order.id),
            ).where(base_filter)
        )
        row = rev_result.one()
        total_revenue, total_cost, total_profit, order_count = (
            Decimal(str(row[0])), Decimal(str(row[1])), Decimal(str(row[2])), row[3]
        )

        cash_result = await self._db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                base_filter, Order.payment_method == PaymentMethod.cash.value
            )
        )
        cash_revenue = Decimal(str(cash_result.scalar_one()))

        transfer_result = await self._db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                base_filter, Order.payment_method == PaymentMethod.transfer.value
            )
        )
        transfer_revenue = Decimal(str(transfer_result.scalar_one()))

        exp_result = await self._db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(
                Expense.is_deleted == False,
                extract("year", Expense.date) == year,
                extract("month", Expense.date) == month,
            )
        )
        total_expenses = Decimal(str(exp_result.scalar_one()))

        return MonthlyReportSchema(
            year=year, month=month,
            total_revenue=total_revenue, total_cost=total_cost,
            total_profit=total_profit, total_expenses=total_expenses,
            net_profit=total_profit - total_expenses,
            cash_revenue=cash_revenue, transfer_revenue=transfer_revenue,
            order_count=order_count,
        )

    async def get_financial_year(self, year: int) -> FinancialYearSchema:
        monthly_data = []
        for month in range(1, 13):
            monthly_data.append(await self.get_monthly_report(year, month))

        total_revenue = sum(m.total_revenue for m in monthly_data)
        total_expenses = sum(m.total_expenses for m in monthly_data)
        net_profit = sum(m.net_profit for m in monthly_data)

        annual_profit = sum(m.total_profit for m in monthly_data)

        return FinancialYearSchema(
            year=year,
            months=monthly_data,
            annual_revenue=total_revenue,
            annual_profit=annual_profit,
            annual_expenses=total_expenses,
            annual_net=net_profit,
        )

    async def get_top_customers(self, limit: int = 10) -> list[TopCustomerSchema]:
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
        return [
            TopCustomerSchema(
                customer_id=row[0],
                customer_name=row[1],
                order_count=row[2],
                total_revenue=Decimal(str(row[3])),
                total_profit=Decimal(str(row[4])),
            )
            for row in result.all()
        ]
