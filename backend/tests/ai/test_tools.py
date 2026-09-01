"""Unit tests for business tools — uses pytest-mock to mock DB + services."""

from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

# Import from sub-modules where each function is now defined.
# ReportService monkeypatching must target the sub-module where it is imported.
from src.ai.tools_customers import get_top_customers
from src.ai.tools_email import draft_email
from src.ai.tools_operations import get_dashboard_kpis, get_orders_summary
from src.ai.tools_reports import get_financial_year, get_monthly_report


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
    monkeypatch.setattr("src.ai.tools_operations.ReportService", lambda db: svc_mock)

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
    monkeypatch.setattr("src.ai.tools_reports.ReportService", lambda db: svc_mock)

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
    monkeypatch.setattr("src.ai.tools_reports.ReportService", lambda db: svc_mock)

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
    monkeypatch.setattr("src.ai.tools_reports.ReportService", lambda db: svc_mock)

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
    monkeypatch.setattr("src.ai.tools_customers.ReportService", lambda db: svc_mock)

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
    monkeypatch.setattr("src.ai.tools_customers.ReportService", lambda db: svc_mock)

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
    # draft_email now looks up the customer ID via AiRepository
    id_result = MagicMock()
    id_result.scalar_one_or_none.return_value = "customer-uuid-123"
    mock_db.execute = AsyncMock(return_value=id_result)

    result = await draft_email(
        db=mock_db,
        customer_name="ישראל ישראלי",
        subject="תזכורת תשלום",
        body="אנא שלם את החשבון.",
    )

    assert result["subject"] == "תזכורת תשלום"
    assert "אנא שלם" in result["body_text"]
    assert "<html" in result["preview_html"]
    assert result["customer_id"] == "customer-uuid-123"
    assert result["customer_name"] == "ישראל ישראלי"
    assert result["note"] == "This is a draft only — no email has been sent."


async def test_draft_email_customer_not_found(mock_db) -> None:
    id_result = MagicMock()
    id_result.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=id_result)

    result = await draft_email(
        db=mock_db,
        customer_name="לקוח לא קיים",
        subject="Subject",
        body="Body",
    )
    # When the customer isn't found, draft_email returns an early "not found" shape —
    # it never includes customer_id/customer_name (see src/ai/tools_email.py:72-78).
    assert result["not_found"] is True
    assert result["searched_for"] == "לקוח לא קיים"
    assert "candidates" in result
