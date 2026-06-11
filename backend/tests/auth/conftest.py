import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_db
from src.core.rate_limit import limiter
from src.core.security import create_magic_login_token, hash_password
from src.main import app
from src.users.enums import UserRole
from src.users.models import User

AUTH_TEST_PASSWORD = "Password123!"


@pytest.fixture(autouse=True)
def reset_rate_limiter() -> None:
    limiter._limiter.storage.reset()


@pytest_asyncio.fixture
async def auth_user(db_session: AsyncSession) -> User:
    """Sys-admin user with a known password — skips org resolution, simplifies auth tests."""
    user = User(
        id=str(uuid.uuid4()),
        email=f"auth-test-{uuid.uuid4()}@example.com",
        hashed_password=hash_password(AUTH_TEST_PASSWORD),
        full_name="Auth Test User",
        is_active=True,
        role=UserRole.system_admin.value,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def auth_user_magic_token(auth_user: User) -> str:
    return create_magic_login_token(auth_user.id)


@pytest_asyncio.fixture
async def raw_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Client that only overrides get_db — no auth shortcuts.
    Used for auth route integration tests that exercise the real auth flow."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
