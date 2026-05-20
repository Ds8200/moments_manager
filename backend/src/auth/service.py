import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.repository import RefreshTokenRepository
from src.auth.schemas import TokenResponseSchema
from src.core.exceptions import UnauthorizedError
from src.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    verify_password,
)
from src.config import settings
from src.users.repository import UserRepository

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._users = UserRepository(db)
        self._tokens = RefreshTokenRepository(db)

    async def login(self, email: str, password: str) -> TokenResponseSchema:
        user = await self._users.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        return await self._issue_token_pair(user.id)

    async def refresh(self, refresh_token_str: str) -> TokenResponseSchema:
        token_hash = hash_refresh_token(refresh_token_str)
        token = await self._tokens.get_valid_by_hash(token_hash)
        if not token:
            raise UnauthorizedError("Invalid or expired refresh token")
        await self._tokens.revoke(token_hash)
        await self._db.flush()
        return await self._issue_token_pair(token.user_id)

    async def logout(self, refresh_token_str: str) -> None:
        token_hash = hash_refresh_token(refresh_token_str)
        await self._tokens.revoke(token_hash)

    async def _issue_token_pair(self, user_id: str) -> TokenResponseSchema:
        access_token = create_access_token(user_id)
        raw_refresh = generate_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self._tokens.create(
            user_id=user_id,
            token_hash=hash_refresh_token(raw_refresh),
            expires_at=expires_at,
        )
        await self._db.commit()
        return TokenResponseSchema(access_token=access_token, refresh_token=raw_refresh)
