import logging
import re
import secrets

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.email import platform_smtp_kwargs, send_html_email_via_smtp
from src.core.exceptions import ConflictError, NotFoundError
from src.core.security import create_magic_login_token, hash_password
from src.organizations.enums import OrgPlan, OrgRole
from src.organizations.models import Organization
from src.organizations.repository import MembershipRepository, OrgRepository
from src.super_admin.schemas import (
    OrgAdminResponseSchema,
    OrgCreateAdminSchema,
    OrgUpdateAdminSchema,
)
from src.users.email_templates import build_password_reset_admin_email, build_welcome_email
from src.users.enums import UserRole
from src.users.models import User
from src.users.repository import UserRepository

logger = logging.getLogger(__name__)

_PLAN_MAX_USERS = {
    OrgPlan.trial: 2,
    OrgPlan.basic: 5,
    OrgPlan.professional: 20,
    OrgPlan.enterprise: 9999,
}


class SuperAdminService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._org_repo = OrgRepository(db)
        self._member_repo = MembershipRepository(db)
        self._user_repo = UserRepository(db)

    async def _to_response(self, org: Organization) -> OrgAdminResponseSchema:
        member_count = await self._member_repo.count_active(org.id)
        owner = await self._user_repo.get_by_id(org.owner_id)
        owner_email = owner.email if owner is not None else ""
        return OrgAdminResponseSchema(
            id=org.id,
            org_number=org.org_number,
            slug=org.slug,
            name=org.name,
            logo_path=org.logo_path,
            plan=org.plan,
            trial_ends_at=org.trial_ends_at,
            is_active=org.is_active,
            max_users=org.max_users,
            owner_id=org.owner_id,
            owner_email=owner_email,
            member_count=member_count,
            created_at=org.created_at,
            updated_at=org.updated_at,
        )

    async def _generate_unique_slug(self, name: str) -> str:
        slug = name.lower()
        slug = re.sub(r"[^a-z0-9\s-]", "", slug)  # strip non-ASCII (incl. Hebrew)
        slug = re.sub(r"[\s]+", "-", slug)
        slug = re.sub(r"-+", "-", slug)
        slug = slug.strip("-")
        # Hebrew-only names produce an empty slug — use random fallback
        slug = slug or f"org-{secrets.token_hex(3)}"
        if not await self._org_repo.slug_exists(slug):
            return slug
        for suffix in range(2, 100):
            candidate = f"{slug}-{suffix}"
            if not await self._org_repo.slug_exists(candidate):
                return candidate
        return f"{slug}-{secrets.token_hex(3)}"

    async def list_orgs(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        plan: str | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[OrgAdminResponseSchema], int]:
        offset = (page - 1) * page_size
        orgs, total = await self._org_repo.list_all(
            page_size, offset, search=search, plan=plan, is_active=is_active
        )
        items = [await self._to_response(o) for o in orgs]
        return items, total

    async def get_org(self, org_id: str) -> OrgAdminResponseSchema:
        org = await self._org_repo.get_by_id(org_id)
        if org is None:
            raise NotFoundError("Organization", org_id)
        return await self._to_response(org)

    async def toggle_status(self, org_id: str, is_active: bool) -> OrgAdminResponseSchema:
        org = await self._org_repo.get_by_id(org_id)
        if org is None:
            raise NotFoundError("Organization", org_id)
        org = await self._org_repo.update(org, is_active=is_active)
        logger.info("Org %s status set to is_active=%s", org_id, is_active)
        return await self._to_response(org)

    async def update_plan(
        self,
        org_id: str,
        plan: OrgPlan,
        max_users: int | None,
        trial_ends_at,
    ) -> OrgAdminResponseSchema:
        org = await self._org_repo.get_by_id(org_id)
        if org is None:
            raise NotFoundError("Organization", org_id)
        resolved_max = max_users if max_users is not None else _PLAN_MAX_USERS[plan]
        fields = {"plan": plan.value, "max_users": resolved_max}
        if trial_ends_at is not None:
            fields["trial_ends_at"] = trial_ends_at
        org = await self._org_repo.update(org, **fields)
        logger.info("Org %s plan updated to %s", org_id, plan.value)
        return await self._to_response(org)

    async def delete_org(self, org_id: str) -> None:
        org = await self._org_repo.get_by_id(org_id)
        if org is None:
            raise NotFoundError("Organization", org_id)
        await self._org_repo.hard_delete(org_id)
        await self._db.commit()
        logger.info("Super-admin hard-deleted org %s", org_id)

    async def reset_owner_password(
        self,
        org_id: str,
        background_tasks: BackgroundTasks,
        sys_settings,
    ) -> str:
        org = await self._org_repo.get_by_id(org_id)
        if org is None:
            raise NotFoundError("Organization", org_id)
        owner = await self._user_repo.get_by_id(org.owner_id)
        if owner is None:
            raise NotFoundError("User", org.owner_id)

        temp_password = secrets.token_urlsafe(12)
        owner.hashed_password = hash_password(temp_password)
        await self._db.flush()
        await self._db.commit()
        await self._db.refresh(owner)

        magic_token = create_magic_login_token(owner.id)
        smtp_kw = platform_smtp_kwargs(sys_settings)
        if smtp_kw:
            subject, html_body = build_password_reset_admin_email(
                recipient_email=owner.email,
                temp_password=temp_password,
                magic_token=magic_token,
                org_name=org.name,
                platform_name="Nihulo",
            )
            background_tasks.add_task(
                send_html_email_via_smtp,
                to_email=owner.email,
                subject=subject,
                html_body=html_body,
                **smtp_kw,
            )
        logger.info("Super-admin reset owner password for org %s (owner=%s)", org_id, owner.email)
        return owner.email

    async def update_org_basic(
        self, org_id: str, data: OrgUpdateAdminSchema
    ) -> OrgAdminResponseSchema:
        org = await self._org_repo.get_by_id(org_id)
        if org is None:
            raise NotFoundError("Organization", org_id)
        fields: dict = {}
        if data.name is not None:
            fields["name"] = data.name
        if data.slug is not None and data.slug != org.slug:
            if await self._org_repo.slug_exists(data.slug):
                raise ConflictError("slug")
            fields["slug"] = data.slug
        if fields:
            org = await self._org_repo.update(org, **fields)
            await self._db.commit()
        return await self._to_response(org)

    async def create_org(
        self,
        data: OrgCreateAdminSchema,
        background_tasks: BackgroundTasks,
        sys_settings,
    ) -> OrgAdminResponseSchema:
        slug = data.slug or await self._generate_unique_slug(data.business_name)
        if data.slug and await self._org_repo.slug_exists(data.slug):
            raise ConflictError("slug")

        plan = data.plan
        max_users = _PLAN_MAX_USERS[plan]
        org_number = await self._org_repo.get_next_org_number()

        if data.existing_user_id:
            owner = await self._user_repo.get_by_id(data.existing_user_id)
            if owner is None:
                raise NotFoundError("User", data.existing_user_id)
            plain_password = None
        else:
            if await self._user_repo.email_exists(data.owner_email):
                raise ConflictError("email")
            plain_password = data.owner_password
            hashed = hash_password(plain_password)
            owner = User(
                email=data.owner_email,
                full_name=data.owner_full_name,
                hashed_password=hashed,
                role=UserRole.user.value,
                is_active=True,
                phone=data.owner_phone,
            )
            self._db.add(owner)
            await self._db.flush()

        org = await self._org_repo.create(
            slug=slug,
            name=data.business_name,
            owner_id=owner.id,
            plan=plan.value,
            max_users=max_users,
            org_number=org_number,
        )
        await self._member_repo.create(
            org_id=org.id,
            user_id=owner.id,
            role=OrgRole.owner.value,
        )
        await self._db.commit()

        if plain_password:
            smtp_kw = platform_smtp_kwargs(sys_settings)
            if smtp_kw:
                magic_token = create_magic_login_token(owner.id)
                subject, html_body = build_welcome_email(
                    recipient_email=owner.email,
                    temp_password=plain_password,
                    magic_token=magic_token,
                    org_name=data.business_name,
                    logo_path=None,
                    brand_colors=None,
                )
                background_tasks.add_task(
                    send_html_email_via_smtp,
                    to_email=owner.email,
                    subject=subject,
                    html_body=html_body,
                    **smtp_kw,
                )

        logger.info("Super-admin created org %s (slug=%s, owner=%s)", org.id, org.slug, owner.id)
        return await self._to_response(org)
