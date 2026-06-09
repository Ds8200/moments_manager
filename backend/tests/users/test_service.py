import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import BackgroundTasks

from src.core.exceptions import ConflictError, ForbiddenError, NotFoundError, UnauthorizedError
from src.core.schemas import PaginationParams
from src.users.enums import UserRole
from src.users.schemas import UserUpdateMeSchema
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


def _make_org(*, smtp_configured: bool = True) -> MagicMock:
    org = MagicMock()
    org.name = "עסק לדוגמה"
    org.logo_path = None
    org.brand_colors = None
    org.smtp_host = "smtp.example.com" if smtp_configured else None
    org.smtp_port = 587
    org.smtp_username = "user@example.com"
    org.smtp_password = "secret" if smtp_configured else None
    org.smtp_from_email = "user@example.com"
    org.smtp_from_name = "עסק לדוגמה"
    return org


def _make_sys_settings(*, smtp_configured: bool = True) -> MagicMock:
    s = MagicMock()
    s.platform_smtp_host = "smtp.example.com" if smtp_configured else None
    s.platform_smtp_password = "secret" if smtp_configured else None
    s.platform_smtp_port = 587
    s.platform_smtp_username = "platform@example.com"
    s.platform_smtp_from_email = "platform@example.com"
    s.platform_smtp_from_name = "Nihulo"
    return s


async def test_create_user_org_email_not_configured_raises() -> None:
    svc, _ = _make_service()

    with pytest.raises(ConflictError):
        await svc.create_user(
            MagicMock(email="new@example.com", full_name="New"),
            MagicMock(),
            _make_org(smtp_configured=False),
        )

    svc._repo.email_exists.assert_not_called()


async def test_create_user_duplicate_email_raises() -> None:
    svc, _ = _make_service()
    svc._repo.email_exists.return_value = True

    with pytest.raises(ConflictError):
        await svc.create_user(
            MagicMock(email="dup@example.com", full_name="Dup"),
            MagicMock(),
            _make_org(),
        )


async def test_create_user_success_calls_repo_and_commit() -> None:
    svc, db = _make_service()
    svc._repo.email_exists.return_value = False
    new_user = _make_user()
    svc._repo.create.return_value = new_user
    db.refresh = AsyncMock()

    background_tasks = MagicMock()

    with patch("src.users.service.send_html_email_via_smtp"):
        result = await svc.create_user(
            MagicMock(email="new@example.com", full_name="New", role=UserRole.user.value),
            background_tasks,
            _make_org(),
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


async def test_update_me_raises_on_wrong_current_password() -> None:
    svc, db = _make_service()
    user = _make_user()
    user.hashed_password = "hashed_old"
    svc._repo.update_me = AsyncMock()

    with patch("src.users.service.verify_password", return_value=False):
        with pytest.raises(UnauthorizedError):
            await svc.update_me(
                user,
                UserUpdateMeSchema(current_password="wrong", new_password="newpass123"),
                BackgroundTasks(),
                _make_sys_settings(),
            )


async def test_update_me_dispatches_email_on_password_change() -> None:
    svc, db = _make_service()
    user = _make_user()
    user.hashed_password = "hashed_old"
    updated_user = _make_user()
    svc._repo.update_me = AsyncMock(return_value=updated_user)
    db.refresh = AsyncMock()

    bg = BackgroundTasks()
    with patch("src.users.service.verify_password", return_value=True), \
         patch("src.users.service.hash_password", return_value="hashed_new"), \
         patch("src.users.service.send_html_email_via_smtp") as mock_send:
        await svc.update_me(
            user,
            UserUpdateMeSchema(current_password="old", new_password="newpass123"),
            bg,
            _make_sys_settings(smtp_configured=True),
        )

    assert len(bg.tasks) == 1
    assert bg.tasks[0].func is mock_send


async def test_update_me_skips_email_when_only_name_changes() -> None:
    svc, db = _make_service()
    user = _make_user()
    updated_user = _make_user()
    svc._repo.update_me = AsyncMock(return_value=updated_user)
    db.refresh = AsyncMock()

    bg = BackgroundTasks()
    with patch("src.users.service.send_html_email_via_smtp"):
        await svc.update_me(
            user,
            UserUpdateMeSchema(full_name="New Name"),
            bg,
            _make_sys_settings(smtp_configured=True),
        )

    assert len(bg.tasks) == 0


async def test_update_me_skips_email_when_smtp_not_configured() -> None:
    svc, db = _make_service()
    user = _make_user()
    user.hashed_password = "hashed_old"
    updated_user = _make_user()
    svc._repo.update_me = AsyncMock(return_value=updated_user)
    db.refresh = AsyncMock()

    bg = BackgroundTasks()
    with patch("src.users.service.verify_password", return_value=True), \
         patch("src.users.service.hash_password", return_value="hashed_new"):
        await svc.update_me(
            user,
            UserUpdateMeSchema(current_password="old", new_password="newpass123"),
            bg,
            _make_sys_settings(smtp_configured=False),
        )

    assert len(bg.tasks) == 0
