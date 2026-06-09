import logging
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_db, get_org_context
from src.core.schemas import PaginatedResponse, PaginationParams
from src.expenses.schemas import (
    ExpenseCreateSchema,
    ExpenseResponseSchema,
    ExpenseUpdateSchema,
)
from src.expenses.service import ExpenseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


@router.get("", response_model=PaginatedResponse[ExpenseResponseSchema])
async def list_expenses(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    category_id: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ExpenseService(db, ctx.org_id)
    return await svc.list_expenses(
        PaginationParams(page=page, page_size=page_size), date_from, date_to, category_id
    )


@router.post("", response_model=ExpenseResponseSchema, status_code=201)
async def create_expense(
    body: ExpenseCreateSchema,
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ExpenseService(db, ctx.org_id)
    return await svc.create_expense(body)


@router.get("/{expense_id}", response_model=ExpenseResponseSchema)
async def get_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ExpenseService(db, ctx.org_id)
    return await svc.get_expense(expense_id)


@router.put("/{expense_id}", response_model=ExpenseResponseSchema)
async def update_expense(
    expense_id: str,
    body: ExpenseUpdateSchema,
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ExpenseService(db, ctx.org_id)
    return await svc.update_expense(expense_id, body)


@router.delete("/{expense_id}", status_code=204, response_model=None)
async def delete_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ExpenseService(db, ctx.org_id)
    await svc.delete_expense(expense_id)
