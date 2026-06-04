import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_list_products_empty(client: AsyncClient) -> None:
    response = await client.get("/api/v1/products")
    assert response.status_code == 200
    assert response.json()["total"] == 0


async def test_create_product_no_category(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/products",
        json={
            "name": "Business Card",
            "base_price": "10.00",
            "base_cost": "3.00",
            "avg_production_days": 2,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Business Card"
    assert data["category"] is None
    assert data["category_id"] is None


async def test_create_product_with_category(client: AsyncClient) -> None:
    cat = await client.post("/api/v1/product-categories", json={"name": "הדפסה"})
    category_id = cat.json()["id"]

    response = await client.post(
        "/api/v1/products",
        json={
            "name": "כרטיס ביקור",
            "category_id": category_id,
            "base_price": "10.00",
            "base_cost": "3.00",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["category_id"] == category_id
    assert data["category"]["name"] == "הדפסה"


async def test_get_product_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/v1/products/missing-id")
    assert response.status_code == 404


async def test_update_product(client: AsyncClient) -> None:
    create = await client.post(
        "/api/v1/products",
        json={"name": "Old", "base_price": "5.00", "base_cost": "1.00"},
    )
    product_id = create.json()["id"]

    response = await client.put(f"/api/v1/products/{product_id}", json={"name": "New"})
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
