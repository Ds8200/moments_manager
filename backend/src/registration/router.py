import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_db
from src.core.rate_limit import limiter
from src.registration.schemas import RegistrationResponseSchema, RegistrationSchema
from src.registration.service import RegistrationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/register", tags=["registration"])


@router.post("", response_model=RegistrationResponseSchema, status_code=201)
@limiter.limit("3/hour")
async def register(
    request: Request,
    body: RegistrationSchema,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> RegistrationResponseSchema:
    svc = RegistrationService(db)
    return await svc.register(body, background_tasks)
