from datetime import date

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_list_orders_empty(client: AsyncClient) -> None:
    response = await client.get("/api/v1/orders")
    assert response.status_code == 200
    assert response.json()["total"] == 0


async def test_create_order(client: AsyncClient) -> None:
    customer = await client.post("/api/v1/customers", json={"name": "Customer A"})
    customer_id = customer.json()["id"]

    response = await client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "date": str(date.today()),
            "items": [
                {
                    "product_name": "Sticker",
                    "quantity": 10,
                    "unit_price": "2.00",
                    "unit_cost": "0.50",
                }
            ],
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["order_number"]
    assert len(body["items"]) == 1


async def test_get_order_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/v1/orders/missing-id")
    assert response.status_code == 404


async def test_delete_order(client: AsyncClient) -> None:
    customer = await client.post("/api/v1/customers", json={"name": "Customer B"})
    create = await client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer.json()["id"],
            "date": str(date.today()),
            "items": [],
        },
    )
    order_id = create.json()["id"]

    response = await client.delete(f"/api/v1/orders/{order_id}")
    assert response.status_code == 204
