from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.orders.enums import PaymentMethod
from src.reports.repository import ReportRepository

pytestmark = pytest.mark.asyncio


async def test_count_open_orders_when_empty(db_session: AsyncSession) -> None:
    repo = ReportRepository(db_session)
    assert await repo.count_open_orders() == 0


async def test_count_ready_orders_when_empty(db_session: AsyncSession) -> None:
    repo = ReportRepository(db_session)
    assert await repo.count_ready_orders() == 0


async def test_sum_unpaid_amount_when_empty(db_session: AsyncSession) -> None:
    repo = ReportRepository(db_session)
    assert await repo.sum_unpaid_amount() == 0


async def test_count_orders_on_date_when_empty(db_session: AsyncSession) -> None:
    repo = ReportRepository(db_session)
    assert await repo.count_orders_on_date(date.today()) == 0


async def test_month_orders_summary_zero_when_empty(db_session: AsyncSession) -> None:
    repo = ReportRepository(db_session)
    revenue, cost, profit, count = await repo.month_orders_summary(2025, 3)
    assert revenue == 0
    assert cost == 0
    assert profit == 0
    assert count == 0


async def test_month_revenue_by_payment_method_zero_when_empty(
    db_session: AsyncSession,
) -> None:
    repo = ReportRepository(db_session)
    assert (
        await repo.month_revenue_by_payment_method(2025, 3, PaymentMethod.cash) == 0
    )


async def test_sum_month_expenses_zero_when_empty(db_session: AsyncSession) -> None:
    repo = ReportRepository(db_session)
    assert await repo.sum_month_expenses(2025, 3) == 0
