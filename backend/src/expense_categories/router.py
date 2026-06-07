import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_db, get_org_context
from src.expense_categories.schemas import (
    ExpenseCategoryCreateSchema,
    ExpenseCategoryResponseSchema,
    ExpenseCategoryUpdateSchema,
)
from src.expense_categories.service import ExpenseCategoryService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/expense-categories", tags=["expense-categories"])


@router.get("", response_model=list[ExpenseCategoryResponseSchema])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ExpenseCategoryService(db, ctx.org_id)
    return await svc.list_categories()


@router.post("", response_model=ExpenseCategoryResponseSchema, status_code=201)
async def create_category(
    body: ExpenseCategoryCreateSchema,
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ExpenseCategoryService(db, ctx.org_id)
    return await svc.create_category(body)


@router.put("/{category_id}", response_model=ExpenseCategoryResponseSchema)
async def update_category(
    category_id: str,
    body: ExpenseCategoryUpdateSchema,
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ExpenseCategoryService(db, ctx.org_id)
    return await svc.update_category(category_id, body)


@router.delete("/{category_id}", status_code=204, response_model=None)
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ExpenseCategoryService(db, ctx.org_id)
    await svc.delete_category(category_id)
