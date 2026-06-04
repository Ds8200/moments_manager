"""Unit tests for AiRepository — all 6 read-only query methods."""

from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.ai.repository import AiRepository


@pytest.fixture()
def mock_db() -> MagicMock:
    db = MagicMock()
    return db


def _scalars_result(rows: list) -> MagicMock:
    res = MagicMock()
    res.scalars.return_value.all.return_value = rows
    return res


def _scalar_one_or_none_result(value) -> MagicMock:
    res = MagicMock()
    res.scalar_one_or_none.return_value = value
    return res


def _all_result(rows: list) -> MagicMock:
    res = MagicMock()
    res.all.return_value = rows
    return res


def _one_result(*values) -> MagicMock:
    res = MagicMock()
    res.one.return_value = values
    return res


# ── get_customer_profile ───────────────────────────────────────────────────────


async def test_get_customer_profile_not_found(mock_db) -> None:
    mock_db.execute = AsyncMock(return_value=_scalar_one_or_none_result(None))
    repo = AiRepository(mock_db)
    result = await repo.get_customer_profile("does not exist")
    assert result is None


async def test_get_customer_profile_found(mock_db) -> None:
    customer = MagicMock(
        id="cust-1",
        name="ישראל ישראלי",
        phone="050-1234567",
        email="test@example.com",
        notes="לקוח טוב",
    )
    # Mock: customer query, stats query, recent orders query
    order = MagicMock(
        order_number="ORD-2025-0001",
        date=date(2025, 6, 1),
        total_amount=Decimal("500"),
        status="completed",
        is_paid=True,
    )
    stats_row = (3, Decimal("1500"), date(2025, 6, 1))
    recent_orders_rows = [order]

    execute_calls = [
        _scalar_one_or_none_result(customer),
        _one_result(*stats_row),
        _scalars_result(recent_orders_rows),
    ]
    mock_db.execute = AsyncMock(side_effect=execute_calls)

    repo = AiRepository(mock_db)
    result = await repo.get_customer_profile("ישראל")

    assert result is not None
    assert result["name"] == "ישראל ישראלי"
    assert result["phone"] == "050-1234567"
    assert result["email"] == "test@example.com"
    assert result["order_count"] == 3
    assert result["total_spent"] == "1500"
    assert len(result["recent_orders"]) == 1
    assert result["recent_orders"][0]["order_number"] == "ORD-2025-0001"


# ── get_unpaid_invoices ────────────────────────────────────────────────────────


async def test_get_unpaid_invoices_empty(mock_db) -> None:
    mock_db.execute = AsyncMock(return_value=_scalars_result([]))
    repo = AiRepository(mock_db)
    result = await repo.get_unpaid_invoices(0)
    assert result == []


async def test_get_unpaid_invoices_returns_correct_shape(mock_db) -> None:
    order = MagicMock()
    order.customer = MagicMock(name="לקוח א")
    order.order_number = "ORD-2025-0002"
    order.total_amount = Decimal("2000")
    order.date = date.today() - timedelta(days=45)
    order.status = "approved"

    mock_db.execute = AsyncMock(return_value=_scalars_result([order]))
    repo = AiRepository(mock_db)
    result = await repo.get_unpaid_invoices(30)

    assert len(result) == 1
    row = result[0]
    assert row["customer_name"] == "לקוח א"
    assert row["order_number"] == "ORD-2025-0002"
    assert row["total_amount"] == "2000"
    assert row["days_since_order"] >= 30


async def test_get_unpaid_invoices_no_customer_falls_back(mock_db) -> None:
    order = MagicMock()
    order.customer = None
    order.order_number = "ORD-2025-0003"
    order.total_amount = Decimal("100")
    order.date = date.today() - timedelta(days=5)
    order.status = "new"

    mock_db.execute = AsyncMock(return_value=_scalars_result([order]))
    repo = AiRepository(mock_db)
    result = await repo.get_unpaid_invoices(0)

    assert result[0]["customer_name"] == "לקוח לא ידוע"


# ── get_pipeline_by_status ─────────────────────────────────────────────────────


async def test_get_pipeline_by_status_sums_correctly(mock_db) -> None:
    rows = [
        ("new", 2, Decimal("1000")),
        ("printing", 3, Decimal("4500")),
        ("ready", 1, Decimal("500")),
    ]
    res = MagicMock()
    res.all.return_value = rows
    mock_db.execute = AsyncMock(return_value=res)

    repo = AiRepository(mock_db)
    result = await repo.get_pipeline_by_status()

    assert result["total_count"] == 6
    assert result["total_value"] == "6000"
    assert result["by_status"]["new"]["count"] == 2
    assert result["by_status"]["printing"]["value"] == "4500"


async def test_get_pipeline_by_status_empty(mock_db) -> None:
    res = MagicMock()
    res.all.return_value = []
    mock_db.execute = AsyncMock(return_value=res)

    repo = AiRepository(mock_db)
    result = await repo.get_pipeline_by_status()

    assert result["total_count"] == 0
    assert result["total_value"] == "0"
    assert result["by_status"] == {}


# ── get_product_performance ────────────────────────────────────────────────────


async def test_get_product_performance_computes_margin(mock_db) -> None:
    rows = [("הדפסה גדולה", 5, Decimal("10000"), Decimal("3000"))]
    res = MagicMock()
    res.all.return_value = rows
    mock_db.execute = AsyncMock(return_value=res)

    repo = AiRepository(mock_db)
    result = await repo.get_product_performance(2025, None, 10)

    assert len(result) == 1
    product = result[0]
    assert product["product_name"] == "הדפסה גדולה"
    assert product["order_count"] == 5
    assert product["revenue"] == "10000"
    assert product["profit"] == "3000"
    assert product["margin_pct"] == 30.0


async def test_get_product_performance_zero_revenue_margin(mock_db) -> None:
    rows = [("מוצר ריק", 1, Decimal("0"), Decimal("0"))]
    res = MagicMock()
    res.all.return_value = rows
    mock_db.execute = AsyncMock(return_value=res)

    repo = AiRepository(mock_db)
    result = await repo.get_product_performance(2025, 6, 10)

    assert result[0]["margin_pct"] == 0.0


# ── search_orders ──────────────────────────────────────────────────────────────


async def test_search_orders_returns_correct_shape(mock_db) -> None:
    order = MagicMock()
    order.customer = MagicMock(name="לקוח ב")
    order.order_number = "ORD-2025-0005"
    order.total_amount = Decimal("800")
    order.status = "printing"
    order.urgency = "normal"
    order.date = date(2025, 6, 10)
    order.due_datetime = None
    order.is_paid = False

    mock_db.execute = AsyncMock(return_value=_scalars_result([order]))
    repo = AiRepository(mock_db)
    result = await repo.search_orders("לקוח", 10)

    assert result["count"] == 1
    assert result["query"] == "לקוח"
    assert result["orders"][0]["order_number"] == "ORD-2025-0005"


async def test_search_orders_empty_query_returns_orders(mock_db) -> None:
    mock_db.execute = AsyncMock(return_value=_scalars_result([]))
    repo = AiRepository(mock_db)
    result = await repo.search_orders("xyz-not-found", 10)

    assert result["count"] == 0
    assert result["orders"] == []


# ── get_inactive_customers ─────────────────────────────────────────────────────


async def test_get_inactive_customers_returns_correct_shape(mock_db) -> None:
    last_date = date.today() - timedelta(days=120)
    row = MagicMock()
    row.name = "לקוח ישן"
    row.last_order_date = last_date
    row.total_orders = 7

    res = MagicMock()
    res.all.return_value = [row]
    mock_db.execute = AsyncMock(return_value=res)

    repo = AiRepository(mock_db)
    result = await repo.get_inactive_customers(90, 10)

    assert len(result) == 1
    customer = result[0]
    assert customer["customer_name"] == "לקוח ישן"
    assert customer["total_orders"] == 7
    assert customer["days_inactive"] >= 90


async def test_get_inactive_customers_no_orders(mock_db) -> None:
    row = MagicMock()
    row.name = "לקוח חדש ללא הזמנות"
    row.last_order_date = None
    row.total_orders = 0

    res = MagicMock()
    res.all.return_value = [row]
    mock_db.execute = AsyncMock(return_value=res)

    repo = AiRepository(mock_db)
    result = await repo.get_inactive_customers(90, 10)

    assert result[0]["last_order_date"] is None
    assert result[0]["days_inactive"] is None
