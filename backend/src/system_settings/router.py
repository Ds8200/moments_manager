import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_db, require_sys_admin
from src.core.rate_limit import limiter
from src.system_settings.schemas import (
    MessageResponseSchema,
    SysAdminPasswordChangeSchema,
    SystemOpenAIUpdateSchema,
    SystemSettingsResponseSchema,
    SystemSmtpUpdateSchema,
)
from src.system_settings.service import SystemSettingsService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin/settings", tags=["system-settings"])


@router.get("", response_model=SystemSettingsResponseSchema)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_sys_admin),
) -> SystemSettingsResponseSchema:
    svc = SystemSettingsService(db)
    return await svc.get_settings()


@router.patch("/smtp", response_model=SystemSettingsResponseSchema)
async def update_smtp(
    body: SystemSmtpUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_sys_admin),
) -> SystemSettingsResponseSchema:
    svc = SystemSettingsService(db)
    return await svc.update_smtp(body)


@router.patch("/openai", response_model=SystemSettingsResponseSchema)
async def update_openai(
    body: SystemOpenAIUpdateSchema,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_sys_admin),
) -> SystemSettingsResponseSchema:
    svc = SystemSettingsService(db)
    return await svc.update_openai(body)


@router.patch("/password", response_model=MessageResponseSchema)
@limiter.limit("5/minute")
async def change_password(
    request: Request,
    body: SysAdminPasswordChangeSchema,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_sys_admin),
) -> MessageResponseSchema:
    svc = SystemSettingsService(db)
    return await svc.change_password(admin, body, background_tasks)
