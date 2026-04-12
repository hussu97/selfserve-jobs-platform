import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pythonjsonlogger.json import JsonFormatter as _JsonFormatter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.limiter import limiter
from app.routers import (
    admin,
    auth,
    internal,
    jobs,
    management,
    meta,
    profiles,
    recruiters,
    reports,
    upload,
    verification,
)

settings = get_settings()


def _configure_logging() -> None:
    """Set up structured JSON logging for production, plain text for development."""
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    if root_logger.handlers:
        root_logger.handlers.clear()

    handler = logging.StreamHandler()
    if settings.log_format == "json":
        formatter = _JsonFormatter(
            fmt="%(asctime)s %(name)s %(levelname)s %(message)s",
            rename_fields={"asctime": "timestamp", "levelname": "level", "name": "logger"},
        )
    else:
        formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)


_configure_logging()
logger = logging.getLogger(__name__)


def _configure_sentry() -> None:
    if not settings.sentry_dsn:
        return
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.environment,
            integrations=[FastApiIntegration(), SqlalchemyIntegration()],
            traces_sample_rate=0.1,
        )
        logger.info("Sentry error tracking initialised")
    except Exception as exc:
        logger.warning("Failed to initialise Sentry: %s", exc)


_configure_sentry()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle manager."""
    logger.info("Starting selfserve-jobs-customer-api", extra={"environment": settings.environment})

    logger.info("Running Alembic migrations...")
    try:
        import asyncio
        import os

        from alembic.config import Config

        from alembic import command

        _api_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        alembic_cfg = Config(os.path.join(_api_root, "alembic.ini"))
        alembic_cfg.set_main_option("script_location", os.path.join(_api_root, "alembic"))
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: command.upgrade(alembic_cfg, "head"))
        logger.info("Alembic migrations completed successfully")
    except Exception as exc:
        logger.error("Failed to run Alembic migrations: %s", exc)
        raise

    yield

    logger.info("Shutting down selfserve-jobs-customer-api")
    try:
        from app.database import engine as _engine

        await _engine.dispose()
        logger.info("DB connection pool disposed cleanly")
    except Exception as exc:
        logger.warning("Error disposing DB engine on shutdown: %s", exc)


app = FastAPI(
    title="selfserve-jobs-customer-api",
    description=(
        "Self-serve jobs platform API — post jobs and profiles without registration.\n\n"
        "## Authentication\n\n"
        "**Edit-token endpoints** (update/delete/renew a listing) require the `X-Edit-Token` header "
        "containing the 64-char token returned on creation and emailed to the owner.\n\n"
        "**Admin / recruiter endpoints** require a `Bearer <session-token>` `Authorization` header "
        "obtained by exchanging a magic-link login token.\n\n"
        "## Rate Limits\n\n"
        "- `POST /jobs`, `POST /profiles`: 10 requests / hour / IP\n"
        "- `POST /verify`: 5 requests / minute / IP\n"
        "- `POST /verify/resend`: 3 requests / day / IP\n"
        "- `POST /reports`: 10 requests / hour / IP\n\n"
        "Exceeding a limit returns HTTP `429 Too Many Requests`."
    ),
    version="1.0.0",
    lifespan=lifespan,
    # Disable interactive API docs in production to reduce attack surface
    docs_url=None if settings.is_production else "/api/docs",
    redoc_url=None if settings.is_production else "/api/redoc",
    openapi_url=None if settings.is_production else "/api/openapi.json",
    redirect_slashes=False,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def _custom_openapi() -> dict:
    """Enrich the auto-generated OpenAPI spec with security schemes, 429 responses, and examples."""
    if app.openapi_schema:
        return app.openapi_schema

    from fastapi.openapi.utils import get_openapi

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # --- Security schemes ---
    schema.setdefault("components", {}).setdefault("securitySchemes", {})
    schema["components"]["securitySchemes"]["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Session token obtained via magic-link login. Required for admin and recruiter endpoints.",
    }
    schema["components"]["securitySchemes"]["EditToken"] = {
        "type": "apiKey",
        "in": "header",
        "name": "X-Edit-Token",
        "description": "64-char edit token included in the creation response and management email.",
    }

    # --- Add 429 response to all POST/PUT/DELETE paths ---
    _429_response = {
        "description": "Rate limit exceeded",
        "content": {
            "application/json": {
                "schema": {"type": "object", "properties": {"error": {"type": "string"}}},
                "example": {"error": "Rate limit exceeded: 10 per 1 hour"},
            }
        },
    }
    for path_item in schema.get("paths", {}).values():
        for method in ("post", "put", "delete"):
            operation = path_item.get(method)
            if operation:
                operation.setdefault("responses", {})["429"] = _429_response

    app.openapi_schema = schema
    return schema


app.openapi = _custom_openapi  # type: ignore[method-assign]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Session-Token", "X-Edit-Token"],
    expose_headers=["X-Edit-Token", "X-Request-Id"],
)

# Cache-Control middleware — improves CDN + browser caching for SEO crawlability
_CACHE_RULES = [
    ("/api/v1/countries", "public, s-maxage=86400, stale-while-revalidate=604800"),
    ("/api/v1/skills", "public, s-maxage=86400, stale-while-revalidate=604800"),
    ("/api/v1/stats", "public, s-maxage=60, stale-while-revalidate=120"),
    ("/api/v1/jobs/", "public, s-maxage=300, stale-while-revalidate=600"),
    ("/api/v1/jobs", "public, s-maxage=120, stale-while-revalidate=300"),
    ("/api/v1/profiles/", "public, s-maxage=300, stale-while-revalidate=600"),
    ("/api/v1/profiles", "public, s-maxage=120, stale-while-revalidate=300"),
]

_NO_CACHE_METHODS = {"POST", "PUT", "DELETE", "PATCH"}

_MAX_BODY_SIZE = 10 * 1024 * 1024  # 10 MB


@app.middleware("http")
async def request_id_middleware(request: Request, call_next) -> Response:
    """Attach a unique X-Request-Id to every request for log correlation."""
    request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    # Stash on request state so handlers can reference it
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    return response


@app.middleware("http")
async def limit_request_body_size(request: Request, call_next) -> Response:
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > _MAX_BODY_SIZE:
        return JSONResponse(
            status_code=413,
            content={"detail": "Request body too large. Maximum allowed size is 10 MB."},
        )
    return await call_next(request)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'none'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    return response


@app.middleware("http")
async def cache_control_middleware(request: Request, call_next) -> Response:
    response = await call_next(request)
    if request.method in _NO_CACHE_METHODS:
        return response
    path = request.url.path
    for prefix, header in _CACHE_RULES:
        if path.startswith(prefix):
            response.headers["Cache-Control"] = header
            break
    return response


# Include all routers
app.include_router(auth.router)
app.include_router(internal.router)
app.include_router(recruiters.router)
app.include_router(admin.router)
app.include_router(jobs.router)
app.include_router(profiles.router)
app.include_router(verification.router)
app.include_router(management.router)
app.include_router(upload.router)
app.include_router(reports.router)
app.include_router(meta.router)


@app.get("/api/v1/health", tags=["health"])
async def health_check():
    """Health check endpoint. Returns 200 if the DB is reachable, 503 otherwise."""
    from sqlalchemy import text

    from app.database import async_session_factory

    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        return JSONResponse(content={"status": "ok", "db": "ok"})
    except Exception as exc:
        logger.error("Health check DB probe failed: %s", exc)
        return JSONResponse(status_code=503, content={"status": "degraded", "db": "unreachable"})


@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse(content={"service": "selfserve-jobs-customer-api", "status": "running"})
