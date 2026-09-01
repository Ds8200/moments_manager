from decimal import Decimal
from unittest.mock import AsyncMock

import pytest

from src.reports.schemas import FinancialYearSchema, MonthlyReportSchema
from src.reports.service import ReportService

pytestmark = pytest.mark.asyncio


async def test_get_dashboard_kpi_assembles_from_repo() -> None:
    db = AsyncMock()
    service = ReportService(db)
    service._repo = AsyncMock()
    service._repo.count_open_orders.return_value = 4
    service._repo.count_ready_orders.return_value = 2
    service._repo.sum_month_paid_revenue.return_value = Decimal("100")
    service._repo.sum_month_expenses.return_value = Decimal("20")
    service._repo.sum_month_profit.return_value = Decimal("30")
    service._repo.sum_unpaid_amount.return_value = Decimal("50")
    service._repo.count_orders_on_date.return_value = 1

    result = await service.get_dashboard_kpi()

    assert result.open_orders == 4
    assert result.ready_orders == 2
    assert result.monthly_revenue == Decimal("100")
    assert result.monthly_expenses == Decimal("20")
    assert result.unpaid_amount == Decimal("50")
    assert result.today_orders == 1


async def test_get_monthly_report_computes_net_profit() -> None:
    db = AsyncMock()
    service = ReportService(db)
    service._repo = AsyncMock()
    service._repo.month_orders_summary.return_value = (
        Decimal("200"),
        Decimal("80"),
        Decimal("120"),
        5,
    )
    service._repo.month_revenue_by_payment_method.return_value = Decimal("60")
    service._repo.sum_month_expenses.return_value = Decimal("40")
    service._repo.count_month_unpaid_orders.return_value = 1
    service._repo.sum_month_unpaid_amount.return_value = Decimal("15")
    service._repo.sum_month_paid_revenue.return_value = Decimal("180")

    result = await service.get_monthly_report(2025, 3)

    assert result.total_revenue == Decimal("200")
    assert result.total_profit == Decimal("120")
    assert result.total_expenses == Decimal("40")
    assert result.net_profit == Decimal("80")
    assert result.paid_count == 5
    assert result.unpaid_count == 1


async def test_build_export_config_uses_net_profit_not_gross() -> None:
    # Regression test: the "רווח" export column must show net profit
    # (after expenses), not gross profit — see reports table bug fix.
    db = AsyncMock()
    service = ReportService(db)
    month = MonthlyReportSchema(
        year=2025,
        month=6,
        total_revenue=Decimal("10589"),
        total_cost=Decimal("3266"),
        total_profit=Decimal("7323"),
        total_expenses=Decimal("5452"),
        net_profit=Decimal("1871"),
        paid_count=36,
        unpaid_count=0,
        total_count=36,
        collection_rate=100.0,
        cash_revenue=Decimal("8825"),
        transfer_revenue=Decimal("1764"),
        unpaid_amount=Decimal("0"),
        paid_revenue=Decimal("10589"),
    )
    data = FinancialYearSchema(
        year=2025,
        months=[month],
        annual_revenue=month.total_revenue,
        annual_profit=month.total_profit,
        annual_expenses=month.total_expenses,
        annual_cost=month.total_cost,
        annual_net=month.net_profit,
        annual_unpaid=month.unpaid_amount,
    )

    config = service._build_export_config(data, 2025)
    profit_cell = config.rows[0][-1]
    material_cost_cell = config.rows[0][-2]

    assert profit_cell == service._fmt(month.net_profit)
    assert profit_cell != service._fmt(month.total_profit)
    assert material_cost_cell == service._fmt(month.total_cost)


async def test_get_financial_year_aggregates_annual_cost() -> None:
    db = AsyncMock()
    service = ReportService(db)
    month_template = MonthlyReportSchema(
        year=2025,
        month=1,
        total_revenue=Decimal("500"),
        total_cost=Decimal("100"),
        total_profit=Decimal("400"),
        total_expenses=Decimal("50"),
        net_profit=Decimal("350"),
        paid_count=1,
        unpaid_count=0,
        total_count=1,
        collection_rate=100.0,
        cash_revenue=Decimal("500"),
        transfer_revenue=Decimal("0"),
        unpaid_amount=Decimal("0"),
        paid_revenue=Decimal("500"),
    )
    service.get_monthly_report = AsyncMock(return_value=month_template)

    result = await service.get_financial_year(2025)

    assert result.annual_cost == Decimal("1200")  # 100 * 12 months
    assert result.annual_revenue == Decimal("6000")  # 500 * 12
    assert result.annual_profit == Decimal("4800")  # 400 * 12
    assert result.annual_net == Decimal("4200")  # 350 * 12


async def test_get_top_customers_maps_repo_rows() -> None:
    db = AsyncMock()
    service = ReportService(db)
    service._repo = AsyncMock()
    service._repo.get_top_customers.return_value = [
        ("c-1", "Alice", 3, Decimal("500"), Decimal("200")),
        ("c-2", "Bob", 2, Decimal("300"), Decimal("100")),
    ]

    result = await service.get_top_customers(10)

    assert len(result) == 2
    assert result[0].customer_name == "Alice"
    assert result[0].total_revenue == Decimal("500")
