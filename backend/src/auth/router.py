import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.schemas import LoginSchema, RefreshSchema, TokenResponseSchema
from src.auth.service import AuthService
from src.core.dependencies import get_db
from src.core.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponseSchema)
@limiter.limit("5/minute")
async def login(request: Request, body: LoginSchema, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    return await svc.login(body.email, body.password)


@router.post("/refresh", response_model=TokenResponseSchema)
async def refresh(body: RefreshSchema, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    return await svc.refresh(body.refresh_token)


@router.post("/logout", status_code=204, response_model=None)
async def logout(body: RefreshSchema, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    await svc.logout(body.refresh_token)
