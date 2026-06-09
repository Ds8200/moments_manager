import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.users.enums import UserRole
from src.users.models import User

logger = logging.getLogger(__name__)


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, user_id: str) -> User | None:
        result = await self._db.execute(
            select(User).where(User.id == user_id, User.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self._db.execute(
            select(User).where(User.email == email, User.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def email_exists(self, email: str) -> bool:
        result = await self._db.execute(
            select(User.id).where(User.email == email, User.is_deleted == False)
        )
        return result.scalar_one_or_none() is not None

    async def list_all(self, page_size: int, offset: int) -> tuple[list[User], int]:
        base_query = select(User).where(User.is_deleted == False)
        count_result = await self._db.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()
        users_result = await self._db.execute(
            base_query.order_by(User.created_at.desc()).limit(page_size).offset(offset)
        )
        return list(users_result.scalars().all()), total

    async def create(
        self,
        email: str,
        hashed_password: str,
        full_name: str,
        role: str = UserRole.user.value,
        phone: str | None = None,
    ) -> User:
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=role,
            phone=phone,
        )
        self._db.add(user)
        await self._db.flush()
        return user

    async def update_me(
        self,
        user: User,
        full_name: str | None = None,
        hashed_password: str | None = None,
    ) -> User:
        if full_name is not None:
            user.full_name = full_name
        if hashed_password is not None:
            user.hashed_password = hashed_password
        await self._db.flush()
        return user

    async def soft_delete(self, user: User) -> None:
        user.is_deleted = True
        user.deleted_at = datetime.now(timezone.utc)
        await self._db.flush()

    async def hard_delete(self, user_id: str) -> None:
        from sqlalchemy import delete

        from src.auth.models import RefreshToken
        from src.organizations.models import OrganizationMembership

        await self._db.execute(delete(RefreshToken).where(RefreshToken.user_id == user_id))
        await self._db.execute(
            delete(OrganizationMembership).where(OrganizationMembership.user_id == user_id)
        )
        await self._db.execute(delete(User).where(User.id == user_id))

    async def list_org_owners(
        self,
        limit: int,
        offset: int,
        search: str | None = None,
    ) -> tuple[list, int]:
        from sqlalchemy import and_

        from src.organizations.models import Organization

        org_count_subq = (
            select(func.count())
            .where(
                Organization.owner_id == User.id,
                Organization.is_deleted == False,
            )
            .correlate(User)
            .scalar_subquery()
        )

        conditions: list = [User.is_deleted == False, org_count_subq > 0]
        if search:
            pattern = f"%{search}%"
            conditions.append(User.email.ilike(pattern) | User.full_name.ilike(pattern))

        count_result = await self._db.execute(
            select(func.count()).select_from(User).where(and_(*conditions))
        )
        total = count_result.scalar_one()

        result = await self._db.execute(
            select(User, org_count_subq.label("org_count"))
            .where(and_(*conditions))
            .order_by(User.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.all(), total

    async def search_for_autocomplete(self, query: str, limit: int = 10) -> list[User]:
        pattern = f"%{query}%"
        result = await self._db.execute(
            select(User)
            .where(
                User.is_deleted == False,
                User.email.ilike(pattern) | User.full_name.ilike(pattern),
            )
            .limit(limit)
        )
        return list(result.scalars().all())
