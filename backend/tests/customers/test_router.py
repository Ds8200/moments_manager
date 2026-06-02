from unittest.mock import patch

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_list_customers_empty(client: AsyncClient) -> None:
    response = await client.get("/api/v1/customers")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


async def test_create_customer(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/customers",
        json={"name": "Acme Inc", "phone": "0500000000", "email": "a@b.com"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Acme Inc"
    assert body["phone"] == "0500000000"
    assert "id" in body


async def test_get_customer_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/v1/customers/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


async def test_update_customer(client: AsyncClient) -> None:
    create = await client.post("/api/v1/customers", json={"name": "Old Name"})
    customer_id = create.json()["id"]

    response = await client.put(
        f"/api/v1/customers/{customer_id}",
        json={"name": "New Name"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


async def test_delete_customer(client: AsyncClient) -> None:
    create = await client.post("/api/v1/customers", json={"name": "ToDelete"})
    customer_id = create.json()["id"]

    response = await client.delete(f"/api/v1/customers/{customer_id}")
    assert response.status_code == 204

    follow_up = await client.get(f"/api/v1/customers/{customer_id}")
    assert follow_up.status_code == 404


async def test_list_customers_pagination(client: AsyncClient) -> None:
    for i in range(3):
        await client.post("/api/v1/customers", json={"name": f"Customer {i}"})

    response = await client.get("/api/v1/customers?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 3
    assert data["pages"] == 2


async def test_send_email_customer_not_found(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/customers/00000000-0000-0000-0000-000000000000/send-email",
        json={"subject": "נושא", "body": "גוף"},
    )
    assert response.status_code == 404


async def test_send_email_no_email_on_customer(client: AsyncClient) -> None:
    create = await client.post("/api/v1/customers", json={"name": "No Email"})
    customer_id = create.json()["id"]

    response = await client.post(
        f"/api/v1/customers/{customer_id}/send-email",
        json={"subject": "נושא", "body": "גוף"},
    )
    assert response.status_code == 409


async def test_send_email_success(client: AsyncClient) -> None:
    create = await client.post(
        "/api/v1/customers", json={"name": "With Email", "email": "test@example.com"}
    )
    customer_id = create.json()["id"]

    with patch("src.customers.service.send_html_email"):
        response = await client.post(
            f"/api/v1/customers/{customer_id}/send-email",
            json={"subject": "שלום", "body": "תוכן המייל"},
        )

    assert response.status_code == 202
    assert "message" in response.json()
