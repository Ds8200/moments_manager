import logging

from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import OrgContext, get_db, get_org_context
from src.core.rate_limit import limiter
from src.organizations.constants import ORG_INVITE_ACCEPTED
from src.organizations.schemas import (
    AcceptInviteSchema,
    InviteCreateSchema,
    InviteResponseSchema,
    MemberResponseSchema,
    OrgBrandingResponseSchema,
    OrgResponseSchema,
    OrgUpdateSchema,
    PublicBrandingSchema,
)
from src.organizations.service import OrgService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/orgs", tags=["organizations"])


@router.get("/branding/{slug}", response_model=PublicBrandingSchema)
async def get_org_branding(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> PublicBrandingSchema:
    """Public endpoint — no auth required. Returns org name, logo, and brand colors by slug."""
    svc = OrgService(db)
    return await svc.get_public_branding(slug)


@router.get("/me", response_model=OrgResponseSchema)
async def get_my_org(
    ctx: OrgContext = Depends(get_org_context),
    db: AsyncSession = Depends(get_db),
) -> OrgResponseSchema:
    svc = OrgService(db)
    return await svc.get_current_org(ctx.org_id)


@router.patch("/me", response_model=OrgResponseSchema)
async def update_my_org(
    body: OrgUpdateSchema,
    ctx: OrgContext = Depends(get_org_context),
    db: AsyncSession = Depends(get_db),
) -> OrgResponseSchema:
    svc = OrgService(db)
    return await svc.update_org(ctx.org_id, body)


@router.post("/me/logo", response_model=OrgBrandingResponseSchema, status_code=200)
async def upload_org_logo(
    file: UploadFile = File(...),
    ctx: OrgContext = Depends(get_org_context),
    db: AsyncSession = Depends(get_db),
) -> OrgBrandingResponseSchema:
    svc = OrgService(db)
    return await svc.upload_logo_and_extract_colors(ctx.org_id, file)


@router.get("/me/members", response_model=list[MemberResponseSchema])
async def list_members(
    ctx: OrgContext = Depends(get_org_context),
    db: AsyncSession = Depends(get_db),
) -> list[MemberResponseSchema]:
    svc = OrgService(db)
    return await svc.list_members(ctx.org_id)


@router.post("/me/invite", response_model=InviteResponseSchema, status_code=201)
@limiter.limit("10/minute")
async def invite_member(
    request,
    body: InviteCreateSchema,
    background_tasks: BackgroundTasks,
    ctx: OrgContext = Depends(get_org_context),
    db: AsyncSession = Depends(get_db),
) -> InviteResponseSchema:
    svc = OrgService(db)
    return await svc.invite_member(ctx.org_id, ctx.user.id, body, background_tasks)


@router.delete("/me/members/{user_id}", status_code=204, response_model=None)
async def remove_member(
    user_id: str,
    ctx: OrgContext = Depends(get_org_context),
    db: AsyncSession = Depends(get_db),
) -> None:
    svc = OrgService(db)
    await svc.remove_member(ctx.org_id, user_id, ctx.user.id)


@router.post("/accept-invite", status_code=200)
async def accept_invite(
    body: AcceptInviteSchema,
    db: AsyncSession = Depends(get_db),
) -> dict:
    svc = OrgService(db)
    org_id = await svc.accept_invite(body.token)
    return {"message": ORG_INVITE_ACCEPTED, "org_id": org_id}
