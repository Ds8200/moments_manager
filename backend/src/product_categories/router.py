import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_current_user, get_db
from src.product_categories.schemas import (
    ProductCategoryCreateSchema,
    ProductCategoryResponseSchema,
    ProductCategoryUpdateSchema,
)
from src.product_categories.service import ProductCategoryService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/product-categories", tags=["product-categories"])


@router.get("", response_model=list[ProductCategoryResponseSchema])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = ProductCategoryService(db)
    return await svc.list_categories()


@router.post("", response_model=ProductCategoryResponseSchema, status_code=201)
async def create_category(
    body: ProductCategoryCreateSchema,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = ProductCategoryService(db)
    return await svc.create_category(body)


@router.put("/{category_id}", response_model=ProductCategoryResponseSchema)
async def update_category(
    category_id: str,
    body: ProductCategoryUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = ProductCategoryService(db)
    return await svc.update_category(category_id, body)


@router.delete("/{category_id}", status_code=204, response_model=None)
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    svc = ProductCategoryService(db)
    await svc.delete_category(category_id)
