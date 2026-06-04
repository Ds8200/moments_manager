from decimal import Decimal
from unittest.mock import AsyncMock

import pytest

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

    result = await service.get_monthly_report(2025, 3)

    assert result.total_revenue == Decimal("200")
    assert result.total_profit == Decimal("120")
    assert result.total_expenses == Decimal("40")
    assert result.net_profit == Decimal("80")
    assert result.order_count == 5


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
