class AppError(Exception):
    pass


class NotFoundError(AppError):
    def __init__(self, resource: str, resource_id: str) -> None:
        self.resource = resource
        self.resource_id = resource_id
        super().__init__(f"{resource} {resource_id} not found")


class ConflictError(AppError):
    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


class UnauthorizedError(AppError):
    def __init__(self, detail: str = "Unauthorized") -> None:
        self.detail = detail
        super().__init__(detail)


class FileTooLargeError(AppError):
    def __init__(self, max_mb: int) -> None:
        self.max_mb = max_mb
        super().__init__(f"File exceeds {max_mb}MB limit")


class InvalidFileTypeError(AppError):
    def __init__(self, ext: str) -> None:
        self.ext = ext
        super().__init__(f"File type '{ext}' is not allowed")


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Forbidden") -> None:
        self.detail = detail
        super().__init__(detail)
