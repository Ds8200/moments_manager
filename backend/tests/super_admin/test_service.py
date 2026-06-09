from unittest.mock import MagicMock, patch

import pytest

from src.core.exceptions import ConflictError, NotFoundError
from src.super_admin.schemas import OrgCreateAdminSchema, OrgUpdateAdminSchema
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


async def test_update_org_basic_name(db_session, organization) -> None:
    svc = SuperAdminService(db_session)
    result = await svc.update_org_basic(organization.id, OrgUpdateAdminSchema(name="New Name"))
    assert result.name == "New Name"
    assert result.owner_email != ""


async def test_update_org_basic_slug(db_session, organization) -> None:
    svc = SuperAdminService(db_session)
    result = await svc.update_org_basic(organization.id, OrgUpdateAdminSchema(slug="new-slug-xyz"))
    assert result.slug == "new-slug-xyz"


async def test_update_org_basic_slug_conflict(db_session, organization) -> None:
    svc = SuperAdminService(db_session)
    # Attempting to update to the same existing slug of another org raises ConflictError.
    # Create a second org first.
    second_org_data = OrgCreateAdminSchema(
        business_name="Second Org",
        slug="second-org-slug",
        owner_email="second@example.com",
        owner_full_name="Second Owner",
        owner_password="password123",
    )
    bg = MagicMock()
    sys_s = MagicMock()
    with patch("src.super_admin.service.platform_smtp_kwargs", return_value=None):
        await svc.create_org(second_org_data, bg, sys_s)
    with pytest.raises(ConflictError):
        await svc.update_org_basic(organization.id, OrgUpdateAdminSchema(slug="second-org-slug"))


async def test_update_org_basic_not_found(db_session) -> None:
    svc = SuperAdminService(db_session)
    with pytest.raises(NotFoundError):
        await svc.update_org_basic(
            "00000000-0000-0000-0000-000000000000", OrgUpdateAdminSchema(name="X")
        )


async def test_create_org_auto_generates_slug_for_english_name(db_session) -> None:
    svc = SuperAdminService(db_session)
    data = OrgCreateAdminSchema(
        business_name="Acme Corp",
        owner_email="acme@example.com",
        owner_full_name="Acme Owner",
        owner_password="password123",
    )
    with patch("src.super_admin.service.platform_smtp_kwargs", return_value=None):
        result = await svc.create_org(data, MagicMock(), MagicMock())
    assert result.slug == "acme-corp"


async def test_create_org_auto_generates_slug_for_hebrew_name(db_session) -> None:
    svc = SuperAdminService(db_session)
    data = OrgCreateAdminSchema(
        business_name="דפוס ישראל",
        owner_email="hebrew-org@example.com",
        owner_full_name="ישראל כהן",
        owner_password="password123",
    )
    with patch("src.super_admin.service.platform_smtp_kwargs", return_value=None):
        result = await svc.create_org(data, MagicMock(), MagicMock())
    # Hebrew chars are stripped → slug falls back to "org-{hex}"
    assert result.slug.startswith("org-")


async def test_create_org_response_includes_owner_email(db_session) -> None:
    svc = SuperAdminService(db_session)
    data = OrgCreateAdminSchema(
        business_name="Email Check Org",
        owner_email="emailcheck@example.com",
        owner_full_name="Email Owner",
        owner_password="password123",
    )
    with patch("src.super_admin.service.platform_smtp_kwargs", return_value=None):
        result = await svc.create_org(data, MagicMock(), MagicMock())
    assert result.owner_email == "emailcheck@example.com"


async def test_create_org_conflict_when_owner_email_belongs_to_soft_deleted_user(
    db_session, organization, test_user
) -> None:
    # users_email_key is a DB-wide unique constraint that still applies to
    # soft-deleted rows, so reusing a deleted owner's email must surface as a
    # 409 conflict rather than an unhandled IntegrityError.
    svc = SuperAdminService(db_session)
    owner_email = test_user.email
    await svc.delete_org(organization.id)

    data = OrgCreateAdminSchema(
        business_name="Reused Email Org",
        owner_email=owner_email,
        owner_full_name="New Owner",
        owner_password="password123",
    )
    with patch("src.super_admin.service.platform_smtp_kwargs", return_value=None):
        with pytest.raises(ConflictError):
            await svc.create_org(data, MagicMock(), MagicMock())


async def test_create_org_sends_welcome_email_when_smtp_configured(db_session) -> None:
    svc = SuperAdminService(db_session)
    data = OrgCreateAdminSchema(
        business_name="Email Org",
        owner_email="welcome-email@example.com",
        owner_full_name="Welcome Owner",
        owner_password="securepass456",
    )
    background_tasks = MagicMock()
    background_tasks.add_task = MagicMock()
    smtp_kwargs = {
        "host": "smtp.example.com",
        "port": 587,
        "username": "user",
        "password": "pass",
        "from_email": "no-reply@example.com",
        "from_name": "Nihulo",
    }
    with patch("src.super_admin.service.platform_smtp_kwargs", return_value=smtp_kwargs):
        await svc.create_org(data, background_tasks, MagicMock())
    background_tasks.add_task.assert_called_once()


async def test_create_org_skips_welcome_email_when_no_smtp(db_session) -> None:
    svc = SuperAdminService(db_session)
    data = OrgCreateAdminSchema(
        business_name="No SMTP Org",
        owner_email="no-smtp@example.com",
        owner_full_name="No SMTP Owner",
        owner_password="securepass789",
    )
    background_tasks = MagicMock()
    background_tasks.add_task = MagicMock()
    with patch("src.super_admin.service.platform_smtp_kwargs", return_value=None):
        await svc.create_org(data, background_tasks, MagicMock())
    background_tasks.add_task.assert_not_called()
