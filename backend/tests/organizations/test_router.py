import pytest
from httpx import AsyncClient

from src.organizations.models import Organization

pytestmark = pytest.mark.asyncio


async def test_get_my_org_returns_200(client: AsyncClient, organization: Organization) -> None:
    response = await client.get("/api/v1/orgs/me")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == organization.id
    assert body["name"] == organization.name
    assert body["slug"] == organization.slug


async def test_update_my_org_name(client: AsyncClient) -> None:
    response = await client.patch("/api/v1/orgs/me", json={"name": "Updated Name"})
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


async def test_update_my_org_empty_patch_is_noop(
    client: AsyncClient, organization: Organization
) -> None:
    response = await client.patch("/api/v1/orgs/me", json={})
    assert response.status_code == 200
    assert response.json()["name"] == organization.name


async def test_list_members_returns_current_member(client: AsyncClient) -> None:
    response = await client.get("/api/v1/orgs/me/members")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) >= 1


async def test_get_public_branding_returns_200(
    client: AsyncClient, organization: Organization
) -> None:
    response = await client.get(f"/api/v1/orgs/branding/{organization.slug}")
    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == organization.slug
    assert body["name"] == organization.name


async def test_get_public_branding_unknown_slug_returns_404(client: AsyncClient) -> None:
    response = await client.get("/api/v1/orgs/branding/no-such-org-slug")
    assert response.status_code == 404


async def test_invite_member_sends_invite(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/orgs/me/invite",
        json={"email": "invited@example.com", "role": "member"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "invited@example.com"
    assert body["role"] == "member"
    assert "id" in body


async def test_remove_nonexistent_member_returns_404(client: AsyncClient) -> None:
    response = await client.delete(
        "/api/v1/orgs/me/members/00000000-0000-0000-0000-000000000000"
    )
    assert response.status_code == 404
