import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_list_categories_returns_list(client: AsyncClient) -> None:
    await client.post("/api/v1/expense-categories", json={"name": "דיו"})
    await client.post("/api/v1/expense-categories", json={"name": "ציוד"})

    response = await client.get("/api/v1/expense-categories")
    assert response.status_code == 200
    names = [c["name"] for c in response.json()]
    assert "דיו" in names
    assert "ציוד" in names


async def test_create_category(client: AsyncClient) -> None:
    response = await client.post("/api/v1/expense-categories", json={"name": "בונוסים"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "בונוסים"
    assert "id" in data


async def test_create_category_duplicate_name(client: AsyncClient) -> None:
    await client.post("/api/v1/expense-categories", json={"name": "כפול"})
    response = await client.post("/api/v1/expense-categories", json={"name": "כפול"})
    assert response.status_code == 409
    assert response.json()["code"] == "CATEGORY_NAME_EXISTS"


async def test_update_category(client: AsyncClient) -> None:
    create = await client.post("/api/v1/expense-categories", json={"name": "ישן"})
    category_id = create.json()["id"]

    response = await client.put(f"/api/v1/expense-categories/{category_id}", json={"name": "חדש"})
    assert response.status_code == 200
    assert response.json()["name"] == "חדש"


async def test_update_category_not_found(client: AsyncClient) -> None:
    response = await client.put("/api/v1/expense-categories/missing-id", json={"name": "כלשהו"})
    assert response.status_code == 404


async def test_delete_category(client: AsyncClient) -> None:
    create = await client.post("/api/v1/expense-categories", json={"name": "למחיקה"})
    category_id = create.json()["id"]

    response = await client.delete(f"/api/v1/expense-categories/{category_id}")
    assert response.status_code == 204


async def test_delete_category_not_found(client: AsyncClient) -> None:
    response = await client.delete("/api/v1/expense-categories/missing-id")
    assert response.status_code == 404


async def test_delete_category_in_use(client: AsyncClient) -> None:
    cat = await client.post("/api/v1/expense-categories", json={"name": "בשימוש"})
    category_id = cat.json()["id"]

    await client.post(
        "/api/v1/expenses",
        json={"date": "2026-01-15", "category_id": category_id, "amount": "50.00"},
    )

    response = await client.delete(f"/api/v1/expense-categories/{category_id}")
    assert response.status_code == 409
    assert response.json()["code"] == "CATEGORY_IN_USE"
