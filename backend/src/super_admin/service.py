import logging
import secrets

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.email import platform_smtp_kwargs, send_html_email_via_smtp
from src.core.exceptions import ConflictError, NotFoundError
from src.core.security import create_magic_login_token, hash_password
from src.organizations.enums import OrgPlan, OrgRole
from src.organizations.models import Organization
from src.organizations.repository import MembershipRepository, OrgRepository
from src.super_admin.schemas import OrgAdminResponseSchema, OrgCreateAdminSchema
from src.users.email_templates import build_password_reset_admin_email
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
        return OrgAdminResponseSchema(
            id=org.id,
            slug=org.slug,
            name=org.name,
            logo_path=org.logo_path,
            plan=org.plan,
            trial_ends_at=org.trial_ends_at,
            is_active=org.is_active,
            max_users=org.max_users,
            owner_id=org.owner_id,
            member_count=member_count,
            created_at=org.created_at,
            updated_at=org.updated_at,
        )

    async def list_orgs(
        self, page: int, page_size: int
    ) -> tuple[list[OrgAdminResponseSchema], int]:
        offset = (page - 1) * page_size
        orgs, total = await self._org_repo.list_all(page_size, offset)
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
        await self._org_repo.soft_delete(org)
        await self._db.commit()
        logger.info("Super-admin soft-deleted org %s", org_id)

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

    async def create_org(self, data: OrgCreateAdminSchema) -> OrgAdminResponseSchema:
        if await self._org_repo.slug_exists(data.slug):
            raise ConflictError("slug")
        existing_user = await self._user_repo.get_by_email(data.owner_email)
        if existing_user is not None:
            raise ConflictError("email")

        hashed = hash_password(data.owner_password)

        plan = data.plan
        max_users = _PLAN_MAX_USERS[plan]
        owner = User(
            email=data.owner_email,
            full_name=data.owner_full_name,
            hashed_password=hashed,
            role=UserRole.user.value,
            is_active=True,
        )
        self._db.add(owner)
        await self._db.flush()

        org = await self._org_repo.create(
            slug=data.slug,
            name=data.business_name,
            owner_id=owner.id,
            plan=plan.value,
            max_users=max_users,
        )
        await self._member_repo.create(
            org_id=org.id,
            user_id=owner.id,
            role=OrgRole.owner.value,
        )
        await self._db.commit()
        logger.info("Super-admin created org %s (slug=%s)", org.id, org.slug)
        return await self._to_response(org)
