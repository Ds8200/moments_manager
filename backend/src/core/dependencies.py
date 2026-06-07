import logging
from dataclasses import dataclass
from typing import AsyncGenerator

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import (
    FORBIDDEN,
    NO_ORG_FOR_USER,
    ORG_ACCESS_DENIED,
    ORG_CONTEXT_REQUIRED,
    ORG_INACTIVE,
    ORG_NOT_FOUND,
    TOKEN_INVALID,
    TOKEN_PAYLOAD_INVALID,
    USER_NOT_FOUND,
)
from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import ForbiddenError, UnauthorizedError
from src.core.security import MAGIC_LOGIN_PURPOSE, decode_access_token
from src.database import AsyncSessionLocal

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


@dataclass
class OrgContext:
    """Resolved per-request tenant context derived from the JWT."""

    user: object          # src.users.models.User
    org: object           # src.organizations.models.Organization
    membership: object    # src.organizations.models.OrganizationMembership

    @property
    def org_id(self) -> str:
        return self.org.id  # type: ignore[attr-defined]

    @property
    def org_role(self) -> str:
        return self.membership.role  # type: ignore[attr-defined]


async def get_org_context(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> OrgContext:
    """Authenticate the request and resolve full org/user/membership context."""
    from src.organizations.repository import MembershipRepository, OrgRepository
    from src.users.repository import UserRepository

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise UnauthorizedError(TOKEN_INVALID, code=ErrorCode.TOKEN_INVALID)

    if payload.get("purpose") == MAGIC_LOGIN_PURPOSE:
        raise UnauthorizedError(TOKEN_INVALID, code=ErrorCode.TOKEN_INVALID)

    # sys_admin tokens carry no org context — they must use require_sys_admin instead
    if payload.get("sys_admin"):
        raise ForbiddenError(ORG_CONTEXT_REQUIRED)

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError(TOKEN_PAYLOAD_INVALID, code=ErrorCode.TOKEN_INVALID)

    org_id = payload.get("org_id")
    if not org_id:
        raise UnauthorizedError(NO_ORG_FOR_USER, code=ErrorCode.NO_ORG_FOR_USER)

    user = await UserRepository(db).get_by_id(user_id)
    if user is None or user.is_deleted:
        raise UnauthorizedError(USER_NOT_FOUND, code=ErrorCode.UNAUTHORIZED)

    org = await OrgRepository(db).get_by_id(org_id)
    if org is None or org.is_deleted:
        raise UnauthorizedError(ORG_NOT_FOUND, code=ErrorCode.ORG_NOT_FOUND)
    if not org.is_active:
        raise UnauthorizedError(ORG_INACTIVE, code=ErrorCode.ORG_INACTIVE)

    membership = await MembershipRepository(db).get_active(user_id, org_id)
    if membership is None:
        raise ForbiddenError(ORG_ACCESS_DENIED)

    return OrgContext(user=user, org=org, membership=membership)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Legacy dependency kept for auth/* routes that don't need org context.
    Returns the User ORM object only.
    """
    from src.users.repository import UserRepository

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise UnauthorizedError(TOKEN_INVALID, code=ErrorCode.TOKEN_INVALID)

    if payload.get("purpose") == MAGIC_LOGIN_PURPOSE:
        raise UnauthorizedError(TOKEN_INVALID, code=ErrorCode.TOKEN_INVALID)

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError(TOKEN_PAYLOAD_INVALID, code=ErrorCode.TOKEN_INVALID)

    user = await UserRepository(db).get_by_id(user_id)
    if user is None or user.is_deleted:
        raise UnauthorizedError(USER_NOT_FOUND, code=ErrorCode.UNAUTHORIZED)

    return user


async def require_sys_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Dependency for super-admin-only routes. Requires sys_admin=True in JWT."""
    from src.users.repository import UserRepository

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise UnauthorizedError(TOKEN_INVALID, code=ErrorCode.TOKEN_INVALID)

    if not payload.get("sys_admin"):
        raise ForbiddenError(FORBIDDEN)

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError(TOKEN_PAYLOAD_INVALID, code=ErrorCode.TOKEN_INVALID)

    user = await UserRepository(db).get_by_id(user_id)
    if user is None or user.is_deleted:
        raise UnauthorizedError(USER_NOT_FOUND, code=ErrorCode.UNAUTHORIZED)

    return user


async def require_admin(current_user=Depends(get_org_context)):
    """Org-level admin gate: org role must be owner or admin."""
    from src.organizations.enums import OrgRole

    if current_user.org_role not in (OrgRole.owner.value, OrgRole.admin.value):
        raise ForbiddenError(FORBIDDEN)
    return current_user
