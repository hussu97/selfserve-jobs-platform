from datetime import datetime

from sqlalchemy import VARCHAR, BigInteger, Integer, func
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)
BIGINT_COMPAT = Integer().with_variant(BigInteger(), "postgresql")

from app.database import Base


class UserSensitive(Base):
    """Stores PII (email, phone) for self-serve users in one place.

    All other tables reference user_code instead of duplicating the email
    address. One row per unique email address — upserted on first create.
    """

    __tablename__ = "user_sensitive"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    user_code: Mapped[str] = mapped_column(VARCHAR(12), unique=True, nullable=False, index=True)
    user_email: Mapped[str] = mapped_column(VARCHAR(320), unique=True, nullable=False, index=True)
    # Phone is nullable — only required when posting a profile, not a job.
    user_phone: Mapped[str | None] = mapped_column(VARCHAR(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now(), onupdate=func.now()
    )
