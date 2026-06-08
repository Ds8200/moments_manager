import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import (
    ORG_ACTIVATED,
    ORG_DEACTIVATED,
    ORG_DELETED,
    ORG_OWNER_PASSWORD_RESET,
    ORG_PLAN_UPDATED,
)
from src.core.dependencies import get_db, require_sys_admin
from src.core.rate_limit import limiter
from src.core.schemas import PaginatedResponse, PaginationParams
from src.super_admin.email_service import SuperAdminEmailService
from src.super_admin.schemas import (
    AdminComposeEmailResponseSchema,
    AdminComposeEmailSchema,
    OrgActionResponseSchema,
    OrgAdminResponseSchema,
    OrgCreateAdminSchema,
    OrgOwnerEmailSchema,
    OrgPlanUpdateSchema,
    OrgStatusUpdateSchema,
)
from src.super_admin.service import SuperAdminService
from src.system_settings.repository import SystemSettingsRepository

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
    result = await svc.update_plan(org_id, body.plan, body.max_users, body.trial_ends_at)
    logger.info("%s: %s → %s", ORG_PLAN_UPDATED, org_id, body.plan.value)
    return result


@router.delete("/orgs/{org_id}", response_model=OrgActionResponseSchema)
async def delete_org(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_sys_admin),
) -> OrgActionResponseSchema:
    svc = SuperAdminService(db)
    await svc.delete_org(org_id)
    logger.info("%s: %s", ORG_DELETED, org_id)
    return OrgActionResponseSchema(message=ORG_DELETED)


@router.post(
    "/orgs/{org_id}/reset-password",
    response_model=OrgActionResponseSchema,
    status_code=202,
)
@limiter.limit("5/minute")
async def reset_org_owner_password(
    request: Request,
    org_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_sys_admin),
) -> OrgActionResponseSchema:
    sys_settings = await SystemSettingsRepository(db).get()
    svc = SuperAdminService(db)
    owner_email = await svc.reset_owner_password(org_id, background_tasks, sys_settings)
    logger.info("%s: org=%s owner=%s", ORG_OWNER_PASSWORD_RESET, org_id, owner_email)
    return OrgActionResponseSchema(message=ORG_OWNER_PASSWORD_RESET)


@router.get("/org-owners", response_model=list[OrgOwnerEmailSchema])
async def list_org_owners(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_sys_admin),
) -> list[OrgOwnerEmailSchema]:
    svc = SuperAdminEmailService(db)
    rows = await svc.list_org_owners()
    return [
        OrgOwnerEmailSchema(
            user_id=row.user_id,
            email=row.email,
            full_name=row.full_name,
            org_id=row.org_id,
            org_name=row.org_name,
        )
        for row in rows
    ]


@router.post("/email/compose", response_model=AdminComposeEmailResponseSchema, status_code=202)
@limiter.limit("10/minute")
async def compose_email(
    request: Request,
    body: AdminComposeEmailSchema,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_sys_admin),
) -> AdminComposeEmailResponseSchema:
    sys_settings = await SystemSettingsRepository(db).get()
    svc = SuperAdminEmailService(db)
    return await svc.compose_email(body, background_tasks, sys_settings)
