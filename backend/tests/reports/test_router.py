import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_dashboard_kpi_returns_shape(client: AsyncClient) -> None:
    response = await client.get("/api/v1/reports/dashboard")
    assert response.status_code == 200
    body = response.json()
    assert "open_orders" in body
    assert "ready_orders" in body
    assert "monthly_revenue" in body
    assert "unpaid_amount" in body


async def test_monthly_report(client: AsyncClient) -> None:
    response = await client.get("/api/v1/reports/monthly?year=2025&month=3")
    assert response.status_code == 200
    body = response.json()
    assert body["year"] == 2025
    assert body["month"] == 3


async def test_monthly_report_invalid_month(client: AsyncClient) -> None:
    response = await client.get("/api/v1/reports/monthly?year=2025&month=13")
    assert response.status_code == 422


async def test_top_customers_empty(client: AsyncClient) -> None:
    response = await client.get("/api/v1/reports/top-customers?limit=5")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
