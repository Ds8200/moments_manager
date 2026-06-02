import logging
import secrets

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import CANNOT_DELETE_SELF, RESOURCE_USER, USER_EMAIL_EXISTS
from src.core.constants.log_messages import USER_CREATED, USER_DELETED
from src.core.email import send_html_email
from src.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from src.core.schemas import PaginatedResponse, PaginationParams
from src.core.security import create_magic_login_token, hash_password
from src.users.email_templates import build_welcome_email
from src.users.enums import UserRole
from src.users.repository import UserRepository
from src.users.schemas import UserCreateSchema, UserResponseSchema

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = UserRepository(db)

    async def list_users(self, params: PaginationParams) -> PaginatedResponse[UserResponseSchema]:
        users, total = await self._repo.list_all(params.page_size, params.offset)
        pages = max(1, (total + params.page_size - 1) // params.page_size)
        return PaginatedResponse(
            items=[UserResponseSchema.model_validate(u) for u in users],
            total=total,
            page=params.page,
            page_size=params.page_size,
            pages=pages,
        )

    async def create_user(
        self,
        data: UserCreateSchema,
        background_tasks: BackgroundTasks,
    ) -> UserResponseSchema:
        existing = await self._repo.get_by_email(data.email)
        if existing:
            raise ConflictError(USER_EMAIL_EXISTS)

        temp_password = secrets.token_urlsafe(12)
        user = await self._repo.create(
            email=data.email,
            hashed_password=hash_password(temp_password),
            full_name=data.full_name,
            role=UserRole.user.value,
        )
        await self._db.commit()
        await self._db.refresh(user)
        logger.info(USER_CREATED, user.email, user.role)

        magic_token = create_magic_login_token(user.id)
        subject, html_body = build_welcome_email(data.email, temp_password, magic_token)
        background_tasks.add_task(send_html_email, data.email, subject, html_body)

        return UserResponseSchema.model_validate(user)

    async def delete_user(self, user_id: str, requesting_admin_id: str) -> None:
        if user_id == requesting_admin_id:
            raise ForbiddenError(CANNOT_DELETE_SELF)
        user = await self._repo.get_by_id(user_id)
        if not user:
            raise NotFoundError(RESOURCE_USER, user_id)
        await self._repo.soft_delete(user)
        await self._db.commit()
        logger.info(USER_DELETED, user_id, requesting_admin_id)
