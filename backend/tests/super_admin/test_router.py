import pytest
from httpx import AsyncClient

from src.organizations.models import Organization

pytestmark = pytest.mark.asyncio


async def test_list_orgs_requires_sys_admin(client: AsyncClient) -> None:
    response = await client.get("/api/v1/admin/orgs")
    assert response.status_code in (401, 403)


async def test_list_orgs_returns_paginated_results(
    sys_admin_client: AsyncClient, organization: Organization
) -> None:
    response = await sys_admin_client.get("/api/v1/admin/orgs")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body
    assert body["total"] >= 1
    ids = [o["id"] for o in body["items"]]
    assert organization.id in ids


async def test_get_org_by_id(
    sys_admin_client: AsyncClient, organization: Organization
) -> None:
    response = await sys_admin_client.get(f"/api/v1/admin/orgs/{organization.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == organization.id


async def test_get_org_not_found(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.get(
        "/api/v1/admin/orgs/00000000-0000-0000-0000-000000000000"
    )
    assert response.status_code == 404


async def test_update_org_status_deactivate(
    sys_admin_client: AsyncClient, organization: Organization
) -> None:
    response = await sys_admin_client.patch(
        f"/api/v1/admin/orgs/{organization.id}/status",
        json={"is_active": False},
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False


async def test_update_org_status_activate(
    sys_admin_client: AsyncClient, organization: Organization
) -> None:
    await sys_admin_client.patch(
        f"/api/v1/admin/orgs/{organization.id}/status",
        json={"is_active": False},
    )
    response = await sys_admin_client.patch(
        f"/api/v1/admin/orgs/{organization.id}/status",
        json={"is_active": True},
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is True


async def test_update_org_plan(
    sys_admin_client: AsyncClient, organization: Organization
) -> None:
    response = await sys_admin_client.patch(
        f"/api/v1/admin/orgs/{organization.id}/plan",
        json={"plan": "basic", "max_users": 5},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["plan"] == "basic"
    assert body["max_users"] == 5


async def test_create_org_via_admin(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.post(
        "/api/v1/admin/orgs",
        json={
            "business_name": "New Admin Org",
            "slug": "new-admin-org",
            "owner_email": "admin-create@example.com",
            "password": "securepass123",
            "plan": "professional",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["slug"] == "new-admin-org"
    assert body["plan"] == "professional"
