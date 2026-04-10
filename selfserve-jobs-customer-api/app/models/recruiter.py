from datetime import datetime

from sqlalchemy import VARCHAR, BigInteger, Integer, Text, func
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)
BIGINT_COMPAT = Integer().with_variant(BigInteger(), "postgresql")

from app.database import Base


class Recruiter(Base):
    __tablename__ = "recruiter"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    recruiter_code: Mapped[str] = mapped_column(VARCHAR(12), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(VARCHAR(320), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(VARCHAR(200), nullable=False)
    linkedin_profile_url: Mapped[str] = mapped_column(VARCHAR(500), nullable=False)
    # Status flow: pending_verification → pending_approval → active | rejected | suspended
    status: Mapped[str] = mapped_column(VARCHAR(30), default="pending_verification", nullable=False)
    # Populated when status is set to 'rejected'
    rejection_reason_code: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True)
    rejection_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now(), onupdate=func.now()
    )
