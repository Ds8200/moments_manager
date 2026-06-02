import logging
from typing import AsyncGenerator

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import (
    FORBIDDEN,
    TOKEN_INVALID,
    TOKEN_PAYLOAD_INVALID,
    USER_NOT_FOUND,
)
from src.core.exceptions import ForbiddenError
from src.core.security import MAGIC_LOGIN_PURPOSE, decode_access_token
from src.database import AsyncSessionLocal

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from src.users.repository import UserRepository

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail=TOKEN_INVALID)

    # Magic-login tokens are single-purpose: they may only be exchanged at the
    # magic-login endpoint, never used directly as an API bearer token.
    if payload.get("purpose") == MAGIC_LOGIN_PURPOSE:
        raise HTTPException(status_code=401, detail=TOKEN_INVALID)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail=TOKEN_PAYLOAD_INVALID)

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if user is None or user.is_deleted:
        raise HTTPException(status_code=401, detail=USER_NOT_FOUND)

    return user


async def require_admin(current_user=Depends(get_current_user)):
    from src.users.enums import UserRole

    if current_user.role != UserRole.admin.value:
        raise ForbiddenError(FORBIDDEN)
    return current_user
