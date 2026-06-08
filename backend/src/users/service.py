import logging
import secrets

from fastapi import BackgroundTasks
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.repository import RefreshTokenRepository
from src.core.constants.http_messages import (
    CANNOT_DELETE_SELF,
    ORG_EMAIL_NOT_CONFIGURED,
    RESOURCE_USER,
    USER_EMAIL_EXISTS,
    WRONG_CURRENT_PASSWORD,
)
from src.core.constants.log_messages import USER_CREATED, USER_DELETED, USER_PROFILE_UPDATED
from src.core.email import platform_smtp_kwargs, send_html_email_via_smtp
from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import ConflictError, ForbiddenError, NotFoundError, UnauthorizedError
from src.core.schemas import PaginatedResponse, PaginationParams
from src.core.security import create_magic_login_token, hash_password, verify_password
from src.users.email_templates import build_password_changed_email, build_welcome_email
from src.users.enums import UserRole
from src.users.models import User
from src.users.repository import UserRepository
from src.users.schemas import UserCreateSchema, UserResponseSchema, UserUpdateMeSchema

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = UserRepository(db)

    async def list_users(self, params: PaginationParams) -> PaginatedResponse[UserResponseSchema]:
        users, total = await self._repo.list_all(params.page_size, params.offset)
        pages = params.compute_pages(total)
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
        org,
    ) -> UserResponseSchema:
        if not (org.smtp_host and org.smtp_password):
            raise ConflictError(ORG_EMAIL_NOT_CONFIGURED, code=ErrorCode.ORG_EMAIL_NOT_CONFIGURED)

        existing = await self._repo.get_by_email(data.email)
        if existing:
            raise ConflictError(USER_EMAIL_EXISTS, code=ErrorCode.USER_EMAIL_EXISTS)

        temp_password = secrets.token_urlsafe(12)
        try:
            user = await self._repo.create(
                email=data.email,
                hashed_password=hash_password(temp_password),
                full_name=data.full_name,
                role=UserRole(data.role).value,
            )
            await self._db.commit()
            await self._db.refresh(user)
        except IntegrityError:
            await self._db.rollback()
            raise ConflictError(USER_EMAIL_EXISTS, code=ErrorCode.USER_EMAIL_EXISTS)
        logger.info(USER_CREATED, user.email, user.role)

        magic_token = create_magic_login_token(user.id)
        subject, html_body = build_welcome_email(
            data.email, temp_password, magic_token, org.name, org.logo_path, org.brand_colors
        )
        background_tasks.add_task(
            send_html_email_via_smtp,
            host=org.smtp_host,
            port=org.smtp_port or 587,
            username=org.smtp_username or "",
            password=org.smtp_password,
            from_email=org.smtp_from_email or org.smtp_username or "",
            from_name=org.smtp_from_name or org.name,
            to_email=data.email,
            subject=subject,
            html_body=html_body,
        )

        return UserResponseSchema.model_validate(user)

    async def get_me(self, current_user: User) -> UserResponseSchema:
        return UserResponseSchema.model_validate(current_user)

    async def update_me(
        self,
        current_user: User,
        data: UserUpdateMeSchema,
        background_tasks: BackgroundTasks,
        sys_settings,
    ) -> UserResponseSchema:
        password_changed = False
        if data.current_password is not None and data.new_password is not None:
            if not verify_password(data.current_password, current_user.hashed_password):
                raise UnauthorizedError(WRONG_CURRENT_PASSWORD)
            hashed = hash_password(data.new_password)
            password_changed = True
        else:
            hashed = None

        user = await self._repo.update_me(
            current_user,
            full_name=data.full_name,
            hashed_password=hashed,
        )
        await self._db.commit()
        await self._db.refresh(user)
        logger.info(USER_PROFILE_UPDATED, user.email)

        if password_changed:
            smtp_kw = platform_smtp_kwargs(sys_settings)
            if smtp_kw:
                subject, html = build_password_changed_email(user.email, "Nihulo")
                background_tasks.add_task(
                    send_html_email_via_smtp,
                    to_email=user.email,
                    subject=subject,
                    html_body=html,
                    **smtp_kw,
                )

        return UserResponseSchema.model_validate(user)

    async def delete_user(self, user_id: str, requesting_admin_id: str) -> None:
        if user_id == requesting_admin_id:
            raise ForbiddenError(CANNOT_DELETE_SELF, code=ErrorCode.CANNOT_DELETE_SELF)
        user = await self._repo.get_by_id(user_id)
        if not user:
            raise NotFoundError(RESOURCE_USER, user_id)
        await RefreshTokenRepository(self._db).delete_all_for_user(user_id)
        await self._repo.soft_delete(user)
        await self._db.commit()
        logger.info(USER_DELETED, user_id, requesting_admin_id)
