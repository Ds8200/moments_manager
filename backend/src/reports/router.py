import logging

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_db, get_org_context
from src.reports.schemas import (
    DashboardKpiSchema,
    FinancialYearSchema,
    MonthlyReportSchema,
    TopCustomerSchema,
)
from src.reports.service import ReportService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/dashboard", response_model=DashboardKpiSchema)
async def dashboard_kpi(
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ReportService(db, ctx.org_id)
    return await svc.get_dashboard_kpi()


@router.get("/monthly", response_model=MonthlyReportSchema)
async def monthly_report(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ReportService(db, ctx.org_id)
    return await svc.get_monthly_report(year, month)


@router.get("/financial", response_model=FinancialYearSchema)
async def financial_year(
    year: int = Query(...),
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ReportService(db, ctx.org_id)
    return await svc.get_financial_year(year)


@router.get("/top-customers", response_model=list[TopCustomerSchema])
async def top_customers(
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
):
    svc = ReportService(db, ctx.org_id)
    return await svc.get_top_customers(limit)


@router.get("/export/excel", response_class=Response)
async def export_financial_excel(
    year: int = Query(...),
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
) -> Response:
    content = await ReportService(db, ctx.org_id).export_excel(year)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="reports-{year}.xlsx"'},
    )


@router.get("/export/pdf", response_class=Response)
async def export_financial_pdf(
    year: int = Query(...),
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
) -> Response:
    content = await ReportService(db, ctx.org_id).export_pdf(year)
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="reports-{year}.pdf"'},
    )
