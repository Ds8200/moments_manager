from src.core.enums.error_codes import ErrorCode


class AppError(Exception):
    status_code: int = 500
    code: str = ErrorCode.INTERNAL_ERROR


class NotFoundError(AppError):
    status_code = 404
    code = ErrorCode.NOT_FOUND

    def __init__(self, resource: str, resource_id: str, code: str = ErrorCode.NOT_FOUND) -> None:
        self.resource = resource
        self.resource_id = resource_id
        self.code = code
        super().__init__(f"{resource} {resource_id} not found")


class ConflictError(AppError):
    status_code = 409
    code = ErrorCode.CONFLICT

    def __init__(self, detail: str, code: str = ErrorCode.CONFLICT) -> None:
        self.detail = detail
        self.code = code
        super().__init__(detail)


class UnauthorizedError(AppError):
    status_code = 401
    code = ErrorCode.UNAUTHORIZED

    def __init__(self, detail: str = "Unauthorized", code: str = ErrorCode.UNAUTHORIZED) -> None:
        self.detail = detail
        self.code = code
        super().__init__(detail)


class FileTooLargeError(AppError):
    status_code = 413
    code = ErrorCode.FILE_TOO_LARGE

    def __init__(self, max_mb: int) -> None:
        self.max_mb = max_mb
        super().__init__(f"File exceeds {max_mb}MB limit")


class InvalidFileTypeError(AppError):
    status_code = 422
    code = ErrorCode.INVALID_FILE_TYPE

    def __init__(self, ext: str) -> None:
        self.ext = ext
        super().__init__(f"File type '{ext}' is not allowed")


class ForbiddenError(AppError):
    status_code = 403
    code = ErrorCode.FORBIDDEN

    def __init__(self, detail: str = "Forbidden", code: str = ErrorCode.FORBIDDEN) -> None:
        self.detail = detail
        self.code = code
        super().__init__(detail)


class ServiceUnavailableError(AppError):
    status_code = 503
    code = ErrorCode.INTERNAL_ERROR

    def __init__(self, detail: str, code: str = ErrorCode.INTERNAL_ERROR) -> None:
        self.detail = detail
        self.code = code
        super().__init__(detail)
