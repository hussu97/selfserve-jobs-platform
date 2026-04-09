import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import auth, jobs, management, meta, profiles, reports, upload, verification

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle manager."""
    logger.info("Starting selfserve-jobs-customer-api (environment: %s)", settings.environment)

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
        logger.error("Failed to run Alembic. migrations: %s", exc)
        raise

    yield

    logger.info("Shutting down selfserve-jobs-customer-api")


app = FastAPI(
    title="selfserve-jobs-customer-api",
    description="Self-serve jobs platform API — post jobs and profiles without registration",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    redirect_slashes=False,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Edit-Token"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(profiles.router)
app.include_router(verification.router)
app.include_router(management.router)
app.include_router(upload.router)
app.include_router(reports.router)
app.include_router(meta.router)


@app.get("/api/v1/health", tags=["health"])
async def health_check():
    return JSONResponse(content={"status": "ok"})


@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse(content={"service": "selfserve-jobs-customer-api", "status": "running"})
