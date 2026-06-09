import logging
from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.export_utils import ColumnGroup, TableExportConfig, build_excel_bytes, build_pdf_bytes
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
    def __init__(self, db: AsyncSession, org_id: str) -> None:
        self._repo = ReportRepository(db, org_id)

    async def get_dashboard_kpi(self) -> DashboardKpiSchema:
        today = date.today()
        (
            open_orders,
            ready_orders,
            monthly_revenue,
            monthly_profit,
            unpaid_amount,
            today_orders,
        ) = await self._repo.get_dashboard_aggregate(today.year, today.month, today)
        monthly_expenses = await self._repo.sum_month_expenses(today.year, today.month)
        return DashboardKpiSchema(
            open_orders=open_orders,
            ready_orders=ready_orders,
            monthly_revenue=monthly_revenue,
            monthly_expenses=monthly_expenses,
            monthly_profit=monthly_profit,
            unpaid_amount=unpaid_amount,
            today_orders=today_orders,
        )

    async def get_monthly_report(self, year: int, month: int) -> MonthlyReportSchema:
        total_revenue, total_cost, total_profit, paid_count = await self._repo.month_orders_summary(
            year, month
        )
        unpaid_count = await self._repo.count_month_unpaid_orders(year, month)
        cash_revenue = await self._repo.month_revenue_by_payment_method(
            year, month, PaymentMethod.cash
        )
        transfer_revenue = await self._repo.month_revenue_by_payment_method(
            year, month, PaymentMethod.transfer
        )
        unpaid_amount = await self._repo.sum_month_unpaid_amount(year, month)
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
            paid_count=paid_count,
            unpaid_count=unpaid_count,
            total_count=paid_count + unpaid_count,
            collection_rate=round(paid_count / (paid_count + unpaid_count) * 100, 1)
            if (paid_count + unpaid_count) > 0
            else 0.0,
            cash_revenue=cash_revenue,
            transfer_revenue=transfer_revenue,
            unpaid_amount=unpaid_amount,
            paid_revenue=paid_revenue,
        )

    async def get_financial_year(self, year: int) -> FinancialYearSchema:
        orders_by_month = await self._repo.get_year_orders_by_month(year)
        expenses_by_month = await self._repo.get_year_expenses_by_month(year)

        zero = Decimal("0")
        monthly_data: list[MonthlyReportSchema] = []

        for month in range(1, 13):
            o = orders_by_month.get(month, {})
            total_expenses = expenses_by_month.get(month, zero)

            total_revenue = Decimal(str(o.get("paid_revenue", 0)))
            total_cost = Decimal(str(o.get("total_cost", 0)))
            total_profit = Decimal(str(o.get("total_profit", 0)))
            paid_count = int(o.get("paid_count", 0))
            unpaid_count = int(o.get("unpaid_count", 0))

            monthly_data.append(
                MonthlyReportSchema(
                    year=year,
                    month=month,
                    total_revenue=total_revenue,
                    total_cost=total_cost,
                    total_profit=total_profit,
                    total_expenses=total_expenses,
                    net_profit=total_profit - total_expenses,
                    paid_count=paid_count,
                    unpaid_count=unpaid_count,
                    total_count=paid_count + unpaid_count,
                    collection_rate=round(paid_count / (paid_count + unpaid_count) * 100, 1)
                    if (paid_count + unpaid_count) > 0
                    else 0.0,
                    cash_revenue=Decimal(str(o.get("cash_revenue", 0))),
                    transfer_revenue=Decimal(str(o.get("transfer_revenue", 0))),
                    unpaid_amount=Decimal(str(o.get("unpaid_amount", 0))),
                    paid_revenue=total_revenue,
                )
            )

        return FinancialYearSchema(
            year=year,
            months=monthly_data,
            annual_revenue=sum((m.total_revenue for m in monthly_data), zero),
            annual_profit=sum((m.total_profit for m in monthly_data), zero),
            annual_expenses=sum((m.total_expenses for m in monthly_data), zero),
            annual_net=sum((m.net_profit for m in monthly_data), zero),
            annual_unpaid=sum((m.unpaid_amount for m in monthly_data), zero),
        )

    # ── Export ──────────────────────────────────────────────────────────────

    _HEBREW_MONTHS = [
        "ינואר",
        "פברואר",
        "מרץ",
        "אפריל",
        "מאי",
        "יוני",
        "יולי",
        "אוגוסט",
        "ספטמבר",
        "אוקטובר",
        "נובמבר",
        "דצמבר",
    ]

    @staticmethod
    def _fmt(value: Decimal) -> str:
        return f"₪{value:,.2f}"

    def _build_export_config(self, data: FinancialYearSchema, year: int) -> TableExportConfig:
        column_groups = [
            ColumnGroup("הזמנות", 4),
            ColumnGroup("תשלומים", 4),
            ColumnGroup("רווחיות", 2),
        ]
        sub_headers = [
            "שולם",
            "לא שולם",
            'סה"כ',
            "% גבייה",
            "מזומן",
            "העברה",
            "לא שולם (₪)",
            'סה"כ הכנסות',
            "הוצאות",
            "רווח",
        ]
        rows: list[list[str | int | float]] = [
            [
                self._HEBREW_MONTHS[m.month - 1],
                m.paid_count,
                m.unpaid_count,
                m.total_count,
                f"{m.collection_rate:.1f}%",
                self._fmt(m.cash_revenue),
                self._fmt(m.transfer_revenue),
                self._fmt(m.unpaid_amount),
                self._fmt(m.paid_revenue),
                self._fmt(m.total_expenses),
                self._fmt(m.total_profit),
            ]
            for m in data.months
        ]
        return TableExportConfig(
            title=f"סיכום חודשי {year}",
            first_col_header="חודש",
            column_groups=column_groups,
            sub_headers=sub_headers,
            rows=rows,
        )

    async def export_excel(self, year: int) -> bytes:
        data = await self.get_financial_year(year)
        return build_excel_bytes(self._build_export_config(data, year))

    async def export_pdf(self, year: int) -> bytes:
        data = await self.get_financial_year(year)
        return build_pdf_bytes(self._build_export_config(data, year))

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
