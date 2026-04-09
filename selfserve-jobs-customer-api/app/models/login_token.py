from datetime import datetime

from sqlalchemy import VARCHAR, BigInteger, Boolean, Integer, func
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)
BIGINT_COMPAT = Integer().with_variant(BigInteger(), "postgresql")

from app.database import Base


class LoginToken(Base):
    __tablename__ = "login_token"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    token: Mapped[str] = mapped_column(VARCHAR(64), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(VARCHAR(320), nullable=False, index=True)
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False, server_default=func.now())
