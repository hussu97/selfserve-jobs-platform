from datetime import datetime

from sqlalchemy import VARCHAR, BigInteger, Integer, func
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)
BIGINT_COMPAT = Integer().with_variant(BigInteger(), "postgresql")

from app.database import Base


class AuthSession(Base):
    __tablename__ = "auth_session"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    session_token: Mapped[str] = mapped_column(VARCHAR(64), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(VARCHAR(320), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False, server_default=func.now())
