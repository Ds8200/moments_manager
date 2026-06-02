import logging

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import RESOURCE_CUSTOMER
from src.core.exceptions import NotFoundError
from src.core.schemas import PaginatedResponse, PaginationParams
from src.customers.repository import CustomerRepository
from src.customers.schemas import (
    CustomerCreateSchema,
    CustomerResponseSchema,
    CustomerUpdateSchema,
    CustomerWithStatsSchema,
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
