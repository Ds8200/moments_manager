import logging

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import SMTP_HOST_WITHOUT_PASSWORD, WRONG_CURRENT_PASSWORD
from src.core.email import platform_smtp_kwargs, send_html_email_via_smtp
from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import ConflictError, UnauthorizedError
from src.core.security import hash_password, verify_password
from src.system_settings.constants import (
    PASSWORD_CHANGED,
    PASSWORD_CHANGED_NO_EMAIL,
)
from src.system_settings.repository import SystemSettingsRepository
from src.system_settings.schemas import (
    MessageResponseSchema,
    SysAdminPasswordChangeSchema,
    SystemOpenAIUpdateSchema,
    SystemSettingsResponseSchema,
    SystemSmtpUpdateSchema,
)
from src.users.repository import UserRepository

logger = logging.getLogger(__name__)

_PLATFORM_NAME = "Nihulo"


def _to_response(s) -> SystemSettingsResponseSchema:
    return SystemSettingsResponseSchema(
        has_smtp_config=bool(s.platform_smtp_host and s.platform_smtp_password),
        smtp_host=s.platform_smtp_host,
        smtp_port=s.platform_smtp_port,
        smtp_username=s.platform_smtp_username,
        smtp_from_email=s.platform_smtp_from_email,
        smtp_from_name=s.platform_smtp_from_name,
        has_openai_key=bool(s.platform_openai_api_key),
        openai_key_preview=(s.platform_openai_api_key[-4:] if s.platform_openai_api_key else None),
        updated_at=s.updated_at,
    )


class SystemSettingsService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = SystemSettingsRepository(db)

    async def get_settings(self) -> SystemSettingsResponseSchema:
        s = await self._repo.get()
        return _to_response(s)

    async def update_smtp(self, data: SystemSmtpUpdateSchema) -> SystemSettingsResponseSchema:
        s = await self._repo.get()
        fields = {k: v for k, v in data.model_dump().items() if v is not None}
        s = await self._repo.update(s, fields)
        if s.platform_smtp_host and not s.platform_smtp_password:
            raise ConflictError(
                SMTP_HOST_WITHOUT_PASSWORD, code=ErrorCode.SMTP_PASSWORD_REQUIRED
            )
        await self._db.commit()
        logger.info("Platform SMTP settings updated")
        return _to_response(s)

    async def update_openai(self, data: SystemOpenAIUpdateSchema) -> SystemSettingsResponseSchema:
        s = await self._repo.get()
        fields = {k: v for k, v in data.model_dump().items() if v is not None}
        s = await self._repo.update(s, fields)
        await self._db.commit()
        logger.info("Platform OpenAI key updated")
        return _to_response(s)

    async def change_password(
        self,
        admin_user,
        data: SysAdminPasswordChangeSchema,
        background_tasks: BackgroundTasks,
    ) -> MessageResponseSchema:
        if not verify_password(data.current_password, admin_user.hashed_password):
            raise UnauthorizedError(WRONG_CURRENT_PASSWORD)

        new_hashed = hash_password(data.new_password)
        await UserRepository(self._db).update_me(admin_user, hashed_password=new_hashed)
        await self._db.commit()
        logger.info("Sys admin password changed: %s", admin_user.email)

        s = await self._repo.get()
        smtp_kw = platform_smtp_kwargs(s)
        if smtp_kw:
            from src.users.email_templates import build_password_changed_email

            subject, html = build_password_changed_email(admin_user.email, _PLATFORM_NAME)
            background_tasks.add_task(
                send_html_email_via_smtp,
                to_email=admin_user.email,
                subject=subject,
                html_body=html,
                **smtp_kw,
            )
            return MessageResponseSchema(message=PASSWORD_CHANGED)

        return MessageResponseSchema(message=PASSWORD_CHANGED_NO_EMAIL)
