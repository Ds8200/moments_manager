"""Integration tests for /api/v1/admin/settings routes (requires PostgreSQL test DB)."""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_get_settings_requires_sys_admin(client: AsyncClient) -> None:
    response = await client.get("/api/v1/admin/settings")
    assert response.status_code in (401, 403)


async def test_get_settings_returns_schema(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.get("/api/v1/admin/settings")
    assert response.status_code == 200
    body = response.json()
    assert "has_smtp_config" in body
    assert "has_openai_key" in body
    assert "updated_at" in body


async def test_get_settings_creates_singleton_if_missing(sys_admin_client: AsyncClient) -> None:
    # First call creates the singleton
    r1 = await sys_admin_client.get("/api/v1/admin/settings")
    assert r1.status_code == 200
    # Second call returns the same row
    r2 = await sys_admin_client.get("/api/v1/admin/settings")
    assert r2.status_code == 200
    assert r1.json()["updated_at"] == r2.json()["updated_at"]


async def test_update_smtp_requires_sys_admin(client: AsyncClient) -> None:
    response = await client.patch("/api/v1/admin/settings/smtp", json={"platform_smtp_host": "x"})
    assert response.status_code in (401, 403)


async def test_update_smtp_stores_and_returns_config(sys_admin_client: AsyncClient) -> None:
    payload = {
        "platform_smtp_host": "smtp.gmail.com",
        "platform_smtp_port": 587,
        "platform_smtp_username": "platform@example.com",
        "platform_smtp_password": "app-secret",
        "platform_smtp_from_email": "platform@example.com",
        "platform_smtp_from_name": "Nihulo",
    }
    response = await sys_admin_client.patch("/api/v1/admin/settings/smtp", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["has_smtp_config"] is True
    assert body["smtp_host"] == "smtp.gmail.com"
    assert body["smtp_username"] == "platform@example.com"


async def test_update_openai_requires_sys_admin(client: AsyncClient) -> None:
    response = await client.patch(
        "/api/v1/admin/settings/openai", json={"platform_openai_api_key": "sk-x"}
    )
    assert response.status_code in (401, 403)


async def test_update_openai_stores_key(sys_admin_client: AsyncClient) -> None:
    payload = {"platform_openai_api_key": "sk-abcd1234xxxx"}
    response = await sys_admin_client.patch("/api/v1/admin/settings/openai", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["has_openai_key"] is True
    assert body["openai_key_preview"] == "xxxx"


async def test_change_password_requires_sys_admin(client: AsyncClient) -> None:
    response = await client.patch(
        "/api/v1/admin/settings/password",
        json={"current_password": "x", "new_password": "newpass12"},
    )
    assert response.status_code in (401, 403)


async def test_change_password_wrong_current(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.patch(
        "/api/v1/admin/settings/password",
        json={"current_password": "definitely_wrong", "new_password": "newpass123"},
    )
    assert response.status_code == 401


async def test_change_password_short_new_password(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.patch(
        "/api/v1/admin/settings/password",
        json={"current_password": "adminpass123", "new_password": "short"},
    )
    assert response.status_code == 422


async def test_change_password_success(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.patch(
        "/api/v1/admin/settings/password",
        json={"current_password": "adminpass123", "new_password": "newadminpass"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "message" in body
