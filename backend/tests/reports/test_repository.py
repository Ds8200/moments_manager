from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.orders.enums import PaymentMethod
from src.reports.repository import ReportRepository

pytestmark = pytest.mark.asyncio

_ORG_ID = "00000000-0000-0000-0000-000000000000"


async def test_month_orders_summary_zero_when_empty(db_session: AsyncSession) -> None:
    repo = ReportRepository(db_session, _ORG_ID)
    revenue, cost, profit, count = await repo.month_orders_summary(2025, 3)
    assert revenue == 0
    assert cost == 0
    assert profit == 0
    assert count == 0


async def test_month_revenue_by_payment_method_zero_when_empty(
    db_session: AsyncSession,
) -> None:
    repo = ReportRepository(db_session, _ORG_ID)
    assert await repo.month_revenue_by_payment_method(2025, 3, PaymentMethod.cash) == 0


async def test_sum_month_expenses_zero_when_empty(db_session: AsyncSession) -> None:
    repo = ReportRepository(db_session, _ORG_ID)
    assert await repo.sum_month_expenses(2025, 3) == 0


async def test_get_year_orders_by_month_empty_when_no_orders(db_session: AsyncSession) -> None:
    repo = ReportRepository(db_session, _ORG_ID)
    result = await repo.get_year_orders_by_month(2025)
    assert result == {}


async def test_get_year_expenses_by_month_empty_when_no_expenses(db_session: AsyncSession) -> None:
    repo = ReportRepository(db_session, _ORG_ID)
    result = await repo.get_year_expenses_by_month(2025)
    assert result == {}


async def test_get_dashboard_aggregate_zeros_when_empty(db_session: AsyncSession) -> None:
    repo = ReportRepository(db_session, _ORG_ID)
    today = date.today()
    open_orders, ready_orders, monthly_rev, monthly_profit, unpaid, today_orders = (
        await repo.get_dashboard_aggregate(today.year, today.month, today)
    )
    assert open_orders == 0
    assert ready_orders == 0
    assert monthly_rev == 0
    assert monthly_profit == 0
    assert unpaid == 0
    assert today_orders == 0
