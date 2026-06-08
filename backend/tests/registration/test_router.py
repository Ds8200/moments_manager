from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = pytest.mark.asyncio

VALID_PAYLOAD = {
    "business_name": "דפוס בדיקה",
    "slug": "test-print-shop",
    "owner_email": "owner@test-print-shop.com",
    "password": "securepass123",
}


async def test_register_creates_org_and_user(db_session: AsyncSession) -> None:
    from httpx import ASGITransport

    from src.core.dependencies import get_db
    from src.main import app

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with patch("src.registration.service._send_welcome_email"):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.post("/api/v1/register", json=VALID_PAYLOAD)

    app.dependency_overrides.clear()

    assert response.status_code == 201
    body = response.json()
    assert "org_id" in body
    assert "user_id" in body
    assert body["org_slug"] == VALID_PAYLOAD["slug"]


async def test_register_duplicate_slug_returns_409(db_session: AsyncSession) -> None:
    from httpx import ASGITransport

    from src.core.dependencies import get_db
    from src.main import app

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with patch("src.registration.service._send_welcome_email"):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            await ac.post("/api/v1/register", json=VALID_PAYLOAD)
            response = await ac.post(
                "/api/v1/register",
                json={**VALID_PAYLOAD, "owner_email": "other@test.com"},
            )

    app.dependency_overrides.clear()

    assert response.status_code == 409


async def test_register_invalid_slug_returns_422(db_session: AsyncSession) -> None:
    from httpx import ASGITransport

    from src.core.dependencies import get_db
    from src.main import app

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/register",
            json={**VALID_PAYLOAD, "slug": "INVALID SLUG!!"},
        )

    app.dependency_overrides.clear()

    assert response.status_code == 422


async def test_register_short_password_returns_422(db_session: AsyncSession) -> None:
    from httpx import ASGITransport

    from src.core.dependencies import get_db
    from src.main import app

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/register",
            json={**VALID_PAYLOAD, "password": "short"},
        )

    app.dependency_overrides.clear()

    assert response.status_code == 422
