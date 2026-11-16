from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class ApiError(Exception):
    def __init__(
        self,
        status: int,
        code: str,
        message: str,
        details: dict[str, object] | None = None,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.details = details


def api_error_response(request: Request, error: ApiError) -> JSONResponse:
    body: dict[str, object] = {"code": error.code, "message": str(error)}
    if error.details is not None:
        body["details"] = error.details
    return JSONResponse(body, status_code=error.status)


def validation_error_response(
    request: Request, error: RequestValidationError
) -> JSONResponse:
    fields = sorted(
        {str(item["loc"][1]) for item in error.errors() if len(item["loc"]) > 1}
    )
    return api_error_response(
        request,
        ApiError(
            422, "validation_error", "Check the request fields.", {"fields": fields}
        ),
    )
