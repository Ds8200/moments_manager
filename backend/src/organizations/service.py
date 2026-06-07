import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from src.organizations.branding_service import extract_brand_colors, upload_logo
from src.organizations.constants import (
    INVITE_EMAIL_DISPATCHED,
    LOGO_EXTRACTED,
    LOGO_UPLOAD_FAILED,
    ORG_CANNOT_REMOVE_OWNER,
    ORG_INVITE_NOT_FOUND,
    ORG_LOGO_UPDATED,
    ORG_MAX_USERS_REACHED,
    ORG_MEMBER_EXISTS,
    RESOURCE_MEMBERSHIP,
    RESOURCE_ORG,
)
from src.organizations.enums import OrgPlan
from src.organizations.repository import InviteRepository, MembershipRepository, OrgRepository
from src.organizations.schemas import (
    InviteCreateSchema,
    InviteResponseSchema,
    MemberResponseSchema,
    OrgBrandingResponseSchema,
    OrgResponseSchema,
    OrgUpdateSchema,
    PublicBrandingSchema,
)

logger = logging.getLogger(__name__)

_INVITE_TTL_HOURS = 72


def _preview_key(key: str) -> str:
    """Return first-4 + '...' + last-4 of an API key for safe display."""
    if len(key) <= 8:
        return "****"
    return f"{key[:4]}...{key[-4:]}"


def _org_to_schema(org) -> OrgResponseSchema:
    schema = OrgResponseSchema.model_validate(org)
    return schema.model_copy(update={
        "has_openai_key": bool(org.openai_api_key),
        "openai_key_preview": _preview_key(org.openai_api_key) if org.openai_api_key else None,
        "has_smtp_config": bool(org.smtp_host and org.smtp_password),
    })
_PLAN_MAX_USERS = {
    OrgPlan.trial.value: 2,
    OrgPlan.basic.value: 5,
    OrgPlan.professional.value: 20,
    OrgPlan.enterprise.value: 9999,
}


class OrgService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._orgs = OrgRepository(db)
        self._members = MembershipRepository(db)
        self._invites = InviteRepository(db)

    async def get_public_branding(self, slug: str) -> PublicBrandingSchema:
        org = await self._orgs.get_by_slug(slug)
        if not org or not org.is_active:
            raise NotFoundError(RESOURCE_ORG, slug)
        return PublicBrandingSchema.model_validate(org)

    async def get_current_org(self, org_id: str) -> OrgResponseSchema:
        org = await self._orgs.get_by_id(org_id)
        if not org:
            raise NotFoundError(RESOURCE_ORG, org_id)
        return _org_to_schema(org)

    async def update_org(self, org_id: str, data: OrgUpdateSchema) -> OrgResponseSchema:
        org = await self._orgs.get_by_id(org_id)
        if not org:
            raise NotFoundError(RESOURCE_ORG, org_id)
        updates = data.model_dump(exclude_none=True)
        if updates:
            org = await self._orgs.update(org, **updates)
        await self._db.commit()
        refreshed = await self._orgs.get_by_id(org_id)
        return _org_to_schema(refreshed)

    async def upload_logo_and_extract_colors(
        self, org_id: str, file: UploadFile
    ) -> OrgBrandingResponseSchema:
        org = await self._orgs.get_by_id(org_id)
        if not org:
            raise NotFoundError(RESOURCE_ORG, org_id)

        try:
            logo_path = await upload_logo(org_id, file)
            colors = extract_brand_colors(logo_path)
            logger.info(LOGO_EXTRACTED, org_id, colors.model_dump())
        except Exception as exc:
            logger.error(LOGO_UPLOAD_FAILED, org_id, exc)
            raise

        await self._orgs.update(org, logo_path=logo_path, brand_colors=colors.model_dump())
        await self._db.commit()

        return OrgBrandingResponseSchema(
            logo_path=logo_path,
            brand_colors=colors,
            message=ORG_LOGO_UPDATED,
        )

    async def list_members(self, org_id: str) -> list[MemberResponseSchema]:
        members = await self._members.list_by_org(org_id)
        return [MemberResponseSchema.model_validate(m) for m in members]

    async def invite_member(
        self,
        org_id: str,
        inviter_id: str,
        data: InviteCreateSchema,
        background_tasks: BackgroundTasks,
    ) -> InviteResponseSchema:
        org = await self._orgs.get_by_id(org_id)
        if not org:
            raise NotFoundError(RESOURCE_ORG, org_id)

        current_count = await self._members.count_active(org_id)
        if current_count >= org.max_users:
            raise ConflictError(ORG_MAX_USERS_REACHED, code=ErrorCode.CONFLICT)

        raw_token = secrets.token_urlsafe(48)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=_INVITE_TTL_HOURS)

        await self._invites.create(
            org_id=org_id,
            email=data.email,
            role=data.role.value,
            token_hash=token_hash,
            expires_at=expires_at,
            invited_by=inviter_id,
        )
        await self._db.commit()

        from src.config import settings

        invite_url = f"http://{org.slug}.{settings.APP_DOMAIN}/invite?token={raw_token}"
        background_tasks.add_task(
            _send_invite_email,
            to_email=data.email,
            org_name=org.name,
            invite_url=invite_url,
            smtp_host=org.smtp_host,
            smtp_port=org.smtp_port,
            smtp_username=org.smtp_username,
            smtp_password=org.smtp_password,
            smtp_from_email=org.smtp_from_email,
            smtp_from_name=org.smtp_from_name,
        )
        logger.info(INVITE_EMAIL_DISPATCHED, data.email, org_id)

        refreshed = await self._invites.get_valid_by_hash(token_hash)
        return InviteResponseSchema.model_validate(refreshed)

    async def accept_invite(self, token: str) -> str:
        """Accept invite by raw token. Returns org_id for the caller to use."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        invite = await self._invites.get_valid_by_hash(token_hash)
        if not invite:
            raise NotFoundError(RESOURCE_ORG, "invite")

        from src.users.repository import UserRepository

        user = await UserRepository(self._db).get_by_email(invite.email)
        if not user:
            raise ForbiddenError(ORG_INVITE_NOT_FOUND)

        existing = await self._members.get_active(user.id, invite.organization_id)
        if existing:
            raise ConflictError(ORG_MEMBER_EXISTS)

        await self._members.create(
            org_id=invite.organization_id,
            user_id=user.id,
            role=invite.role,
            invited_by=invite.invited_by,
        )
        await self._invites.mark_accepted(invite)
        await self._db.commit()
        return invite.organization_id

    async def remove_member(
        self, org_id: str, target_user_id: str, requester_id: str
    ) -> None:
        org = await self._orgs.get_by_id(org_id)
        if not org:
            raise NotFoundError(RESOURCE_ORG, org_id)
        if org.owner_id == target_user_id:
            raise ForbiddenError(ORG_CANNOT_REMOVE_OWNER)

        membership = await self._members.get_active(target_user_id, org_id)
        if not membership:
            raise NotFoundError(RESOURCE_MEMBERSHIP, target_user_id)

        await self._members.deactivate(membership)
        await self._db.commit()


async def _send_invite_email(
    to_email: str,
    org_name: str,
    invite_url: str,
    smtp_host: str | None = None,
    smtp_port: int | None = None,
    smtp_username: str | None = None,
    smtp_password: str | None = None,
    smtp_from_email: str | None = None,
    smtp_from_name: str | None = None,
) -> None:
    from src.core.email import send_html_email, send_html_email_via_smtp

    subject = f"הוזמנת להצטרף ל-{org_name}"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
      <h2>הוזמנת להצטרף ל-{org_name}</h2>
      <p>לחץ על הקישור להצטרפות:</p>
      <a href="{invite_url}" style="background:#3b5bdb;color:#fff;padding:10px 20px;
         border-radius:4px;text-decoration:none;">הצטרף עכשיו</a>
      <p style="color:#888;font-size:12px;margin-top:20px;">
        הקישור תקף ל-72 שעות.
      </p>
    </div>
    """
    if smtp_host and smtp_password:
        await send_html_email_via_smtp(
            host=smtp_host,
            port=smtp_port or 587,
            username=smtp_username or "",
            password=smtp_password,
            from_email=smtp_from_email or smtp_username or "",
            from_name=smtp_from_name or org_name,
            to_email=to_email,
            subject=subject,
            html_body=html_body,
        )
    else:
        await send_html_email(to_email, subject, html_body, from_name=smtp_from_name or org_name)
