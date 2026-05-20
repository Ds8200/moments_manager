import logging
from typing import AsyncGenerator
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import AsyncSessionLocal
from src.core.security import decode_access_token
from src.core.constants.http_messages import TOKEN_INVALID, TOKEN_PAYLOAD_INVALID, USER_NOT_FOUND

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from src.auth.repository import RefreshTokenRepository
    from src.users.repository import UserRepository

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail=TOKEN_INVALID)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail=TOKEN_PAYLOAD_INVALID)

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if user is None or user.is_deleted:
        raise HTTPException(status_code=401, detail=USER_NOT_FOUND)

    return user
