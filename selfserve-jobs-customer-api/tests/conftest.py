import os

# Must set env vars before any app imports so that get_settings() picks them up
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["ENVIRONMENT"] = "test"
os.environ["FRONTEND_URL"] = "http://localhost:3000"
os.environ["GCS_BUCKET_NAME"] = "test-bucket"
os.environ["RESEND_API_KEY"] = "test-key"

# Patch the database module before it is imported so that the module-level engine
# creation uses SQLite-compatible arguments.
from unittest.mock import patch, AsyncMock  # noqa: E402

import sqlalchemy.ext.asyncio as _sqla_async  # noqa: E402

_original_create = _sqla_async.create_async_engine


def _sqlite_safe_create_async_engine(url, **kwargs):
    """Drop PostgreSQL-only pool arguments when running against SQLite."""
    if str(url).startswith("sqlite"):
        kwargs.pop("pool_size", None)
        kwargs.pop("max_overflow", None)
        kwargs.pop("pool_pre_ping", None)
    return _original_create(url, **kwargs)


_sqla_async.create_async_engine = _sqlite_safe_create_async_engine  # type: ignore[assignment]

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.database import Base  # noqa: E402
from app.dependencies import get_session  # noqa: E402
from app.main import app  # noqa: E402

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session", autouse=True)
def clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine):
    session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest.fixture
async def client(db_session):
    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    with (
        patch("app.services.email_service.send_verification_email", new_callable=AsyncMock),
        patch("app.services.storage_service.upload_file", new_callable=AsyncMock),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as ac:
            yield ac

    app.dependency_overrides.clear()
