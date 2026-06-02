import logging

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
    ) -> User:
        user = User(email=email, hashed_password=hashed_password, full_name=full_name, role=role)
        self._db.add(user)
        await self._db.flush()
        return user

    async def delete(self, user: User) -> None:
        await self._db.delete(user)
        await self._db.flush()
