import logging
import os
from datetime import datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import RESOURCE_FILE, RESOURCE_ORDER
from src.core.exceptions import FileTooLargeError, InvalidFileTypeError, NotFoundError
from src.core.schemas import PaginatedResponse, PaginationParams
from src.orders.enums import OrderStatus, OrderUrgency
from src.orders.models import Order
from src.orders.repository import OrderRepository
from src.orders.schemas import (
    OrderCreateSchema,
    OrderListResponseSchema,
    OrderPaymentUpdateSchema,
    OrderResponseSchema,
    OrderStatusUpdateSchema,
    OrderUpdateSchema,
)
from src.core.constants import log_messages
from src.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".pdf", ".svg", ".ai", ".psd"}


def _compute_item_fields(item_data: dict) -> dict:
    qty = item_data.get("quantity", 1)
    price = Decimal(str(item_data.get("unit_price", 0)))
    cost = Decimal(str(item_data.get("unit_cost", 0)))
    total_price = Decimal(str(qty)) * price
    profit = total_price - Decimal(str(qty)) * cost
    return {**item_data, "total_price": total_price, "profit": profit}


def _compute_urgency(due_datetime: datetime | None) -> OrderUrgency | None:
    if due_datetime is None:
        return None
    now = datetime.now(due_datetime.tzinfo) if due_datetime.tzinfo else datetime.now()
    hours = (due_datetime - now).total_seconds() / 3600
    if hours <= 24:
        return OrderUrgency.critical
    if hours <= 72:
        return OrderUrgency.high
    if hours <= 168:
        return OrderUrgency.medium
    return OrderUrgency.low


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
    ) -> PaginatedResponse[OrderListResponseSchema]:
        orders, total = await self._repo.get_all(
            status, date_from, date_to, customer_id, is_paid, payment_method, search,
            params.page_size, params.offset
        )
        pages = (total + params.page_size - 1) // params.page_size
        items = []
        for o in orders:
            schema = OrderListResponseSchema.model_validate(o)
            schema = schema.model_copy(update={
                "item_count": len(o.items),
                "urgency": _compute_urgency(o.due_datetime),
            })
            items.append(schema)
        return PaginatedResponse(
            items=items, total=total, page=params.page,
            page_size=params.page_size, pages=pages
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
            schema = schema.model_copy(update={
                "item_count": len(o.items),
                "urgency": _compute_urgency(o.due_datetime),
            })
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

    async def update_status(self, order_id: str, data: OrderStatusUpdateSchema) -> OrderResponseSchema:
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

    @staticmethod
    def _to_response(order: Order) -> OrderResponseSchema:
        schema = OrderResponseSchema.model_validate(order)
        return schema.model_copy(update={"urgency": _compute_urgency(order.due_datetime)})

    async def delete_order(self, order_id: str) -> None:
        order = await self._repo.get_by_id(order_id)
        if not order:
            raise NotFoundError(RESOURCE_ORDER, order_id)
        await self._repo.soft_delete(order)
        await self._db.commit()

    async def upload_file(
        self, order_id: str, filename: str, content: bytes
    ) -> dict:
        import uuid
        order = await self._repo.get_by_id(order_id)
        if not order:
            raise NotFoundError(RESOURCE_ORDER, order_id)

        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise FileTooLargeError(settings.MAX_FILE_SIZE_MB)

        _, ext = os.path.splitext(filename.lower())
        if ext not in ALLOWED_EXTENSIONS:
            raise InvalidFileTypeError(ext)

        file_type = "image" if ext in {".jpg", ".jpeg", ".png", ".gif", ".svg"} else "pdf" if ext == ".pdf" else "other"
        stored_name = f"{uuid.uuid4()}{ext}"
        dir_path = os.path.join(settings.UPLOADS_DIR, order_id)
        os.makedirs(dir_path, exist_ok=True)
        file_path = os.path.join(dir_path, stored_name)

        with open(file_path, "wb") as f:
            f.write(content)

        storage_path = f"{order_id}/{stored_name}"
        order_file = await self._repo.add_file(order_id, {
            "original_name": filename,
            "storage_path": storage_path,
            "file_type": file_type,
            "file_size_bytes": len(content),
        })
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
