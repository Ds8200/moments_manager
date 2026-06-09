import pytest
from httpx import AsyncClient

from src.organizations.models import Organization
from src.users.models import User

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


async def test_get_org_by_id(sys_admin_client: AsyncClient, organization: Organization) -> None:
    response = await sys_admin_client.get(f"/api/v1/admin/orgs/{organization.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == organization.id


async def test_get_org_not_found(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.get("/api/v1/admin/orgs/00000000-0000-0000-0000-000000000000")
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


async def test_update_org_plan(sys_admin_client: AsyncClient, organization: Organization) -> None:
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
            "owner_full_name": "Admin Create Owner",
            "owner_password": "securepass123",
            "plan": "professional",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["slug"] == "new-admin-org"
    assert body["plan"] == "professional"


async def test_update_org_name_and_slug(
    sys_admin_client: AsyncClient, organization: Organization
) -> None:
    response = await sys_admin_client.patch(
        f"/api/v1/admin/orgs/{organization.id}",
        json={"name": "Renamed Org", "slug": "renamed-org"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Renamed Org"
    assert body["slug"] == "renamed-org"
    assert "owner_email" in body


async def test_update_org_not_found(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.patch(
        "/api/v1/admin/orgs/00000000-0000-0000-0000-000000000000",
        json={"name": "X"},
    )
    assert response.status_code == 404


async def test_update_org_requires_sys_admin(
    client: AsyncClient, organization: Organization
) -> None:
    response = await client.patch(
        f"/api/v1/admin/orgs/{organization.id}",
        json={"name": "X"},
    )
    assert response.status_code in (401, 403)


async def test_create_org_without_slug_auto_generates(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.post(
        "/api/v1/admin/orgs",
        json={
            "business_name": "Auto Slug Org",
            "owner_email": "autoslug@example.com",
            "owner_full_name": "Auto Owner",
            "owner_password": "securepass123",
            "plan": "trial",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["slug"] != ""
    assert "owner_email" in body


async def test_get_org_owners_requires_sys_admin(client: AsyncClient) -> None:
    response = await client.get("/api/v1/admin/org-owners")
    assert response.status_code in (401, 403)


async def test_get_org_owners_returns_list(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.get("/api/v1/admin/org-owners")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


async def test_compose_email_requires_sys_admin(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/admin/email/compose",
        json={
            "org_owner_ids": [],
            "manual_emails": ["x@x.com"],
            "subject": "hi",
            "body": "world",
        },
    )
    assert response.status_code in (401, 403)


async def test_compose_email_no_platform_smtp_returns_409(sys_admin_client: AsyncClient) -> None:
    # SystemSettings row auto-created with no SMTP → ConflictError → 409
    response = await sys_admin_client.post(
        "/api/v1/admin/email/compose",
        json={
            "org_owner_ids": [],
            "manual_emails": ["manual@example.com"],
            "subject": "Hello",
            "body": "World",
        },
    )
    assert response.status_code == 409


async def test_delete_org(
    sys_admin_client: AsyncClient, organization: Organization
) -> None:
    response = await sys_admin_client.delete(f"/api/v1/admin/orgs/{organization.id}")
    assert response.status_code == 200
    body = response.json()
    assert "message" in body


async def test_delete_org_not_found(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.delete(
        "/api/v1/admin/orgs/00000000-0000-0000-0000-000000000000"
    )
    assert response.status_code == 404


async def test_delete_org_requires_sys_admin(
    client: AsyncClient, organization: Organization
) -> None:
    response = await client.delete(f"/api/v1/admin/orgs/{organization.id}")
    assert response.status_code in (401, 403)


async def test_reset_owner_password(
    sys_admin_client: AsyncClient, organization: Organization
) -> None:
    # No platform SMTP configured in test env — email is skipped but endpoint succeeds
    response = await sys_admin_client.post(
        f"/api/v1/admin/orgs/{organization.id}/reset-password"
    )
    assert response.status_code == 202
    body = response.json()
    assert "message" in body


async def test_reset_owner_password_not_found(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.post(
        "/api/v1/admin/orgs/00000000-0000-0000-0000-000000000000/reset-password"
    )
    assert response.status_code == 404


async def test_reset_owner_password_requires_sys_admin(
    client: AsyncClient, organization: Organization
) -> None:
    response = await client.post(f"/api/v1/admin/orgs/{organization.id}/reset-password")
    assert response.status_code in (401, 403)


async def test_get_org_user_by_id_returns_200(
    sys_admin_client: AsyncClient, test_user: User
) -> None:
    response = await sys_admin_client.get(f"/api/v1/admin/orgs/users/{test_user.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == test_user.id
    assert body["email"] == test_user.email
    assert "full_name" in body
    assert "org_count" in body


async def test_get_org_user_not_found_returns_404(sys_admin_client: AsyncClient) -> None:
    response = await sys_admin_client.get(
        "/api/v1/admin/orgs/users/00000000-0000-0000-0000-000000000000"
    )
    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"
