from datetime import datetime

from sqlalchemy import BigInteger, Integer, VARCHAR, func
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

# TIMESTAMPTZ is TIMESTAMP with timezone=True — SQLAlchemy 2.x removed the TIMESTAMPTZ alias
TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)
# BIGINT_COMPAT uses INTEGER (SQLite-compatible autoincrement) with BIGINT variant for PostgreSQL
BIGINT_COMPAT = Integer().with_variant(BigInteger(), "postgresql")

from app.database import Base


class EmailVerification(Base):
    __tablename__ = "email_verification"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    verification_code: Mapped[str] = mapped_column(VARCHAR(64), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(VARCHAR(320), nullable=False)
    entity_type: Mapped[str] = mapped_column(VARCHAR(10), nullable=False)
    entity_code: Mapped[str] = mapped_column(VARCHAR(12), nullable=False, index=True)
    verified_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now()
    )
