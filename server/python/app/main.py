"""
FastAPI Application Entrypoint
Internal Vision Service for VinhPhatERP.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
from app.routes.health import router as health_router
from app.routes.vision import router as vision_router
from vision.config import settings
from vision.exceptions import VisionEngineException
from vision.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Microservice lifecycle manager."""
    logger.info(
        "vision_service_starting",
        host=settings.host,
        port=settings.port,
        model=settings.gemini_model,
        max_image_size_mb=settings.max_image_size_mb,
    )
    yield
    logger.info("vision_service_shutting_down")


def create_app() -> FastAPI:
    """Application factory for VinhPhatERP Vision Microservice."""
    app = FastAPI(
        title="VinhPhatERP Vision Service",
        description="Internal AI-powered document intelligence microservice for yarn slip extraction and mathematical audit.",
        version="1.0.0",
        docs_url="/docs" if settings.log_level.upper() == "DEBUG" else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    # --------------------------------------------------------------------------
    # Middlewares
    # --------------------------------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def correlation_id_middleware(request: Request, call_next):
        """Ensures X-Correlation-ID header is propagated in responses."""
        correlation_id = request.headers.get("X-Correlation-ID")
        if correlation_id:
            structlog.contextvars.bind_contextvars(correlation_id=correlation_id)

        response = await call_next(request)

        # Retrieve bound correlation_id if any, or reuse header
        bound_vars = structlog.contextvars.get_contextvars()
        active_corr_id = bound_vars.get("correlation_id", correlation_id)
        if active_corr_id:
            response.headers["X-Correlation-ID"] = active_corr_id

        return response

    # --------------------------------------------------------------------------
    # Exception Handlers
    # --------------------------------------------------------------------------
    @app.exception_handler(VisionEngineException)
    async def vision_engine_exception_handler(
        request: Request, exc: VisionEngineException
    ) -> JSONResponse:
        """Domain exception handler mapping domain errors to appropriate HTTP statuses."""
        logger.warning(
            "vision_engine_domain_exception",
            exception_type=exc.__class__.__name__,
            status_code=exc.http_status_code,
            message=exc.message,
            path=request.url.path,
        )
        return JSONResponse(
            status_code=exc.http_status_code,
            content={
                "error": exc.__class__.__name__,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """Fallback exception handler for unhandled errors."""
        logger.exception("unhandled_server_exception", error=str(exc), path=request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "InternalServerError",
                "message": "An unexpected server error occurred during document processing.",
                "details": {},
            },
        )

    # --------------------------------------------------------------------------
    # Route Registration
    # --------------------------------------------------------------------------
    app.include_router(health_router)
    app.include_router(vision_router)

    return app


app = create_app()
