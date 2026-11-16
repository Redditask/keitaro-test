from typing import Annotated

import httpx
from fastapi import Depends, Request
from pydantic import TypeAdapter, ValidationError

from app.errors import ApiError


def _rejected_request(
    response: httpx.Response, payload: dict[str, object] | None
) -> ApiError:
    details: dict[str, object] = {"upstream_status": response.status_code}
    try:
        body = response.json()
    except ValueError:
        body = None

    if isinstance(body, dict):
        fields: list[str] = []
        for field in payload or {}:
            errors = body.get(field)
            if (
                isinstance(errors, list)
                and errors
                and all(isinstance(item, str) for item in errors)
            ):
                fields.append(field)
        if fields:
            details["fields"] = sorted(fields)

    return ApiError(422, "keitaro_rejected", "Keitaro rejected the request.", details)


class KeitaroClient:
    def __init__(self, http: httpx.Client) -> None:
        self.http = http

    def request[T](
        self,
        method: str,
        path: str,
        response_type: type[T],
        *,
        params: dict[str, str | int] | None = None,
        payload: dict[str, object] | None = None,
    ) -> T:
        try:
            response = self.http.request(method, path, params=params, json=payload)
        except httpx.RequestError:
            raise ApiError(
                502, "keitaro_unavailable", "Could not reach Keitaro."
            ) from None

        details: dict[str, object] = {"upstream_status": response.status_code}
        if response.status_code == 404:
            raise ApiError(
                404,
                "keitaro_not_found",
                "Keitaro could not find the resource.",
                details,
            )
        if response.status_code in (400, 406, 422):
            raise _rejected_request(response, payload)
        if not response.is_success:
            raise ApiError(
                502, "keitaro_error", "The request to Keitaro failed.", details
            )

        try:
            return TypeAdapter(response_type).validate_json(response.content)
        except ValidationError:
            raise ApiError(
                502,
                "keitaro_response_invalid",
                "Keitaro returned an invalid or incomplete response.",
                details,
            ) from None


def get_keitaro(request: Request) -> KeitaroClient:
    client: KeitaroClient | None = request.app.state.keitaro
    if client is None:
        raise ApiError(
            503, "keitaro_unavailable", "The Keitaro connection is not configured."
        )
    return client


Keitaro = Annotated[KeitaroClient, Depends(get_keitaro)]
