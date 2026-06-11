import logging

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import PLATFORM_EMAIL_NOT_CONFIGURED
from src.core.email import platform_smtp_kwargs, send_html_email_via_smtp
from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import ConflictError
from src.customers.email_templates import build_customer_email
from src.organizations.repository import OrgRepository
from src.super_admin.schemas import AdminComposeEmailResponseSchema, AdminComposeEmailSchema

logger = logging.getLogger(__name__)

_ADMIN_EMAIL_DISPATCHED = "Sys-admin email dispatched: %d recipients (%d owners + %d manual)"
_OWNER_NOT_FOUND = "Skipping org_owner_id %s — not found in owners list"
_PLATFORM_NAME = "Nihulo"


class SuperAdminEmailService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_org_owners(self):
        return await OrgRepository(self._db).list_owners()

    async def compose_email(
        self,
        data: AdminComposeEmailSchema,
        background_tasks: BackgroundTasks,
        sys_settings,
    ) -> AdminComposeEmailResponseSchema:
        smtp_kw = platform_smtp_kwargs(sys_settings)
        if not smtp_kw:
            raise ConflictError(
                PLATFORM_EMAIL_NOT_CONFIGURED, code=ErrorCode.PLATFORM_EMAIL_NOT_CONFIGURED
            )

        # Build user_id → (email, full_name) lookup from all active owners
        all_owners = await OrgRepository(self._db).list_owners()
        owner_map: dict[str, tuple[str, str]] = {
            row.user_id: (row.email, row.full_name) for row in all_owners
        }

        attachments = (
            [a.model_dump() for a in data.attachments] if data.attachments else None
        )

        sent_to = 0

        for user_id in data.org_owner_ids:
            if user_id not in owner_map:
                logger.warning(_OWNER_NOT_FOUND, user_id)
                continue
            email, full_name = owner_map[user_id]
            subject, html = build_customer_email(
                full_name, data.subject, data.body, _PLATFORM_NAME, None, None
            )
            background_tasks.add_task(
                send_html_email_via_smtp,
                to_email=email,
                subject=subject,
                html_body=html,
                attachments=attachments,
                **smtp_kw,
            )
            sent_to += 1

        for email in data.manual_emails:
            subject, html = build_customer_email(
                "", data.subject, data.body, _PLATFORM_NAME, None, None
            )
            background_tasks.add_task(
                send_html_email_via_smtp,
                to_email=email,
                subject=subject,
                html_body=html,
                attachments=attachments,
                **smtp_kw,
            )
            sent_to += 1

        logger.info(
            _ADMIN_EMAIL_DISPATCHED,
            sent_to,
            len(data.org_owner_ids),
            len(data.manual_emails),
        )
        return AdminComposeEmailResponseSchema(
            message="אימיילים בתור לשליחה",
            sent_to=sent_to,
        )
