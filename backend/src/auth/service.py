import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.repository import RefreshTokenRepository
from src.config import settings
from src.core.constants.http_messages import (
    INVALID_CREDENTIALS,
    MAGIC_LINK_INVALID,
    NO_ORG_FOR_USER,
    REFRESH_TOKEN_INVALID,
)
from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import UnauthorizedError
from src.core.security import (
    MAGIC_LOGIN_PURPOSE,
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_refresh_token,
    verify_password,
)
from src.users.enums import UserRole
from src.users.repository import UserRepository

logger = logging.getLogger(__name__)


@dataclass
class _TokenPair:
    access_token: str
    raw_refresh: str


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._users = UserRepository(db)
        self._tokens = RefreshTokenRepository(db)

    async def login(self, email: str, password: str) -> _TokenPair:
        user = await self._users.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedError(INVALID_CREDENTIALS, code=ErrorCode.INVALID_CREDENTIALS)

        if user.role == UserRole.system_admin.value:
            return await self._issue_token_pair(user.id, org_id=None, org_role=None, sys_admin=True)

        # Resolve org membership for regular users
        org_id, org_role = await self._resolve_org(user.id)
        return await self._issue_token_pair(
            user.id, org_id=org_id, org_role=org_role, sys_admin=False
        )

    async def refresh(self, refresh_token_str: str) -> _TokenPair:
        token_hash = hash_refresh_token(refresh_token_str)
        token = await self._tokens.get_valid_by_hash(token_hash)
        if not token:
            raise UnauthorizedError(REFRESH_TOKEN_INVALID, code=ErrorCode.REFRESH_TOKEN_INVALID)
        user = await self._users.get_by_id(token.user_id)
        if not user:
            raise UnauthorizedError(REFRESH_TOKEN_INVALID, code=ErrorCode.REFRESH_TOKEN_INVALID)
        await self._tokens.revoke(token_hash)
        await self._db.flush()

        if user.role == UserRole.system_admin.value:
            return await self._issue_token_pair(user.id, org_id=None, org_role=None, sys_admin=True)

        org_id, org_role = await self._resolve_org(user.id)
        return await self._issue_token_pair(
            user.id, org_id=org_id, org_role=org_role, sys_admin=False
        )

    async def magic_login(self, token: str) -> _TokenPair:
        payload = decode_access_token(token)
        if payload is None or payload.get("purpose") != MAGIC_LOGIN_PURPOSE:
            raise UnauthorizedError(MAGIC_LINK_INVALID, code=ErrorCode.MAGIC_LINK_INVALID)
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError(MAGIC_LINK_INVALID, code=ErrorCode.MAGIC_LINK_INVALID)
        user = await self._users.get_by_id(user_id)
        if not user:
            raise UnauthorizedError(MAGIC_LINK_INVALID, code=ErrorCode.MAGIC_LINK_INVALID)

        if user.role == UserRole.system_admin.value:
            return await self._issue_token_pair(user.id, org_id=None, org_role=None, sys_admin=True)

        org_id, org_role = await self._resolve_org(user.id)
        return await self._issue_token_pair(
            user.id, org_id=org_id, org_role=org_role, sys_admin=False
        )

    async def logout(self, refresh_token_str: str) -> None:
        token_hash = hash_refresh_token(refresh_token_str)
        await self._tokens.revoke(token_hash)
        await self._db.commit()

    async def _resolve_org(self, user_id: str) -> tuple[str, str]:
        """Return (org_id, org_role) for the user's active membership."""
        from src.organizations.repository import MembershipRepository

        memberships = await MembershipRepository(self._db).get_by_user(user_id)
        if not memberships:
            raise UnauthorizedError(NO_ORG_FOR_USER, code=ErrorCode.NO_ORG_FOR_USER)
        # For users with a single org (common case), auto-select it.
        # Multi-org selection UI can be added in a future phase.
        m = memberships[0]
        return m.organization_id, m.role

    async def _issue_token_pair(
        self,
        user_id: str,
        *,
        org_id: str | None,
        org_role: str | None,
        sys_admin: bool,
    ) -> _TokenPair:
        access_token = create_access_token(
            user_id, org_id=org_id, org_role=org_role, sys_admin=sys_admin
        )
        raw_refresh = generate_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self._tokens.create(
            user_id=user_id,
            token_hash=hash_refresh_token(raw_refresh),
            expires_at=expires_at,
        )
        await self._db.commit()
        return _TokenPair(access_token=access_token, raw_refresh=raw_refresh)
