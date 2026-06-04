import logging
import os
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.core.constants import log_messages
from src.core.constants.http_messages import RESOURCE_FILE, RESOURCE_ORDER
from src.core.exceptions import FileTooLargeError, InvalidFileTypeError, NotFoundError
from src.core.schemas import PaginatedResponse, PaginationParams
from src.orders.constants import ALLOWED_FILE_EXTENSIONS
from src.orders.enums import OrderSortField
from src.orders.models import Order
from src.orders.repository import OrderRepository
from src.orders.schemas import (
    OrderCreateSchema,
    OrderListResponseSchema,
    OrderPaymentUpdateSchema,
    OrderResponseSchema,
    OrderStatusUpdateSchema,
    OrderUpdateSchema,
    OrderUrgencyUpdateSchema,
)

logger = logging.getLogger(__name__)


def _compute_item_fields(item_data: dict) -> dict:
    qty = item_data.get("quantity", 1)
    price = Decimal(str(item_data.get("unit_price", 0)))
    cost = Decimal(str(item_data.get("unit_cost", 0)))
    total_price = Decimal(str(qty)) * price
    profit = total_price - Decimal(str(qty)) * cost
    return {**item_data, "total_price": total_price, "profit": profit}


class OrderService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = OrderRepository(db)

    async def list_orders(
        self,
        params: PaginationParams,
        status: str | None = None,
        date_from=None,
        date_to=None,
        customer_id: str | None = None,
        is_paid: bool | None = None,
        payment_method: str | None = None,
        search: str | None = None,
        sort_by: str = OrderSortField.created_at.value,
    ) -> PaginatedResponse[OrderListResponseSchema]:
        orders, total = await self._repo.get_all(
            status,
            date_from,
            date_to,
            customer_id,
            is_paid,
            payment_method,
            search,
            params.page_size,
            params.offset,
            sort_by,
        )
        pages = params.compute_pages(total)
        items = []
        for o in orders:
            schema = OrderListResponseSchema.model_validate(o)
            schema = schema.model_copy(update={"item_count": len(o.items)})
            items.append(schema)
        return PaginatedResponse(
            items=items, total=total, page=params.page, page_size=params.page_size, pages=pages
        )

    async def get_order(self, order_id: str) -> OrderResponseSchema:
        order = await self._repo.get_by_id(order_id)
        if not order:
            raise NotFoundError(RESOURCE_ORDER, order_id)
        return self._to_response(order)

    async def get_customer_orders(self, customer_id: str) -> list[OrderListResponseSchema]:
        orders = await self._repo.get_by_customer(customer_id)
        result = []
        for o in orders:
            schema = OrderListResponseSchema.model_validate(o)
            schema = schema.model_copy(update={"item_count": len(o.items)})
            result.append(schema)
        return result

    async def create_order(self, data: OrderCreateSchema) -> OrderResponseSchema:
        order_number = await self._repo.get_next_order_number()
        items_data = [_compute_item_fields(i.model_dump(exclude_none=True)) for i in data.items]
        order_data = data.model_dump(exclude={"items"})
        order_data["order_number"] = order_number
        order = await self._repo.create(order_data, items_data)
        await self._db.commit()
        refreshed = await self._repo.get_by_id(order.id)
        return self._to_response(refreshed)

    async def update_order(self, order_id: str, data: OrderUpdateSchema) -> OrderResponseSchema:
        order = await self._repo.get_by_id(order_id)
        if not order:
            raise NotFoundError(RESOURCE_ORDER, order_id)
        items_data = None
        if data.items is not None:
            items_data = [_compute_item_fields(i.model_dump(exclude_none=True)) for i in data.items]
        order_data = data.model_dump(exclude={"items"}, exclude_none=True)
        await self._repo.update(order, order_data, items_data)
        await self._db.commit()
        refreshed = await self._repo.get_by_id(order_id)
        return self._to_response(refreshed)

    async def update_status(
        self, order_id: str, data: OrderStatusUpdateSchema
    ) -> OrderResponseSchema:
        order = await self._repo.get_by_id(order_id)
        if not order:
            raise NotFoundError(RESOURCE_ORDER, order_id)
        old_status = order.status
        order.status = data.status.value
        await self._db.commit()
        logger.info(log_messages.ORDER_STATUS_CHANGED, order_id, old_status, data.status.value)
        refreshed = await self._repo.get_by_id(order_id)
        return self._to_response(refreshed)

    async def update_payment(
        self, order_id: str, data: OrderPaymentUpdateSchema
    ) -> OrderResponseSchema:
        order = await self._repo.get_by_id(order_id)
        if not order:
            raise NotFoundError(RESOURCE_ORDER, order_id)
        order.is_paid = data.is_paid
        if data.payment_method:
            order.payment_method = data.payment_method.value
        await self._db.commit()
        refreshed = await self._repo.get_by_id(order_id)
        return self._to_response(refreshed)

    async def update_urgency(
        self, order_id: str, data: OrderUrgencyUpdateSchema
    ) -> OrderResponseSchema:
        order = await self._repo.get_by_id(order_id)
        if not order:
            raise NotFoundError(RESOURCE_ORDER, order_id)
        order.urgency = data.urgency.value
        await self._db.commit()
        logger.info(log_messages.ORDER_URGENCY_CHANGED, order_id, data.urgency.value)
        refreshed = await self._repo.get_by_id(order_id)
        return self._to_response(refreshed)

    @staticmethod
    def _to_response(order: Order) -> OrderResponseSchema:
        return OrderResponseSchema.model_validate(order)

    async def delete_order(self, order_id: str) -> None:
        order = await self._repo.get_by_id(order_id)
        if not order:
            raise NotFoundError(RESOURCE_ORDER, order_id)
        await self._repo.soft_delete(order)
        await self._db.commit()

    async def upload_file(self, order_id: str, filename: str, content: bytes) -> dict:
        import uuid

        order = await self._repo.get_by_id(order_id)
        if not order:
            raise NotFoundError(RESOURCE_ORDER, order_id)

        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise FileTooLargeError(settings.MAX_FILE_SIZE_MB)

        _, ext = os.path.splitext(filename.lower())
        if ext not in ALLOWED_FILE_EXTENSIONS:
            raise InvalidFileTypeError(ext)

        if ext in {".jpg", ".jpeg", ".png", ".gif", ".svg"}:
            file_type = "image"
        elif ext == ".pdf":
            file_type = "pdf"
        else:
            file_type = "other"
        stored_name = f"{uuid.uuid4()}{ext}"
        dir_path = os.path.join(settings.UPLOADS_DIR, order_id)
        os.makedirs(dir_path, exist_ok=True)
        file_path = os.path.join(dir_path, stored_name)

        with open(file_path, "wb") as f:
            f.write(content)

        storage_path = f"{order_id}/{stored_name}"
        order_file = await self._repo.add_file(
            order_id,
            {
                "original_name": filename,
                "storage_path": storage_path,
                "file_type": file_type,
                "file_size_bytes": len(content),
            },
        )
        await self._db.commit()
        logger.info(log_messages.FILE_UPLOADED, order_id, filename, len(content))
        return {"id": order_file.id, "storage_path": storage_path, "original_name": filename}

    async def delete_file(self, order_id: str, file_id: str) -> None:
        order_file = await self._repo.get_file(file_id, order_id)
        if not order_file:
            raise NotFoundError(RESOURCE_FILE, file_id)
        full_path = os.path.join(settings.UPLOADS_DIR, order_file.storage_path)
        if os.path.exists(full_path):
            os.remove(full_path)
        await self._repo.delete_file(order_file)
        await self._db.commit()
        logger.info(log_messages.FILE_DELETED, order_file.storage_path)
