import logging
from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from src.orders.enums import PaymentMethod
from src.reports.repository import ReportRepository
from src.reports.schemas import (
    DashboardKpiSchema,
    FinancialYearSchema,
    MonthlyReportSchema,
    TopCustomerSchema,
)

logger = logging.getLogger(__name__)


class ReportService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = ReportRepository(db)

    async def get_dashboard_kpi(self) -> DashboardKpiSchema:
        today = date.today()
        open_orders = await self._repo.count_open_orders()
        ready_orders = await self._repo.count_ready_orders()
        monthly_revenue = await self._repo.sum_month_revenue(today.year, today.month)
        monthly_profit = await self._repo.sum_month_profit(today.year, today.month)
        unpaid_amount = await self._repo.sum_unpaid_amount()
        today_orders = await self._repo.count_orders_on_date(today)

        return DashboardKpiSchema(
            open_orders=open_orders,
            ready_orders=ready_orders,
            monthly_revenue=monthly_revenue,
            monthly_profit=monthly_profit,
            unpaid_amount=unpaid_amount,
            today_orders=today_orders,
        )

    async def get_monthly_report(self, year: int, month: int) -> MonthlyReportSchema:
        total_revenue, total_cost, total_profit, order_count = (
            await self._repo.month_orders_summary(year, month)
        )
        cash_revenue = await self._repo.month_revenue_by_payment_method(
            year, month, PaymentMethod.cash
        )
        transfer_revenue = await self._repo.month_revenue_by_payment_method(
            year, month, PaymentMethod.transfer
        )
        paid_revenue = await self._repo.sum_month_paid_revenue(year, month)
        total_expenses = await self._repo.sum_month_expenses(year, month)

        return MonthlyReportSchema(
            year=year,
            month=month,
            total_revenue=total_revenue,
            total_cost=total_cost,
            total_profit=total_profit,
            total_expenses=total_expenses,
            net_profit=total_profit - total_expenses,
            cash_revenue=cash_revenue,
            transfer_revenue=transfer_revenue,
            paid_revenue=paid_revenue,
            order_count=order_count,
        )

    async def get_financial_year(self, year: int) -> FinancialYearSchema:
        monthly_data = []
        for month in range(1, 13):
            monthly_data.append(await self.get_monthly_report(year, month))

        total_revenue = sum((m.total_revenue for m in monthly_data), Decimal("0"))
        total_expenses = sum((m.total_expenses for m in monthly_data), Decimal("0"))
        net_profit = sum((m.net_profit for m in monthly_data), Decimal("0"))
        annual_profit = sum((m.total_profit for m in monthly_data), Decimal("0"))

        return FinancialYearSchema(
            year=year,
            months=monthly_data,
            annual_revenue=total_revenue,
            annual_profit=annual_profit,
            annual_expenses=total_expenses,
            annual_net=net_profit,
        )

    async def get_top_customers(self, limit: int = 10) -> list[TopCustomerSchema]:
        rows = await self._repo.get_top_customers(limit)
        return [
            TopCustomerSchema(
                customer_id=row[0],
                customer_name=row[1],
                order_count=row[2],
                total_revenue=Decimal(str(row[3])),
                total_profit=Decimal(str(row[4])),
            )
            for row in rows
        ]
