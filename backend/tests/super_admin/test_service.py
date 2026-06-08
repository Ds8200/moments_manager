from unittest.mock import MagicMock, patch

import pytest

from src.core.exceptions import NotFoundError
from src.super_admin.service import SuperAdminService

pytestmark = pytest.mark.asyncio


async def test_delete_org_soft_deletes(db_session, organization) -> None:
    svc = SuperAdminService(db_session)
    await svc.delete_org(organization.id)
    # After deletion, get_by_id returns None because is_deleted filters it out
    from src.organizations.repository import OrgRepository

    result = await OrgRepository(db_session).get_by_id(organization.id)
    assert result is None


async def test_delete_org_not_found(db_session) -> None:
    svc = SuperAdminService(db_session)
    with pytest.raises(NotFoundError):
        await svc.delete_org("00000000-0000-0000-0000-000000000000")


async def test_reset_owner_password_updates_hash(db_session, organization, test_user) -> None:
    svc = SuperAdminService(db_session)
    original_hash = test_user.hashed_password

    background_tasks = MagicMock()
    background_tasks.add_task = MagicMock()
    sys_settings = MagicMock()
    sys_settings.platform_smtp_host = None  # no SMTP → email skipped

    with patch("src.super_admin.service.platform_smtp_kwargs", return_value=None):
        returned_email = await svc.reset_owner_password(
            organization.id, background_tasks, sys_settings
        )

    assert returned_email == test_user.email
    await db_session.refresh(test_user)
    assert test_user.hashed_password != original_hash
    background_tasks.add_task.assert_not_called()


async def test_reset_owner_password_sends_email_when_smtp_configured(
    db_session, organization, test_user
) -> None:
    svc = SuperAdminService(db_session)

    background_tasks = MagicMock()
    background_tasks.add_task = MagicMock()
    sys_settings = MagicMock()

    smtp_kwargs = {
        "host": "smtp.example.com",
        "port": 587,
        "username": "user",
        "password": "pass",
        "from_email": "no-reply@example.com",
        "from_name": "Nihulo",
    }

    with patch("src.super_admin.service.platform_smtp_kwargs", return_value=smtp_kwargs):
        await svc.reset_owner_password(organization.id, background_tasks, sys_settings)

    background_tasks.add_task.assert_called_once()


async def test_reset_owner_password_org_not_found(db_session) -> None:
    svc = SuperAdminService(db_session)
    with pytest.raises(NotFoundError):
        await svc.reset_owner_password(
            "00000000-0000-0000-0000-000000000000", MagicMock(), MagicMock()
        )
