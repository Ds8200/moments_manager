from unittest.mock import AsyncMock, MagicMock

import pytest

from src.auth.service import AuthService
from src.core.exceptions import UnauthorizedError
from src.core.security import hash_password

pytestmark = pytest.mark.asyncio


async def test_login_with_unknown_email_raises() -> None:
    db = AsyncMock()
    service = AuthService(db)
    service._users = AsyncMock()
    service._users.get_by_email.return_value = None

    with pytest.raises(UnauthorizedError):
        await service.login("nope@example.com", "pw")


async def test_login_with_wrong_password_raises() -> None:
    db = AsyncMock()
    service = AuthService(db)
    user = MagicMock()
    user.hashed_password = hash_password("correct")
    service._users = AsyncMock()
    service._users.get_by_email.return_value = user

    with pytest.raises(UnauthorizedError):
        await service.login("a@b.com", "wrong")


async def test_refresh_with_invalid_token_raises() -> None:
    db = AsyncMock()
    service = AuthService(db)
    service._tokens = AsyncMock()
    service._tokens.get_valid_by_hash.return_value = None

    with pytest.raises(UnauthorizedError):
        await service.refresh("invalid-token")
