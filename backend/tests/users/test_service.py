import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from src.core.schemas import PaginationParams
from src.users.enums import UserRole
from src.users.service import UserService

pytestmark = pytest.mark.asyncio


def _make_user(role: str = UserRole.user.value) -> MagicMock:
    user = MagicMock()
    user.id = str(uuid.uuid4())
    user.email = "user@example.com"
    user.full_name = "Test User"
    user.role = role
    user.is_active = True
    user.is_deleted = False
    return user


def _make_service() -> tuple[UserService, AsyncMock]:
    db = AsyncMock()
    svc = UserService(db)
    svc._repo = AsyncMock()
    return svc, db


async def test_create_user_duplicate_email_raises() -> None:
    svc, _ = _make_service()
    svc._repo.get_by_email.return_value = _make_user()

    with pytest.raises(ConflictError):
        await svc.create_user(
            MagicMock(email="dup@example.com", full_name="Dup"),
            MagicMock(),
            "עסק לדוגמה",
        )


async def test_create_user_success_calls_repo_and_commit() -> None:
    svc, db = _make_service()
    svc._repo.get_by_email.return_value = None
    new_user = _make_user()
    svc._repo.create.return_value = new_user
    db.refresh = AsyncMock()

    background_tasks = MagicMock()

    with patch("src.users.service.send_html_email"):
        result = await svc.create_user(
            MagicMock(email="new@example.com", full_name="New", role=UserRole.user.value),
            background_tasks,
            "עסק לדוגמה",
        )

    svc._repo.create.assert_called_once()
    db.commit.assert_called_once()
    background_tasks.add_task.assert_called_once()
    assert result is not None


async def test_delete_user_self_raises_forbidden() -> None:
    svc, _ = _make_service()
    admin_id = str(uuid.uuid4())

    with pytest.raises(ForbiddenError):
        await svc.delete_user(admin_id, admin_id)


async def test_delete_user_not_found_raises() -> None:
    svc, _ = _make_service()
    svc._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await svc.delete_user(str(uuid.uuid4()), str(uuid.uuid4()))


async def test_delete_user_success_calls_soft_delete_and_commit() -> None:
    svc, db = _make_service()
    target = _make_user()
    svc._repo.get_by_id.return_value = target

    admin_id = str(uuid.uuid4())
    await svc.delete_user(target.id, admin_id)

    svc._repo.soft_delete.assert_called_once_with(target)
    db.commit.assert_called_once()


async def test_list_users_returns_paginated_response() -> None:
    svc, _ = _make_service()
    users = [_make_user() for _ in range(3)]
    svc._repo.list_all.return_value = (users, 3)

    with patch("src.users.service.UserResponseSchema.model_validate", side_effect=lambda u: u):
        result = await svc.list_users(PaginationParams(page=1, page_size=20))

    assert result.total == 3
    assert result.page == 1
    assert result.page_size == 20
    assert len(result.items) == 3
