import asyncio
import sys
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
)

from src.config import settings

if sys.platform == "win32":
    # SelectorEventLoop avoids IOCP proactor instability (WinError 10054) on Windows
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
from src.core.dependencies import (
    OrgContext,
    get_current_user,
    get_db,
    get_org_context,
    require_sys_admin,
)
from src.core.security import create_access_token, hash_password
from src.database import Base
from src.main import app
from src.organizations.enums import OrgRole
from src.organizations.models import Organization, OrganizationMembership
from src.users.enums import UserRole
from src.users.models import User


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def engine():
    if not settings.TEST_DATABASE_URL:
        pytest.skip("TEST_DATABASE_URL not configured")

    test_engine = create_async_engine(
        settings.TEST_DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={
            "server_settings": {
                "tcp_keepalives_idle": "10",
                "tcp_keepalives_interval": "5",
                "tcp_keepalives_count": "3",
            }
        },
    )
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield test_engine
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    async with engine.connect() as conn:
        await conn.begin()
        async with AsyncSession(
            bind=conn,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint",
        ) as session:
            yield session
        await conn.rollback()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email=f"test-{uuid.uuid4()}@example.com",
        hashed_password=hash_password("testpass123"),
        full_name="Test User",
        is_active=True,
        role=UserRole.user.value,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def organization(db_session: AsyncSession, test_user: User) -> Organization:
    org = Organization(
        id=str(uuid.uuid4()),
        org_number=f"ORG-2026-{str(uuid.uuid4().int)[-4:]}",
        slug=f"test-org-{uuid.uuid4().hex[:8]}",
        name="Test Org",
        plan="trial",
        is_active=True,
        max_users=10,
        owner_id=test_user.id,
        smtp_host="smtp.example.com",
        smtp_port=587,
        smtp_username="org@example.com",
        smtp_password="secret",
        smtp_from_email="org@example.com",
        smtp_from_name="Test Org",
    )
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)
    return org


@pytest_asyncio.fixture
async def membership(
    db_session: AsyncSession, test_user: User, organization: Organization
) -> OrganizationMembership:
    """test_user as a regular member — allows org-scoped ops but blocks require_admin gates."""
    m = OrganizationMembership(
        id=str(uuid.uuid4()),
        organization_id=organization.id,
        user_id=test_user.id,
        role=OrgRole.member.value,
        is_active=True,
    )
    db_session.add(m)
    await db_session.commit()
    await db_session.refresh(m)
    return m


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email=f"admin-{uuid.uuid4()}@example.com",
        hashed_password=hash_password("adminpass123"),
        full_name="Admin User",
        is_active=True,
        role=UserRole.user.value,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_membership(
    db_session: AsyncSession, admin_user: User, organization: Organization
) -> OrganizationMembership:
    """admin_user as org owner — passes require_admin gate."""
    m = OrganizationMembership(
        id=str(uuid.uuid4()),
        organization_id=organization.id,
        user_id=admin_user.id,
        role=OrgRole.owner.value,
        is_active=True,
    )
    db_session.add(m)
    await db_session.commit()
    await db_session.refresh(m)
    return m


@pytest_asyncio.fixture
async def sys_admin_user(db_session: AsyncSession) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email=f"sysadmin-{uuid.uuid4()}@example.com",
        hashed_password=hash_password("adminpass123"),
        full_name="Sys Admin",
        is_active=True,
        role=UserRole.system_admin.value,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def client(
    db_session: AsyncSession,
    test_user: User,
    organization: Organization,
    membership: OrganizationMembership,
) -> AsyncGenerator[AsyncClient, None]:
    org_ctx = OrgContext(user=test_user, org=organization, membership=membership)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    async def override_get_org_context() -> OrgContext:
        return org_ctx

    async def override_get_current_user() -> User:
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_org_context] = override_get_org_context
    app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_client(
    db_session: AsyncSession,
    admin_user: User,
    organization: Organization,
    admin_membership: OrganizationMembership,
) -> AsyncGenerator[AsyncClient, None]:
    org_ctx = OrgContext(user=admin_user, org=organization, membership=admin_membership)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    async def override_get_org_context() -> OrgContext:
        return org_ctx

    async def override_get_current_user() -> User:
        return admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_org_context] = override_get_org_context
    app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def sys_admin_client(
    db_session: AsyncSession, sys_admin_user: User
) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    async def override_require_sys_admin() -> User:
        return sys_admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_sys_admin] = override_require_sys_admin

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(test_user: User, organization: Organization) -> dict[str, str]:
    token = create_access_token(
        test_user.id,
        org_id=organization.id,
        org_role=OrgRole.member.value,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sys_admin_headers(sys_admin_user: User) -> dict[str, str]:
    token = create_access_token(
        sys_admin_user.id,
        org_id=None,
        org_role=None,
        sys_admin=True,
    )
    return {"Authorization": f"Bearer {token}"}
