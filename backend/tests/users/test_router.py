import pytest
from httpx import AsyncClient

from src.users.models import User

pytestmark = pytest.mark.asyncio


async def test_list_users_non_admin_returns_403(client: AsyncClient) -> None:
    response = await client.get("/api/v1/users")
    assert response.status_code == 403


async def test_list_users_admin_returns_200(admin_client: AsyncClient) -> None:
    response = await admin_client.get("/api/v1/users")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "pages" in data


async def test_create_user_as_admin_returns_201(admin_client: AsyncClient) -> None:
    response = await admin_client.post(
        "/api/v1/users",
        json={"email": "newuser@example.com", "full_name": "New User"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "newuser@example.com"
    assert body["full_name"] == "New User"
    assert body["role"] == "user"
    assert body["is_active"] is True
    assert "id" in body
    assert "created_at" in body
    assert "updated_at" in body
    assert "hashed_password" not in body


async def test_create_user_non_admin_returns_403(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/users",
        json={"email": "another@example.com", "full_name": "Another"},
    )
    assert response.status_code == 403


async def test_create_user_duplicate_email_returns_409(admin_client: AsyncClient) -> None:
    await admin_client.post(
        "/api/v1/users",
        json={"email": "dup@example.com", "full_name": "First"},
    )
    response = await admin_client.post(
        "/api/v1/users",
        json={"email": "dup@example.com", "full_name": "Second"},
    )
    assert response.status_code == 409


async def test_create_user_invalid_email_returns_422(admin_client: AsyncClient) -> None:
    response = await admin_client.post(
        "/api/v1/users",
        json={"email": "not-an-email", "full_name": "Bad Email"},
    )
    assert response.status_code == 422


async def test_delete_user_as_admin_returns_204(
    admin_client: AsyncClient, test_user: User
) -> None:
    response = await admin_client.delete(f"/api/v1/users/{test_user.id}")
    assert response.status_code == 204


async def test_delete_self_as_admin_returns_403(
    admin_client: AsyncClient, admin_user: User
) -> None:
    response = await admin_client.delete(f"/api/v1/users/{admin_user.id}")
    assert response.status_code == 403


async def test_delete_nonexistent_user_returns_404(admin_client: AsyncClient) -> None:
    response = await admin_client.delete(
        "/api/v1/users/00000000-0000-0000-0000-000000000000"
    )
    assert response.status_code == 404


async def test_delete_user_non_admin_returns_403(
    client: AsyncClient, test_user: User
) -> None:
    response = await client.delete(f"/api/v1/users/{test_user.id}")
    assert response.status_code == 403
