import logging
from datetime import date
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_current_user, get_db
from src.core.schemas import PaginatedResponse, PaginationParams
from src.orders.schemas import (
    OrderCreateSchema,
    OrderFileResponseSchema,
    OrderListResponseSchema,
    OrderPaymentUpdateSchema,
    OrderResponseSchema,
    OrderStatusUpdateSchema,
    OrderUpdateSchema,
)
from src.orders.service import OrderService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.get("", response_model=PaginatedResponse[OrderListResponseSchema])
async def list_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: str | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    customer_id: str | None = Query(default=None),
    is_paid: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = OrderService(db)
    return await svc.list_orders(
        PaginationParams(page=page, page_size=page_size),
        status, date_from, date_to, customer_id, is_paid
    )


@router.post("", response_model=OrderResponseSchema, status_code=201)
async def create_order(
    body: OrderCreateSchema,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = OrderService(db)
    return await svc.create_order(body)


@router.get("/{order_id}", response_model=OrderResponseSchema)
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = OrderService(db)
    return await svc.get_order(order_id)


@router.put("/{order_id}", response_model=OrderResponseSchema)
async def update_order(
    order_id: str,
    body: OrderUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = OrderService(db)
    return await svc.update_order(order_id, body)


@router.patch("/{order_id}/status", response_model=OrderResponseSchema)
async def update_status(
    order_id: str,
    body: OrderStatusUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = OrderService(db)
    return await svc.update_status(order_id, body)


@router.patch("/{order_id}/payment", response_model=OrderResponseSchema)
async def update_payment(
    order_id: str,
    body: OrderPaymentUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = OrderService(db)
    return await svc.update_payment(order_id, body)


@router.delete("/{order_id}", status_code=204, response_model=None)
async def delete_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = OrderService(db)
    await svc.delete_order(order_id)


@router.post("/{order_id}/files", status_code=201, response_model=OrderFileResponseSchema)
async def upload_file(
    order_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = OrderService(db)
    content = await file.read()
    return await svc.upload_file(order_id, file.filename or "file", content)


@router.delete("/{order_id}/files/{file_id}", status_code=204, response_model=None)
async def delete_file(
    order_id: str,
    file_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = OrderService(db)
    await svc.delete_file(order_id, file_id)
