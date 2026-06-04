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


async def test_update_urgency(client: AsyncClient) -> None:
    customer = await client.post("/api/v1/customers", json={"name": "Customer C"})
    create = await client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer.json()["id"],
            "date": str(date.today()),
            "items": [],
        },
    )
    order_id = create.json()["id"]
    assert create.json()["urgency"] == "normal"

    response = await client.patch(
        f"/api/v1/orders/{order_id}/urgency",
        json={"urgency": "very_urgent"},
    )
    assert response.status_code == 200
    assert response.json()["urgency"] == "very_urgent"


async def test_update_urgency_not_found(client: AsyncClient) -> None:
    response = await client.patch(
        "/api/v1/orders/missing-id/urgency",
        json={"urgency": "urgent"},
    )
    assert response.status_code == 404


@pytest.mark.parametrize("sort_by", ["created_at", "customer_name", "due_datetime", "urgency"])
async def test_list_orders_sort_by_returns_200(client: AsyncClient, sort_by: str) -> None:
    response = await client.get(f"/api/v1/orders?sort_by={sort_by}")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body


async def test_list_orders_sort_by_customer_name_is_alphabetical(client: AsyncClient) -> None:
    cust_z = await client.post("/api/v1/customers", json={"name": "Zebra"})
    cust_a = await client.post("/api/v1/customers", json={"name": "Apple"})
    today = str(date.today())
    await client.post(
        "/api/v1/orders",
        json={"customer_id": cust_z.json()["id"], "date": today, "items": []},
    )
    await client.post(
        "/api/v1/orders",
        json={"customer_id": cust_a.json()["id"], "date": today, "items": []},
    )

    response = await client.get("/api/v1/orders?sort_by=customer_name")
    assert response.status_code == 200
    names = [item["customer_name"] for item in response.json()["items"]]
    assert names == sorted(names)


async def test_list_orders_sort_by_created_at_newest_first(client: AsyncClient) -> None:
    customer = await client.post("/api/v1/customers", json={"name": "Sort Customer"})
    today = str(date.today())
    first = await client.post(
        "/api/v1/orders",
        json={"customer_id": customer.json()["id"], "date": today, "items": []},
    )
    second = await client.post(
        "/api/v1/orders",
        json={"customer_id": customer.json()["id"], "date": today, "items": []},
    )

    response = await client.get("/api/v1/orders?sort_by=created_at")
    assert response.status_code == 200
    ids = [item["id"] for item in response.json()["items"]]
    assert ids.index(second.json()["id"]) < ids.index(first.json()["id"])


async def test_list_orders_sort_by_urgency_most_urgent_first(client: AsyncClient) -> None:
    customer = await client.post("/api/v1/customers", json={"name": "Urgency Customer"})
    today = str(date.today())
    order_normal = await client.post(
        "/api/v1/orders",
        json={"customer_id": customer.json()["id"], "date": today, "items": []},
    )
    order_urgent = await client.post(
        "/api/v1/orders",
        json={"customer_id": customer.json()["id"], "date": today, "items": []},
    )
    order_very = await client.post(
        "/api/v1/orders",
        json={"customer_id": customer.json()["id"], "date": today, "items": []},
    )
    await client.patch(
        f"/api/v1/orders/{order_urgent.json()['id']}/urgency", json={"urgency": "urgent"}
    )
    await client.patch(
        f"/api/v1/orders/{order_very.json()['id']}/urgency", json={"urgency": "very_urgent"}
    )

    response = await client.get("/api/v1/orders?sort_by=urgency")
    assert response.status_code == 200
    urgencies = [item["urgency"] for item in response.json()["items"]]
    very_idx = urgencies.index("very_urgent")
    urgent_idx = urgencies.index("urgent")
    normal_idx = urgencies.index("normal")
    assert very_idx < urgent_idx < normal_idx


async def test_list_orders_invalid_sort_by_returns_422(client: AsyncClient) -> None:
    response = await client.get("/api/v1/orders?sort_by=invalid_field")
    assert response.status_code == 422
