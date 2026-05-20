import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_current_user, get_db
from src.core.schemas import PaginatedResponse, PaginationParams
from src.customers.schemas import (
    CustomerCreateSchema,
    CustomerResponseSchema,
    CustomerUpdateSchema,
    CustomerWithStatsSchema,
)
from src.customers.service import CustomerService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/customers", tags=["customers"])


@router.get("", response_model=PaginatedResponse[CustomerResponseSchema])
async def list_customers(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = CustomerService(db)
    return await svc.list_customers(PaginationParams(page=page, page_size=page_size), search)


@router.post("", response_model=CustomerResponseSchema, status_code=201)
async def create_customer(
    body: CustomerCreateSchema,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = CustomerService(db)
    return await svc.create_customer(body)


@router.get("/{customer_id}", response_model=CustomerWithStatsSchema)
async def get_customer(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = CustomerService(db)
    return await svc.get_customer(customer_id)


@router.put("/{customer_id}", response_model=CustomerResponseSchema)
async def update_customer(
    customer_id: str,
    body: CustomerUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = CustomerService(db)
    return await svc.update_customer(customer_id, body)


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = CustomerService(db)
    await svc.delete_customer(customer_id)
