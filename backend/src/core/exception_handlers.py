import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.config import settings
from src.core.constants.http_messages import INTERNAL_ERROR, VALIDATION_FAILED
from src.core.constants.log_messages import UNHANDLED_EXCEPTION
from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import (
    ConflictError,
    FileTooLargeError,
    ForbiddenError,
    InvalidFileTypeError,
    NotFoundError,
    ServiceUnavailableError,
    UnauthorizedError,
)

logger = logging.getLogger(__name__)


def _error_response(status_code: int, detail: str, code: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": detail, "code": code})


def _with_cors(response: JSONResponse, request: Request) -> JSONResponse:
    """Add CORS headers for known origins.

    The catch-all exception handler runs inside ServerErrorMiddleware, which is
    outside CORSMiddleware in the stack. This helper ensures error responses still
    reach the browser when the request comes from an allowed origin.
    """
    origin = request.headers.get("origin", "")
    if origin in settings.CORS_ORIGINS:
        response.headers["access-control-allow-origin"] = origin
        response.headers["access-control-allow-credentials"] = "true"
    return response


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
        return _error_response(404, str(exc), exc.code)

    @app.exception_handler(ConflictError)
    async def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
        return _error_response(409, exc.detail, exc.code)

    @app.exception_handler(UnauthorizedError)
    async def unauthorized_handler(request: Request, exc: UnauthorizedError) -> JSONResponse:
        return _error_response(401, exc.detail, exc.code)

    @app.exception_handler(FileTooLargeError)
    async def file_too_large_handler(request: Request, exc: FileTooLargeError) -> JSONResponse:
        return _error_response(413, str(exc), exc.code)

    @app.exception_handler(ForbiddenError)
    async def forbidden_handler(request: Request, exc: ForbiddenError) -> JSONResponse:
        return _error_response(403, exc.detail, exc.code)

    @app.exception_handler(ServiceUnavailableError)
    async def service_unavailable_handler(
        request: Request, exc: ServiceUnavailableError
    ) -> JSONResponse:
        return _error_response(503, exc.detail, exc.code)

    @app.exception_handler(InvalidFileTypeError)
    async def invalid_file_type_handler(
        request: Request, exc: InvalidFileTypeError
    ) -> JSONResponse:
        return _error_response(422, str(exc), exc.code)

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        return _error_response(422, VALIDATION_FAILED, ErrorCode.VALIDATION_ERROR)

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _error_response(exc.status_code, str(exc.detail), ErrorCode.INTERNAL_ERROR)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(UNHANDLED_EXCEPTION, request.method, request.url.path, exc)
        return _with_cors(_error_response(500, INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR), request)
