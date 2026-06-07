import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import ORG_ACTIVATED, ORG_DEACTIVATED, ORG_PLAN_UPDATED
from src.core.dependencies import get_db, require_sys_admin
from src.core.schemas import PaginatedResponse, PaginationParams
from src.super_admin.schemas import (
    OrgAdminResponseSchema,
    OrgCreateAdminSchema,
    OrgPlanUpdateSchema,
    OrgStatusUpdateSchema,
)
from src.super_admin.service import SuperAdminService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin", tags=["super-admin"])


@router.get("/orgs", response_model=PaginatedResponse[OrgAdminResponseSchema])
async def list_orgs(
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_sys_admin),
) -> PaginatedResponse[OrgAdminResponseSchema]:
    svc = SuperAdminService(db)
    items, total = await svc.list_orgs(pagination.page, pagination.page_size)
    pages = (total + pagination.page_size - 1) // pagination.page_size
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.post("/orgs", response_model=OrgAdminResponseSchema, status_code=201)
async def create_org(
    body: OrgCreateAdminSchema,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_sys_admin),
) -> OrgAdminResponseSchema:
    svc = SuperAdminService(db)
    return await svc.create_org(body)


@router.get("/orgs/{org_id}", response_model=OrgAdminResponseSchema)
async def get_org(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_sys_admin),
) -> OrgAdminResponseSchema:
    svc = SuperAdminService(db)
    return await svc.get_org(org_id)


@router.patch("/orgs/{org_id}/status", response_model=OrgAdminResponseSchema)
async def update_org_status(
    org_id: str,
    body: OrgStatusUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_sys_admin),
) -> OrgAdminResponseSchema:
    svc = SuperAdminService(db)
    result = await svc.toggle_status(org_id, body.is_active)
    msg = ORG_ACTIVATED if body.is_active else ORG_DEACTIVATED
    logger.info("%s: %s", msg, org_id)
    return result


@router.patch("/orgs/{org_id}/plan", response_model=OrgAdminResponseSchema)
async def update_org_plan(
    org_id: str,
    body: OrgPlanUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_sys_admin),
) -> OrgAdminResponseSchema:
    svc = SuperAdminService(db)
    result = await svc.update_plan(
        org_id, body.plan, body.max_users, body.trial_ends_at
    )
    logger.info("%s: %s → %s", ORG_PLAN_UPDATED, org_id, body.plan.value)
    return result
