import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_current_user, get_db, require_admin
from src.core.schemas import PaginatedResponse, PaginationParams
from src.system_settings.repository import SystemSettingsRepository
from src.users.schemas import UserCreateSchema, UserResponseSchema, UserUpdateMeSchema
from src.users.service import UserService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=UserResponseSchema)
async def get_me(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = UserService(db)
    return await svc.get_me(current_user)


@router.patch("/me", response_model=UserResponseSchema)
async def update_me(
    body: UserUpdateMeSchema,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sys_settings = await SystemSettingsRepository(db).get()
    svc = UserService(db)
    return await svc.update_me(current_user, body, background_tasks, sys_settings)


@router.get("", response_model=PaginatedResponse[UserResponseSchema])
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    svc = UserService(db)
    return await svc.list_users(PaginationParams(page=page, page_size=page_size))


@router.post("", response_model=UserResponseSchema, status_code=201)
async def create_user(
    body: UserCreateSchema,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    svc = UserService(db)
    return await svc.create_user(body, background_tasks, admin.org)


@router.delete("/{user_id}", status_code=204, response_model=None)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    svc = UserService(db)
    await svc.delete_user(user_id, admin.user.id)
