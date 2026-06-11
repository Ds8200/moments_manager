from decimal import Decimal
from unittest.mock import AsyncMock

import pytest

from src.reports.service import ReportService

pytestmark = pytest.mark.asyncio

_ORG_ID = "00000000-0000-0000-0000-000000000000"


async def test_get_dashboard_kpi_assembles_from_repo() -> None:
    db = AsyncMock()
    service = ReportService(db, _ORG_ID)
    service._repo = AsyncMock()
    service._repo.get_dashboard_aggregate.return_value = (4, 2, Decimal("100"), Decimal("30"), Decimal("50"), 1)
    service._repo.sum_month_expenses.return_value = Decimal("20")

    result = await service.get_dashboard_kpi()

    assert result.open_orders == 4
    assert result.ready_orders == 2
    assert result.monthly_revenue == Decimal("100")
    assert result.monthly_profit == Decimal("30")
    assert result.monthly_expenses == Decimal("20")
    assert result.unpaid_amount == Decimal("50")
    assert result.today_orders == 1


async def test_get_monthly_report_computes_net_profit() -> None:
    db = AsyncMock()
    service = ReportService(db, _ORG_ID)
    service._repo = AsyncMock()
    service._repo.month_orders_summary.return_value = (
        Decimal("200"),
        Decimal("80"),
        Decimal("120"),
        5,
    )
    service._repo.count_month_unpaid_orders.return_value = 2
    service._repo.month_revenue_by_payment_method.return_value = Decimal("60")
    service._repo.sum_month_unpaid_amount.return_value = Decimal("100")
    service._repo.sum_month_paid_revenue.return_value = Decimal("180")
    service._repo.sum_month_expenses.return_value = Decimal("40")

    result = await service.get_monthly_report(2025, 3)

    assert result.total_revenue == Decimal("200")
    assert result.total_profit == Decimal("120")
    assert result.total_expenses == Decimal("40")
    assert result.net_profit == Decimal("80")
    assert result.paid_count == 5


async def test_get_financial_year_uses_batch_queries() -> None:
    db = AsyncMock()
    service = ReportService(db, _ORG_ID)
    service._repo = AsyncMock()
    service._repo.get_year_orders_by_month.return_value = {
        3: {
            "paid_revenue": Decimal("200"),
            "total_cost": Decimal("80"),
            "total_profit": Decimal("120"),
            "paid_count": 5,
            "unpaid_count": 2,
            "unpaid_amount": Decimal("100"),
            "cash_revenue": Decimal("120"),
            "transfer_revenue": Decimal("80"),
        }
    }
    service._repo.get_year_expenses_by_month.return_value = {3: Decimal("40")}

    result = await service.get_financial_year(2025)

    assert len(result.months) == 12
    march = result.months[2]
    assert march.total_revenue == Decimal("200")
    assert march.total_profit == Decimal("120")
    assert march.total_expenses == Decimal("40")
    assert march.net_profit == Decimal("80")
    assert march.paid_count == 5
    assert march.paid_revenue == Decimal("200")
    assert march.collection_rate == round(5 / 7 * 100, 1)

    january = result.months[0]
    assert january.total_revenue == Decimal("0")
    assert january.paid_count == 0
    assert january.collection_rate == 0.0

    assert result.annual_revenue == Decimal("200")
    assert result.annual_profit == Decimal("120")
    assert result.annual_expenses == Decimal("40")
    assert result.annual_net == Decimal("80")
    assert result.annual_unpaid == Decimal("100")


async def test_get_top_customers_maps_repo_rows() -> None:
    db = AsyncMock()
    service = ReportService(db, _ORG_ID)
    service._repo = AsyncMock()
    service._repo.get_top_customers.return_value = [
        ("c-1", "Alice", 3, Decimal("500"), Decimal("200")),
        ("c-2", "Bob", 2, Decimal("300"), Decimal("100")),
    ]

    result = await service.get_top_customers(10)

    assert len(result) == 2
    assert result[0].customer_name == "Alice"
    assert result[0].total_revenue == Decimal("500")
