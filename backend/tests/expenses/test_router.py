from datetime import date

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_list_expenses_empty(client: AsyncClient) -> None:
    response = await client.get("/api/v1/expenses")
    assert response.status_code == 200
    assert response.json()["total"] == 0


async def test_create_expense_no_category(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/expenses",
        json={"date": str(date.today()), "amount": "25.50", "notes": "test"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["category"] is None
    assert body["category_id"] is None
    assert body["amount"] == "25.50"


async def test_create_expense_with_category(client: AsyncClient) -> None:
    cat = await client.post("/api/v1/expense-categories", json={"name": "דיו"})
    category_id = cat.json()["id"]

    response = await client.post(
        "/api/v1/expenses",
        json={"date": str(date.today()), "category_id": category_id, "amount": "30.00"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["category_id"] == category_id
    assert body["category"]["name"] == "דיו"


async def test_update_expense(client: AsyncClient) -> None:
    create = await client.post(
        "/api/v1/expenses",
        json={"date": str(date.today()), "amount": "5.00"},
    )
    expense_id = create.json()["id"]

    response = await client.put(
        f"/api/v1/expenses/{expense_id}",
        json={"amount": "10.00"},
    )
    assert response.status_code == 200
    assert response.json()["amount"] == "10.00"


async def test_update_expense_not_found(client: AsyncClient) -> None:
    response = await client.put(
        "/api/v1/expenses/missing-id",
        json={"amount": "1.00"},
    )
    assert response.status_code == 404


async def test_delete_expense(client: AsyncClient) -> None:
    create = await client.post(
        "/api/v1/expenses",
        json={"date": str(date.today()), "amount": "1.00"},
    )
    expense_id = create.json()["id"]

    response = await client.delete(f"/api/v1/expenses/{expense_id}")
    assert response.status_code == 204
