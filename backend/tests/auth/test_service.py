from unittest.mock import AsyncMock, MagicMock

import pytest

from src.auth.service import AuthService
from src.core.exceptions import UnauthorizedError
from src.core.security import (
    create_access_token,
    create_magic_login_token,
    hash_password,
)

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


async def test_magic_login_with_garbage_token_raises() -> None:
    db = AsyncMock()
    service = AuthService(db)

    with pytest.raises(UnauthorizedError):
        await service.magic_login("not-a-jwt")


async def test_magic_login_rejects_a_regular_access_token() -> None:
    db = AsyncMock()
    service = AuthService(db)
    # A normal access token has no magic_login purpose claim.
    access = create_access_token("user-1", org_id="org-x", org_role="member")

    with pytest.raises(UnauthorizedError):
        await service.magic_login(access)


async def test_magic_login_with_valid_token_issues_token_pair() -> None:
    db = AsyncMock()
    service = AuthService(db)
    user = MagicMock()
    user.id = "user-1"
    user.role = "user"
    service._users = AsyncMock()
    service._users.get_by_id.return_value = user
    service._tokens = AsyncMock()
    # _resolve_org does a real DB call — mock it at the service level
    service._resolve_org = AsyncMock(return_value=("org-test", "owner"))

    token = create_magic_login_token("user-1")
    result = await service.magic_login(token)

    assert result.access_token
    assert result.refresh_token
    service._users.get_by_id.assert_called_once_with("user-1")


async def test_magic_login_unknown_user_raises() -> None:
    db = AsyncMock()
    service = AuthService(db)
    service._users = AsyncMock()
    service._users.get_by_id.return_value = None

    token = create_magic_login_token("ghost")
    with pytest.raises(UnauthorizedError):
        await service.magic_login(token)
