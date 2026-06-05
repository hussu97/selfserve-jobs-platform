import logging
import time

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


def _is_postgresql_url(database_url: str) -> bool:
    return database_url.startswith(("postgresql://", "postgresql+", "postgres://"))


def _build_connect_args(database_url: str) -> dict:
    # Query timeout: 30 s default for all statements (PostgreSQL only)
    if _is_postgresql_url(database_url):
        return {"server_settings": {"statement_timeout": "30000"}}
    return {}


def _build_engine_options() -> dict:
    options = {
        "echo": settings.is_development,
        "connect_args": _build_connect_args(settings.database_url),
    }
    if _is_postgresql_url(settings.database_url):
        options.update(
            pool_pre_ping=True,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
            pool_timeout=settings.database_pool_timeout_seconds,
            pool_recycle=settings.database_pool_recycle_seconds,
            pool_use_lifo=True,
        )
    return options


engine = create_async_engine(
    settings.database_url,
    **_build_engine_options(),
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Backwards-compatible alias
AsyncSessionLocal = async_session_factory

_SLOW_QUERY_MS = 500  # log queries that take longer than this


@event.listens_for(engine.sync_engine, "before_cursor_execute")
def _before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault("query_start_time", []).append(time.monotonic())


@event.listens_for(engine.sync_engine, "after_cursor_execute")
def _after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    start_times = conn.info.get("query_start_time")
    if start_times:
        elapsed_ms = (time.monotonic() - start_times.pop()) * 1000
        if elapsed_ms >= _SLOW_QUERY_MS:
            logger.warning(
                "Slow query detected",
                extra={"elapsed_ms": round(elapsed_ms, 1), "statement": statement[:200]},
            )


@event.listens_for(engine.sync_engine, "connect")
def _on_connect(dbapi_connection, connection_record):
    logger.debug("DB connection pool: new connection opened")


@event.listens_for(engine.sync_engine, "checkin")
def _on_checkin(dbapi_connection, connection_record):
    logger.debug("DB connection pool: connection returned")


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception as exc:
            logger.error("DB session error, rolling back: %s", exc)
            await session.rollback()
            raise
        finally:
            await session.close()
