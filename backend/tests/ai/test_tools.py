"""Unit tests for business tools — uses pytest-mock to mock DB + services."""
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.ai.tools import (
    draft_email,
    get_dashboard_kpis,
    get_financial_year,
    get_monthly_report,
    get_orders_summary,
    get_top_customers,
)


@pytest.fixture()
def mock_db() -> MagicMock:
    return MagicMock()


# ── Dashboard KPIs ─────────────────────────────────────────────────────────────

async def test_get_dashboard_kpis(mock_db, monkeypatch) -> None:
    kpi = MagicMock(
        open_orders=5,
        ready_orders=2,
        monthly_revenue=Decimal("12000"),
        monthly_expenses=Decimal("3000"),
        monthly_profit=Decimal("9000"),
        unpaid_amount=Decimal("1500"),
        today_orders=3,
    )
    svc_mock = MagicMock()
    svc_mock.get_dashboard_kpi = AsyncMock(return_value=kpi)

    monkeypatch.setattr("src.ai.tools.ReportService", lambda db: svc_mock)

    result = await get_dashboard_kpis(db=mock_db)

    assert result["open_orders"] == 5
    assert result["ready_orders"] == 2
    assert result["monthly_revenue"] == "12000"
    assert result["today_orders"] == 3


# ── Monthly Report ─────────────────────────────────────────────────────────────

async def test_get_monthly_report_uses_defaults(mock_db, monkeypatch) -> None:
    report = MagicMock(
        year=2025,
        month=6,
        total_revenue=Decimal("10000"),
        total_expenses=Decimal("2000"),
        total_profit=Decimal("8000"),
        net_profit=Decimal("6000"),
        paid_count=10,
        unpaid_count=2,
        total_count=12,
        collection_rate=83.3,
        cash_revenue=Decimal("4000"),
        transfer_revenue=Decimal("6000"),
        unpaid_amount=Decimal("1500"),
    )
    svc_mock = MagicMock()
    svc_mock.get_monthly_report = AsyncMock(return_value=report)
    monkeypatch.setattr("src.ai.tools.ReportService", lambda db: svc_mock)

    result = await get_monthly_report(db=mock_db)

    svc_mock.get_monthly_report.assert_called_once()
    assert result["total_revenue"] == "10000"
    assert result["paid_count"] == 10


async def test_get_monthly_report_explicit_params(mock_db, monkeypatch) -> None:
    report = MagicMock(
        year=2024,
        month=3,
        total_revenue=Decimal("5000"),
        total_expenses=Decimal("1000"),
        total_profit=Decimal("4000"),
        net_profit=Decimal("3000"),
        paid_count=5,
        unpaid_count=1,
        total_count=6,
        collection_rate=83.3,
        cash_revenue=Decimal("2000"),
        transfer_revenue=Decimal("3000"),
        unpaid_amount=Decimal("500"),
    )
    svc_mock = MagicMock()
    svc_mock.get_monthly_report = AsyncMock(return_value=report)
    monkeypatch.setattr("src.ai.tools.ReportService", lambda db: svc_mock)

    await get_monthly_report(db=mock_db, year=2024, month=3)

    svc_mock.get_monthly_report.assert_called_once_with(2024, 3)


# ── Financial Year ─────────────────────────────────────────────────────────────

async def test_get_financial_year(mock_db, monkeypatch) -> None:
    month_mock = MagicMock(
        month=1,
        total_revenue=Decimal("1000"),
        total_expenses=Decimal("200"),
        net_profit=Decimal("800"),
        paid_count=5,
    )
    year_data = MagicMock(
        year=2025,
        annual_revenue=Decimal("12000"),
        annual_profit=Decimal("9600"),
        annual_expenses=Decimal("2400"),
        annual_net=Decimal("9600"),
        annual_unpaid=Decimal("500"),
        months=[month_mock] * 12,
    )
    svc_mock = MagicMock()
    svc_mock.get_financial_year = AsyncMock(return_value=year_data)
    monkeypatch.setattr("src.ai.tools.ReportService", lambda db: svc_mock)

    result = await get_financial_year(db=mock_db, year=2025)

    assert result["year"] == 2025
    assert result["annual_revenue"] == "12000"
    assert len(result["months"]) == 12


# ── Top Customers ──────────────────────────────────────────────────────────────

async def test_get_top_customers_caps_limit(mock_db, monkeypatch) -> None:
    customer = MagicMock(
        customer_name="Acme",
        order_count=10,
        total_revenue=Decimal("50000"),
        total_profit=Decimal("10000"),
    )
    svc_mock = MagicMock()
    svc_mock.get_top_customers = AsyncMock(return_value=[customer])
    monkeypatch.setattr("src.ai.tools.ReportService", lambda db: svc_mock)

    await get_top_customers(db=mock_db, limit=999)
    svc_mock.get_top_customers.assert_called_once_with(20)


async def test_get_top_customers_result_shape(mock_db, monkeypatch) -> None:
    customer = MagicMock(
        customer_name="Test",
        order_count=3,
        total_revenue=Decimal("1000"),
        total_profit=Decimal("200"),
    )
    svc_mock = MagicMock()
    svc_mock.get_top_customers = AsyncMock(return_value=[customer])
    monkeypatch.setattr("src.ai.tools.ReportService", lambda db: svc_mock)

    result = await get_top_customers(db=mock_db)

    assert len(result["customers"]) == 1
    assert result["customers"][0]["name"] == "Test"
    assert result["customers"][0]["order_count"] == 3


# ── Orders Summary ─────────────────────────────────────────────────────────────

async def test_get_orders_summary_returns_count_and_revenue(mock_db) -> None:
    mock_result = MagicMock()
    mock_result.one.return_value = (7, Decimal("14000"))
    mock_db.execute = AsyncMock(return_value=mock_result)

    result = await get_orders_summary(db=mock_db)

    assert result["count"] == 7
    assert result["total_revenue"] == "14000"
    assert result["avg_order_value"] == 2000.0


async def test_get_orders_summary_zero_count(mock_db) -> None:
    mock_result = MagicMock()
    mock_result.one.return_value = (0, Decimal("0"))
    mock_db.execute = AsyncMock(return_value=mock_result)

    result = await get_orders_summary(db=mock_db)

    assert result["count"] == 0
    assert result["avg_order_value"] == 0.0


# ── Email Draft ────────────────────────────────────────────────────────────────

async def test_draft_email_returns_subject_and_body(mock_db) -> None:
    result = await draft_email(
        db=mock_db,
        customer_name="ישראל ישראלי",
        subject="תזכורת תשלום",
        body="שלום, אנא שלם את החשבון.",
    )

    assert result["subject"] == "תזכורת תשלום"
    assert "שלום, אנא שלם" in result["body_text"]
    assert "<html" in result["preview_html"]
    assert result["note"] == "This is a draft only — no email has been sent."


async def test_draft_email_does_not_require_db(mock_db) -> None:
    # draft_email should work even if db is None (it doesn't use the DB)
    result = await draft_email(
        db=None,
        customer_name="Test",
        subject="Subject",
        body="Body text",
    )
    assert "subject" in result
    assert "body_text" in result
