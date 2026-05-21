import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_list_products_empty(client: AsyncClient) -> None:
    response = await client.get("/api/v1/products")
    assert response.status_code == 200
    assert response.json()["total"] == 0


async def test_create_product(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/products",
        json={
            "name": "Business Card",
            "category": "print",
            "base_price": "10.00",
            "base_cost": "3.00",
            "avg_production_days": 2,
        },
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Business Card"


async def test_get_product_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/v1/products/missing-id")
    assert response.status_code == 404


async def test_update_product(client: AsyncClient) -> None:
    create = await client.post(
        "/api/v1/products",
        json={"name": "Old", "base_price": "5.00", "base_cost": "1.00"},
    )
    product_id = create.json()["id"]

    response = await client.put(
        f"/api/v1/products/{product_id}",
        json={"name": "New"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New"


async def test_delete_product(client: AsyncClient) -> None:
    create = await client.post(
        "/api/v1/products",
        json={"name": "Doomed", "base_price": "1.00", "base_cost": "0.50"},
    )
    product_id = create.json()["id"]

    response = await client.delete(f"/api/v1/products/{product_id}")
    assert response.status_code == 204
