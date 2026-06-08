import logging

from fastapi import APIRouter, Cookie, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.constants import COOKIE_ACCESS_TOKEN, COOKIE_PATH_REFRESH, COOKIE_REFRESH_TOKEN
from src.auth.schemas import LoginSchema, MagicLoginSchema, TokenResponseSchema
from src.auth.service import AuthService, _TokenPair
from src.config import settings
from src.core.constants.http_messages import REFRESH_TOKEN_COOKIE_MISSING
from src.core.dependencies import get_db
from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import UnauthorizedError
from src.core.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _set_auth_cookies(response: Response, pair: _TokenPair) -> None:
    response.set_cookie(
        COOKIE_ACCESS_TOKEN,
        pair.access_token,
        httponly=False,
        samesite="lax",
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=settings.COOKIE_SECURE,
    )
    response.set_cookie(
        COOKIE_REFRESH_TOKEN,
        pair.raw_refresh,
        httponly=True,
        samesite="lax",
        path=COOKIE_PATH_REFRESH,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        secure=settings.COOKIE_SECURE,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(COOKIE_ACCESS_TOKEN, path="/")
    response.delete_cookie(COOKIE_REFRESH_TOKEN, path=COOKIE_PATH_REFRESH)


@router.post("/login", response_model=TokenResponseSchema)
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    body: LoginSchema,
    db: AsyncSession = Depends(get_db),
) -> TokenResponseSchema:
    svc = AuthService(db)
    pair = await svc.login(body.email, body.password)
    _set_auth_cookies(response, pair)
    return TokenResponseSchema(access_token=pair.access_token)


@router.post("/refresh", response_model=TokenResponseSchema)
async def refresh(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: str | None = Cookie(default=None),
) -> TokenResponseSchema:
    if not refresh_token:
        raise UnauthorizedError(
            REFRESH_TOKEN_COOKIE_MISSING, code=ErrorCode.REFRESH_TOKEN_INVALID
        )
    svc = AuthService(db)
    pair = await svc.refresh(refresh_token)
    _set_auth_cookies(response, pair)
    return TokenResponseSchema(access_token=pair.access_token)


@router.post("/magic-login", response_model=TokenResponseSchema)
@limiter.limit("10/minute")
async def magic_login(
    request: Request,
    response: Response,
    body: MagicLoginSchema,
    db: AsyncSession = Depends(get_db),
) -> TokenResponseSchema:
    svc = AuthService(db)
    pair = await svc.magic_login(body.token)
    _set_auth_cookies(response, pair)
    return TokenResponseSchema(access_token=pair.access_token)


@router.post("/logout", status_code=204, response_model=None)
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: str | None = Cookie(default=None),
) -> None:
    if refresh_token:
        svc = AuthService(db)
        await svc.logout(refresh_token)
    _clear_auth_cookies(response)
