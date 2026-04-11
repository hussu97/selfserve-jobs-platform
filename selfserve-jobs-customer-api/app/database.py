import logging
import time

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# Query timeout: 30 s default for all statements (PostgreSQL only)
_CONNECT_ARGS: dict = {}
if "postgresql" in settings.database_url:
    _CONNECT_ARGS = {"server_settings": {"statement_timeout": "30000"}}

engine = create_async_engine(
    settings.database_url,
    echo=settings.is_development,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args=_CONNECT_ARGS,
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
