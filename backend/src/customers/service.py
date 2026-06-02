import logging

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import (
    COMPOSE_EMAIL_SENT,
    CUSTOMER_EMAIL_SENT,
    CUSTOMER_NO_EMAIL,
    RESOURCE_CUSTOMER,
)
from src.core.constants.log_messages import (
    COMPOSE_EMAIL_DISPATCHED,
    CUSTOMER_EMAIL_DISPATCHED,
)
from src.core.email import send_html_email
from src.core.exceptions import ConflictError, NotFoundError
from src.core.schemas import PaginatedResponse, PaginationParams
from src.customers.email_templates import build_customer_email
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


class CustomerService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = CustomerRepository(db)

    async def list_customers(
        self, params: PaginationParams, search: str | None = None
    ) -> PaginatedResponse[CustomerResponseSchema]:
        customers, total = await self._repo.get_all(search, params.page_size, params.offset)
        pages = (total + params.page_size - 1) // params.page_size
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
        order_repo = OrderRepository(self._db)
        stats = await order_repo.get_customer_stats(customer_id)
        result = CustomerWithStatsSchema.model_validate(customer)
        result.total_orders = stats["total_orders"]
        result.total_spent = stats["total_spent"]
        return result

    async def create_customer(self, data: CustomerCreateSchema) -> CustomerResponseSchema:
        customer = await self._repo.create(data.model_dump(exclude_none=True))
        await self._db.commit()
        refreshed = await self._repo.get_by_id(customer.id)
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
    ) -> EmailSentResponseSchema:
        customer = await self._repo.get_by_id(customer_id)
        if not customer:
            raise NotFoundError(RESOURCE_CUSTOMER, customer_id)
        if not customer.email:
            raise ConflictError(CUSTOMER_NO_EMAIL)
        subject, html_body = build_customer_email(customer.name, data.subject, data.body)
        background_tasks.add_task(send_html_email, customer.email, subject, html_body)
        logger.info(CUSTOMER_EMAIL_DISPATCHED, customer.email, customer_id)
        return EmailSentResponseSchema(message=CUSTOMER_EMAIL_SENT)

    async def compose_email(
        self,
        data: ComposeEmailSchema,
        background_tasks: BackgroundTasks,
    ) -> ComposeEmailResponseSchema:
        sent_to = 0

        for customer_id in data.customer_ids:
            customer = await self._repo.get_by_id(customer_id)
            if not customer:
                logger.warning("compose_email: customer %s not found, skipping", customer_id)
                continue
            if not customer.email:
                logger.warning("compose_email: customer %s has no email, skipping", customer_id)
                continue
            subject, html_body = build_customer_email(customer.name, data.subject, data.body)
            background_tasks.add_task(send_html_email, customer.email, subject, html_body)
            sent_to += 1

        for email in data.manual_emails:
            subject, html_body = build_customer_email("", data.subject, data.body)
            background_tasks.add_task(send_html_email, email, subject, html_body)
            sent_to += 1

        logger.info(
            COMPOSE_EMAIL_DISPATCHED, sent_to, len(data.customer_ids), len(data.manual_emails)
        )
        return ComposeEmailResponseSchema(message=COMPOSE_EMAIL_SENT, sent_to=sent_to)
