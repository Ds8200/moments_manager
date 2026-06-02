import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_current_user, get_db
from src.core.schemas import PaginatedResponse, PaginationParams
from src.products.schemas import (
    ProductCreateSchema,
    ProductResponseSchema,
    ProductUpdateSchema,
)
from src.products.service import ProductService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/products", tags=["products"])


@router.get("", response_model=PaginatedResponse[ProductResponseSchema])
async def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = ProductService(db)
    return await svc.list_products(
        PaginationParams(page=page, page_size=page_size), search, category, is_active
    )


@router.post("", response_model=ProductResponseSchema, status_code=201)
async def create_product(
    body: ProductCreateSchema,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = ProductService(db)
    return await svc.create_product(body)


@router.get("/{product_id}", response_model=ProductResponseSchema)
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = ProductService(db)
    return await svc.get_product(product_id)


@router.put("/{product_id}", response_model=ProductResponseSchema)
async def update_product(
    product_id: str,
    body: ProductUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = ProductService(db)
    return await svc.update_product(product_id, body)


@router.delete("/{product_id}", status_code=204, response_model=None)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = ProductService(db)
    await svc.delete_product(product_id)
