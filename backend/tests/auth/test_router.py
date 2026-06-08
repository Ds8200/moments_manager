import pytest
from httpx import AsyncClient

from src.users.models import User

from .conftest import AUTH_TEST_PASSWORD

pytestmark = pytest.mark.asyncio


async def test_login_returns_access_token_in_body(raw_client: AsyncClient, auth_user: User) -> None:
    resp = await raw_client.post(
        "/api/v1/auth/login",
        json={"email": auth_user.email, "password": AUTH_TEST_PASSWORD},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


async def test_login_does_not_return_refresh_token_in_body(
    raw_client: AsyncClient, auth_user: User
) -> None:
    resp = await raw_client.post(
        "/api/v1/auth/login",
        json={"email": auth_user.email, "password": AUTH_TEST_PASSWORD},
    )
    assert resp.status_code == 200
    assert "refresh_token" not in resp.json()


async def test_login_sets_access_cookie_not_httponly(
    raw_client: AsyncClient, auth_user: User
) -> None:
    resp = await raw_client.post(
        "/api/v1/auth/login",
        json={"email": auth_user.email, "password": AUTH_TEST_PASSWORD},
    )
    assert resp.status_code == 200
    set_cookie_headers = resp.headers.get_list("set-cookie")
    access_hdr = next((h for h in set_cookie_headers if "access_token=" in h), None)
    assert access_hdr is not None, "access_token cookie not set"
    assert "HttpOnly" not in access_hdr


async def test_login_sets_refresh_cookie_httponly(
    raw_client: AsyncClient, auth_user: User
) -> None:
    resp = await raw_client.post(
        "/api/v1/auth/login",
        json={"email": auth_user.email, "password": AUTH_TEST_PASSWORD},
    )
    assert resp.status_code == 200
    set_cookie_headers = resp.headers.get_list("set-cookie")
    refresh_hdr = next((h for h in set_cookie_headers if "refresh_token=" in h), None)
    assert refresh_hdr is not None, "refresh_token cookie not set"
    assert "HttpOnly" in refresh_hdr
    assert "Path=/api/v1/auth" in refresh_hdr


async def test_login_wrong_password_returns_401(
    raw_client: AsyncClient, auth_user: User
) -> None:
    resp = await raw_client.post(
        "/api/v1/auth/login",
        json={"email": auth_user.email, "password": "wrong-password"},
    )
    assert resp.status_code == 401


async def test_refresh_with_cookie_returns_new_access_token(
    raw_client: AsyncClient, auth_user: User
) -> None:
    # Login to obtain the refresh_token cookie
    login_resp = await raw_client.post(
        "/api/v1/auth/login",
        json={"email": auth_user.email, "password": AUTH_TEST_PASSWORD},
    )
    assert login_resp.status_code == 200
    refresh_cookie = login_resp.cookies.get("refresh_token")
    assert refresh_cookie is not None

    # Use the cookie to refresh
    refresh_resp = await raw_client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": refresh_cookie},
    )
    assert refresh_resp.status_code == 200
    body = refresh_resp.json()
    assert "access_token" in body
    assert "refresh_token" not in body

    # New cookies must be set
    set_cookie_headers = refresh_resp.headers.get_list("set-cookie")
    assert any("access_token=" in h for h in set_cookie_headers)
    assert any("refresh_token=" in h for h in set_cookie_headers)


async def test_refresh_without_cookie_returns_401(raw_client: AsyncClient) -> None:
    resp = await raw_client.post("/api/v1/auth/refresh")
    assert resp.status_code == 401


async def test_logout_clears_both_cookies(
    raw_client: AsyncClient, auth_user: User
) -> None:
    login_resp = await raw_client.post(
        "/api/v1/auth/login",
        json={"email": auth_user.email, "password": AUTH_TEST_PASSWORD},
    )
    assert login_resp.status_code == 200
    refresh_cookie = login_resp.cookies.get("refresh_token")

    logout_resp = await raw_client.post(
        "/api/v1/auth/logout",
        cookies={"refresh_token": refresh_cookie},
    )
    assert logout_resp.status_code == 204

    set_cookie_headers = logout_resp.headers.get_list("set-cookie")
    # Both cookies must be cleared (max-age=0 or expires in the past)
    access_clear = next((h for h in set_cookie_headers if "access_token=" in h), None)
    refresh_clear = next((h for h in set_cookie_headers if "refresh_token=" in h), None)
    assert access_clear is not None
    assert refresh_clear is not None
    assert 'max-age=0' in access_clear.lower() or 'expires=' in access_clear.lower()


async def test_logout_without_cookie_returns_204(raw_client: AsyncClient) -> None:
    """Logout without a cookie is graceful — always returns 204."""
    resp = await raw_client.post("/api/v1/auth/logout")
    assert resp.status_code == 204


async def test_magic_login_sets_both_cookies(
    raw_client: AsyncClient, auth_user_magic_token: str
) -> None:
    resp = await raw_client.post(
        "/api/v1/auth/magic-login",
        json={"token": auth_user_magic_token},
    )
    assert resp.status_code == 200
    set_cookie_headers = resp.headers.get_list("set-cookie")
    assert any("access_token=" in h for h in set_cookie_headers)
    assert any("refresh_token=" in h for h in set_cookie_headers)
