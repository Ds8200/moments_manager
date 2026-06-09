import logging

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import (
    COMPOSE_EMAIL_SENT,
    CUSTOMER_EMAIL_SENT,
    CUSTOMER_NO_EMAIL,
    ORG_EMAIL_NOT_CONFIGURED,
    RESOURCE_CUSTOMER,
)
from src.core.constants.log_messages import (
    COMPOSE_EMAIL_CUSTOMER_NO_EMAIL,
    COMPOSE_EMAIL_CUSTOMER_NOT_FOUND,
    COMPOSE_EMAIL_DISPATCHED,
    CUSTOMER_EMAIL_DISPATCHED,
)
from src.core.email import platform_smtp_kwargs, send_html_email_via_smtp
from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import ConflictError, NotFoundError
from src.core.schemas import PaginatedResponse, PaginationParams
from src.customers.email_templates import build_customer_email, build_customer_welcome_email
from src.customers.repository import CustomerRepository
from src.customers.schemas import (
    ComposeEmailResponseSchema,
    ComposeEmailSchema,
    CustomerCreateSchema,
    CustomerResponseSchema,
    CustomerSendEmailSchema,
    CustomerUpdateSchema,
    CustomerWithStatsSchema,
    EmailSentResponseSchema,
)

logger = logging.getLogger(__name__)


def _org_smtp_kwargs(org) -> dict:
    return {
        "host": org.smtp_host,
        "port": org.smtp_port or 587,
        "username": org.smtp_username or "",
        "password": org.smtp_password,
        "from_email": org.smtp_from_email or org.smtp_username or "",
        "from_name": org.smtp_from_name or org.name,
    }


class CustomerService:
    def __init__(self, db: AsyncSession, org_id: str) -> None:
        self._db = db
        self._org_id = org_id
        self._repo = CustomerRepository(db, org_id)

    async def list_customers(
        self,
        params: PaginationParams,
        search: str | None = None,
        has_email: bool | None = None,
    ) -> PaginatedResponse[CustomerResponseSchema]:
        customers, total = await self._repo.get_all(
            search, params.page_size, params.offset, has_email
        )
        pages = params.compute_pages(total)
        return PaginatedResponse(
            items=[CustomerResponseSchema.model_validate(c) for c in customers],
            total=total,
            page=params.page,
            page_size=params.page_size,
            pages=pages,
        )

    async def get_customer(self, customer_id: str) -> CustomerWithStatsSchema:
        customer = await self._repo.get_by_id(customer_id)
        if not customer:
            raise NotFoundError(RESOURCE_CUSTOMER, customer_id)
        from src.orders.repository import OrderRepository

        order_repo = OrderRepository(self._db, self._org_id)
        stats = await order_repo.get_customer_stats(customer_id)
        result = CustomerWithStatsSchema.model_validate(customer)
        result.total_orders = stats["total_orders"]
        result.total_spent = stats["total_spent"]
        return result

    async def create_customer(
        self,
        data: CustomerCreateSchema,
        background_tasks: BackgroundTasks,
        org,
        sys_settings,
    ) -> CustomerResponseSchema:
        customer = await self._repo.create(data.model_dump(exclude_none=True))
        await self._db.commit()
        refreshed = await self._repo.get_by_id(customer.id)

        if refreshed and refreshed.email:
            smtp_kw = platform_smtp_kwargs(sys_settings)
            if smtp_kw:
                subject, html = build_customer_welcome_email(
                    refreshed.name, org.name, org.logo_path, org.brand_colors
                )
                background_tasks.add_task(
                    send_html_email_via_smtp,
                    to_email=refreshed.email,
                    subject=subject,
                    html_body=html,
                    **smtp_kw,
                )
            else:
                logger.warning(
                    "Platform SMTP not configured — skipping customer welcome email to %s",
                    refreshed.email,
                )

        return CustomerResponseSchema.model_validate(refreshed)

    async def update_customer(
        self, customer_id: str, data: CustomerUpdateSchema
    ) -> CustomerResponseSchema:
        customer = await self._repo.get_by_id(customer_id)
        if not customer:
            raise NotFoundError(RESOURCE_CUSTOMER, customer_id)
        await self._repo.update(customer, data.model_dump(exclude_none=True))
        await self._db.commit()
        refreshed = await self._repo.get_by_id(customer_id)
        return CustomerResponseSchema.model_validate(refreshed)

    async def delete_customer(self, customer_id: str) -> None:
        customer = await self._repo.get_by_id(customer_id)
        if not customer:
            raise NotFoundError(RESOURCE_CUSTOMER, customer_id)
        await self._repo.soft_delete(customer)
        await self._db.commit()

    async def send_email_to_customer(
        self,
        customer_id: str,
        data: CustomerSendEmailSchema,
        background_tasks: BackgroundTasks,
        org,
    ) -> EmailSentResponseSchema:
        customer = await self._repo.get_by_id(customer_id)
        if not customer:
            raise NotFoundError(RESOURCE_CUSTOMER, customer_id)
        if not customer.email:
            raise ConflictError(CUSTOMER_NO_EMAIL, code=ErrorCode.CUSTOMER_NO_EMAIL)
        if not (org.smtp_host and org.smtp_password):
            raise ConflictError(ORG_EMAIL_NOT_CONFIGURED, code=ErrorCode.ORG_EMAIL_NOT_CONFIGURED)

        smtp = _org_smtp_kwargs(org)
        subject, html_body = build_customer_email(
            customer.name, data.subject, data.body, org.name, org.logo_path, org.brand_colors
        )
        attachments = [a.model_dump() for a in data.attachments] if data.attachments else None
        background_tasks.add_task(
            send_html_email_via_smtp,
            to_email=customer.email,
            subject=subject,
            html_body=html_body,
            attachments=attachments,
            **smtp,
        )
        logger.info(CUSTOMER_EMAIL_DISPATCHED, customer.email, customer_id)
        return EmailSentResponseSchema(message=CUSTOMER_EMAIL_SENT)

    async def compose_email(
        self,
        data: ComposeEmailSchema,
        background_tasks: BackgroundTasks,
        org,
    ) -> ComposeEmailResponseSchema:
        if not (org.smtp_host and org.smtp_password):
            raise ConflictError(ORG_EMAIL_NOT_CONFIGURED, code=ErrorCode.ORG_EMAIL_NOT_CONFIGURED)

        sent_to = 0
        smtp = _org_smtp_kwargs(org)
        attachments = [a.model_dump() for a in data.attachments] if data.attachments else None

        customers = await self._repo.get_by_ids(data.customer_ids)
        customer_map = {c.id: c for c in customers}

        for customer_id in data.customer_ids:
            customer = customer_map.get(customer_id)
            if not customer:
                logger.warning(COMPOSE_EMAIL_CUSTOMER_NOT_FOUND, customer_id)
                continue
            if not customer.email:
                logger.warning(COMPOSE_EMAIL_CUSTOMER_NO_EMAIL, customer_id)
                continue
            subject, html_body = build_customer_email(
                customer.name, data.subject, data.body, org.name, org.logo_path, org.brand_colors
            )
            background_tasks.add_task(
                send_html_email_via_smtp,
                to_email=customer.email,
                subject=subject,
                html_body=html_body,
                attachments=attachments,
                **smtp,
            )
            sent_to += 1

        for email in data.manual_emails:
            subject, html_body = build_customer_email(
                "", data.subject, data.body, org.name, org.logo_path, org.brand_colors
            )
            background_tasks.add_task(
                send_html_email_via_smtp,
                to_email=email,
                subject=subject,
                html_body=html_body,
                attachments=attachments,
                **smtp,
            )
            sent_to += 1

        logger.info(
            COMPOSE_EMAIL_DISPATCHED, sent_to, len(data.customer_ids), len(data.manual_emails)
        )
        return ComposeEmailResponseSchema(message=COMPOSE_EMAIL_SENT, sent_to=sent_to)
