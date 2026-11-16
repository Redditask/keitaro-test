from collections.abc import AsyncIterator
from contextlib import ExitStack, asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from app.campaigns.router import router as campaign_routes
from app.database import database_engine
from app.editor.router import router as editor_routes
from app.errors import ApiError, api_error_response, validation_error_response
from app.keitaro.client import KeitaroClient
from app.settings import Settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.database = None
        app.state.keitaro = None
        with ExitStack() as resources:
            if settings.database_url:
                engine = database_engine(settings.database_url.get_secret_value())
                app.state.database = engine
                resources.callback(engine.dispose)
            if settings.keitaro_base_url and settings.keitaro_api_key:
                http = resources.enter_context(
                    httpx.Client(
                        base_url=str(settings.keitaro_base_url),
                        headers={
                            "Api-Key": settings.keitaro_api_key.get_secret_value()
                        },
                        timeout=settings.keitaro_timeout,
                    )
                )
                app.state.keitaro = KeitaroClient(http)
            yield

    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.add_exception_handler(ApiError, api_error_response)
    app.add_exception_handler(RequestValidationError, validation_error_response)
    app.include_router(campaign_routes)
    app.include_router(editor_routes)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
