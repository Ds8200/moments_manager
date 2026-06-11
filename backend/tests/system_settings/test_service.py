"""Unit tests for SystemSettingsService — no DB required (mock repository)."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import BackgroundTasks

from src.core.exceptions import UnauthorizedError
from src.system_settings.schemas import (
    SysAdminPasswordChangeSchema,
    SystemOpenAIUpdateSchema,
    SystemSmtpUpdateSchema,
)
from src.system_settings.service import SystemSettingsService


def _make_settings_obj(**kwargs):
    s = MagicMock()
    s.platform_smtp_host = kwargs.get("platform_smtp_host")
    s.platform_smtp_password = kwargs.get("platform_smtp_password")
    s.platform_smtp_port = kwargs.get("platform_smtp_port")
    s.platform_smtp_username = kwargs.get("platform_smtp_username")
    s.platform_smtp_from_email = kwargs.get("platform_smtp_from_email")
    s.platform_smtp_from_name = kwargs.get("platform_smtp_from_name")
    s.platform_openai_api_key = kwargs.get("platform_openai_api_key")
    from datetime import datetime
    s.updated_at = datetime(2026, 1, 1)
    return s


@pytest.fixture
def db():
    session = AsyncMock()
    session.commit = AsyncMock()
    return session


@pytest.fixture
def repo(db):
    with patch("src.system_settings.service.SystemSettingsRepository") as MockRepo:
        instance = MockRepo.return_value
        instance.get = AsyncMock(return_value=_make_settings_obj())
        instance.update = AsyncMock(side_effect=lambda s, fields: s)
        yield instance


@pytest.fixture
def service(db, repo):
    return SystemSettingsService(db)


@pytest.mark.asyncio
async def test_get_settings_returns_response_schema(service, repo):
    repo.get.return_value = _make_settings_obj()
    result = await service.get_settings()
    assert result.has_smtp_config is False
    assert result.has_openai_key is False


@pytest.mark.asyncio
async def test_get_settings_has_smtp_config_true_when_host_and_password(service, repo):
    repo.get.return_value = _make_settings_obj(
        platform_smtp_host="smtp.example.com",
        platform_smtp_password="secret",
    )
    result = await service.get_settings()
    assert result.has_smtp_config is True


@pytest.mark.asyncio
async def test_update_smtp_calls_repo_update(service, repo):
    settings_obj = _make_settings_obj(
        platform_smtp_host="smtp.example.com", platform_smtp_password="p"
    )
    repo.get.return_value = settings_obj
    repo.update.return_value = settings_obj
    data = SystemSmtpUpdateSchema(platform_smtp_host="smtp.gmail.com", platform_smtp_port=587)
    await service.update_smtp(data)
    repo.update.assert_called_once()


@pytest.mark.asyncio
async def test_update_openai_calls_repo_update(service, repo):
    settings_obj = _make_settings_obj(platform_openai_api_key="sk-1234")
    repo.get.return_value = settings_obj
    repo.update.return_value = settings_obj
    data = SystemOpenAIUpdateSchema(platform_openai_api_key="sk-new")
    await service.update_openai(data)
    repo.update.assert_called_once()


@pytest.mark.asyncio
async def test_openai_key_preview_shows_last_4_chars(service, repo):
    repo.get.return_value = _make_settings_obj(platform_openai_api_key="sk-abcd1234xxxx")
    result = await service.get_settings()
    assert result.has_openai_key is True
    assert result.openai_key_preview == "xxxx"


@pytest.mark.asyncio
async def test_change_password_raises_on_wrong_current(service, repo, db):
    admin_user = MagicMock()
    admin_user.hashed_password = "hashed"

    with patch("src.system_settings.service.verify_password", return_value=False):
        data = SysAdminPasswordChangeSchema(current_password="wrong", new_password="newpass12")
        with pytest.raises(UnauthorizedError):
            await service.change_password(admin_user, data, BackgroundTasks())


@pytest.mark.asyncio
async def test_change_password_succeeds_without_smtp(service, repo, db):
    admin_user = MagicMock()
    admin_user.hashed_password = "hashed"
    admin_user.email = "admin@example.com"
    repo.get.return_value = _make_settings_obj()  # no smtp

    with patch("src.system_settings.service.verify_password", return_value=True), \
         patch("src.system_settings.service.hash_password", return_value="newhash"), \
         patch("src.system_settings.service.UserRepository") as MockUserRepo:
        mock_user_repo = MockUserRepo.return_value
        mock_user_repo.update_me = AsyncMock()
        data = SysAdminPasswordChangeSchema(current_password="old", new_password="newpass12")
        result = await service.change_password(admin_user, data, BackgroundTasks())

    assert "changed" in result.message.lower() or result.message


@pytest.mark.asyncio
async def test_change_password_dispatches_email_when_smtp_configured(service, repo, db):
    admin_user = MagicMock()
    admin_user.hashed_password = "hashed"
    admin_user.email = "admin@example.com"
    repo.get.return_value = _make_settings_obj(
        platform_smtp_host="smtp.example.com",
        platform_smtp_password="secret",
        platform_smtp_username="platform@example.com",
        platform_smtp_from_email="platform@example.com",
        platform_smtp_from_name="Nihulo",
        platform_smtp_port=587,
    )

    bt = BackgroundTasks()
    with patch("src.system_settings.service.verify_password", return_value=True), \
         patch("src.system_settings.service.hash_password", return_value="newhash"), \
         patch("src.system_settings.service.UserRepository") as MockUserRepo, \
         patch("src.system_settings.service.send_html_email_via_smtp"):
        mock_user_repo = MockUserRepo.return_value
        mock_user_repo.update_me = AsyncMock()
        data = SysAdminPasswordChangeSchema(current_password="old", new_password="newpass12")
        await service.change_password(admin_user, data, bt)

    # Background task was registered (not called inline)
    assert len(bt.tasks) == 1
