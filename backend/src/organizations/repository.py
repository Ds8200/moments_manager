import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.organizations.models import Organization, OrganizationInvite, OrganizationMembership

logger = logging.getLogger(__name__)


class OrgRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, org_id: str) -> Organization | None:
        result = await self._db.execute(
            select(Organization).where(Organization.id == org_id, Organization.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Organization | None:
        result = await self._db.execute(
            select(Organization).where(Organization.slug == slug, Organization.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def slug_exists(self, slug: str) -> bool:
        result = await self._db.execute(
            select(Organization.id).where(
                Organization.slug == slug, Organization.is_deleted == False
            )
        )
        return result.scalar_one_or_none() is not None

    async def create(
        self,
        slug: str,
        name: str,
        owner_id: str,
        plan: str,
        max_users: int,
        org_number: str,
        trial_ends_at: datetime | None = None,
    ) -> Organization:
        org = Organization(
            slug=slug,
            name=name,
            owner_id=owner_id,
            plan=plan,
            max_users=max_users,
            org_number=org_number,
            trial_ends_at=trial_ends_at,
        )
        self._db.add(org)
        await self._db.flush()
        return org

    async def update(self, org: Organization, **fields) -> Organization:
        for key, value in fields.items():
            setattr(org, key, value)
        await self._db.flush()
        await self._db.refresh(org)
        return org

    async def soft_delete(self, org: Organization) -> None:
        org.is_deleted = True
        org.deleted_at = datetime.now(timezone.utc)
        await self._db.flush()

    async def list_owners(self) -> list[tuple]:
        """Return (user_id, email, full_name, org_id, org_name) for all active org owners."""
        from sqlalchemy import and_

        from src.organizations.enums import OrgRole
        from src.users.models import User

        result = await self._db.execute(
            select(
                OrganizationMembership.user_id,
                User.email,
                User.full_name,
                Organization.id.label("org_id"),
                Organization.name.label("org_name"),
            )
            .join(Organization, Organization.id == OrganizationMembership.organization_id)
            .join(User, User.id == OrganizationMembership.user_id)
            .where(
                and_(
                    OrganizationMembership.role == OrgRole.owner.value,
                    OrganizationMembership.is_active == True,
                    Organization.is_deleted == False,
                    Organization.is_active == True,
                    User.is_deleted == False,
                )
            )
            .order_by(Organization.name)
        )
        return list(result.all())

    async def list_all(
        self,
        limit: int,
        offset: int,
        search: str | None = None,
        plan: str | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[Organization], int]:
        base = select(Organization).where(Organization.is_deleted == False)
        if search:
            pattern = f"%{search}%"
            base = base.where(
                Organization.name.ilike(pattern)
                | Organization.slug.ilike(pattern)
                | Organization.org_number.ilike(pattern)
            )
        if plan:
            base = base.where(Organization.plan == plan)
        if is_active is not None:
            base = base.where(Organization.is_active == is_active)
        count_result = await self._db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self._db.execute(
            base.order_by(Organization.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def get_next_org_number(self) -> str:
        year = datetime.now().year
        prefix = f"ORG-{year}-"
        result = await self._db.execute(
            select(func.max(Organization.org_number)).where(
                Organization.org_number.like(f"{prefix}%")
            )
        )
        max_number = result.scalar_one_or_none()
        last_seq = int(max_number.split("-")[-1]) if max_number else 0
        return f"{prefix}{last_seq + 1:04d}"

    async def hard_delete(self, org_id: str) -> None:
        from sqlalchemy import delete

        await self._db.execute(
            delete(OrganizationInvite).where(OrganizationInvite.organization_id == org_id)
        )
        await self._db.execute(
            delete(OrganizationMembership).where(
                OrganizationMembership.organization_id == org_id
            )
        )
        await self._db.execute(delete(Organization).where(Organization.id == org_id))

    async def count_active_orgs_for_owner(self, owner_id: str) -> int:
        result = await self._db.execute(
            select(func.count()).where(
                Organization.owner_id == owner_id,
                Organization.is_deleted == False,
            )
        )
        return result.scalar_one()


class MembershipRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_active(self, user_id: str, org_id: str) -> OrganizationMembership | None:
        result = await self._db.execute(
            select(OrganizationMembership).where(
                OrganizationMembership.user_id == user_id,
                OrganizationMembership.organization_id == org_id,
                OrganizationMembership.is_active == True,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: str) -> list[OrganizationMembership]:
        result = await self._db.execute(
            select(OrganizationMembership).where(
                OrganizationMembership.user_id == user_id,
                OrganizationMembership.is_active == True,
            )
        )
        return list(result.scalars().all())

    async def list_by_org(self, org_id: str) -> list[OrganizationMembership]:
        result = await self._db.execute(
            select(OrganizationMembership).where(
                OrganizationMembership.organization_id == org_id,
                OrganizationMembership.is_active == True,
            )
        )
        return list(result.scalars().all())

    async def count_active(self, org_id: str) -> int:
        from sqlalchemy import func

        result = await self._db.execute(
            select(func.count()).where(
                OrganizationMembership.organization_id == org_id,
                OrganizationMembership.is_active == True,
            )
        )
        return result.scalar_one()

    async def create(
        self,
        org_id: str,
        user_id: str,
        role: str,
        invited_by: str | None = None,
    ) -> OrganizationMembership:
        membership = OrganizationMembership(
            organization_id=org_id,
            user_id=user_id,
            role=role,
            invited_by=invited_by,
            joined_at=datetime.now(timezone.utc),
            is_active=True,
        )
        self._db.add(membership)
        await self._db.flush()
        return membership

    async def deactivate(self, membership: OrganizationMembership) -> None:
        membership.is_active = False
        await self._db.flush()


class InviteRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_valid_by_hash(self, token_hash: str) -> OrganizationInvite | None:
        now = datetime.now(timezone.utc)
        result = await self._db.execute(
            select(OrganizationInvite).where(
                OrganizationInvite.token_hash == token_hash,
                OrganizationInvite.accepted_at.is_(None),
                OrganizationInvite.expires_at > now,
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        org_id: str,
        email: str,
        role: str,
        token_hash: str,
        expires_at: datetime,
        invited_by: str,
    ) -> OrganizationInvite:
        invite = OrganizationInvite(
            organization_id=org_id,
            email=email,
            role=role,
            token_hash=token_hash,
            expires_at=expires_at,
            invited_by=invited_by,
        )
        self._db.add(invite)
        await self._db.flush()
        return invite

    async def mark_accepted(self, invite: OrganizationInvite) -> None:
        invite.accepted_at = datetime.now(timezone.utc)
        await self._db.flush()
