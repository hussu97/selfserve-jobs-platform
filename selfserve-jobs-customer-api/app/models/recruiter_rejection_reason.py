from datetime import datetime

from sqlalchemy import VARCHAR, BigInteger, Integer, func
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)
BIGINT_COMPAT = Integer().with_variant(BigInteger(), "postgresql")

from app.database import Base


class RecruiterRejectionReason(Base):
    __tablename__ = "recruiter_rejection_reason"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(VARCHAR(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(VARCHAR(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False, server_default=func.now())
