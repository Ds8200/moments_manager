import logging

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import CANNOT_DELETE_USER_WITH_ORGS
from src.core.exceptions import ConflictError, NotFoundError
from src.organizations.repository import OrgRepository
from src.super_admin.schemas import OrgOwnerAdminResponseSchema, UserSearchResponseSchema
from src.users.repository import UserRepository

logger = logging.getLogger(__name__)


class SuperAdminUsersService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._user_repo = UserRepository(db)
        self._org_repo = OrgRepository(db)

    async def list_users(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
    ) -> tuple[list[OrgOwnerAdminResponseSchema], int]:
        offset = (page - 1) * page_size
        rows, total = await self._user_repo.list_org_owners(page_size, offset, search=search)
        items = [
            OrgOwnerAdminResponseSchema(
                id=row[0].id,
                email=row[0].email,
                full_name=row[0].full_name,
                phone=row[0].phone,
                org_count=row[1],
                created_at=row[0].created_at,
            )
            for row in rows
        ]
        return items, total

    async def get_user(self, user_id: str) -> OrgOwnerAdminResponseSchema:
        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User", user_id)
        org_count = await self._org_repo.count_active_orgs_for_owner(user_id)
        return OrgOwnerAdminResponseSchema(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            org_count=org_count,
            created_at=user.created_at,
        )

    async def delete_user(self, user_id: str) -> None:
        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User", user_id)
        org_count = await self._org_repo.count_active_orgs_for_owner(user_id)
        if org_count > 0:
            raise ConflictError(CANNOT_DELETE_USER_WITH_ORGS)
        await self._user_repo.hard_delete(user_id)
        await self._db.commit()
        logger.info("Super-admin hard-deleted user %s", user_id)

    async def search_users_for_autocomplete(self, query: str) -> list[UserSearchResponseSchema]:
        users = await self._user_repo.search_for_autocomplete(query)
        return [
            UserSearchResponseSchema(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                phone=u.phone,
            )
            for u in users
        ]
