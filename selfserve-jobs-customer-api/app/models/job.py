from datetime import datetime

from sqlalchemy import (
    JSON,
    VARCHAR,
    BigInteger,
    Boolean,
    Date,
    Index,
    Integer,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

# TIMESTAMPTZ is TIMESTAMP with timezone=True — SQLAlchemy 2.x removed the TIMESTAMPTZ alias
TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)
# JSONB_COMPAT falls back to JSON when used with non-PostgreSQL engines (e.g. SQLite in tests)
JSONB_COMPAT = JSON().with_variant(JSONB(), "postgresql")
# BIGINT_COMPAT uses INTEGER (SQLite-compatible autoincrement) with BIGINT variant for PostgreSQL
BIGINT_COMPAT = Integer().with_variant(BigInteger(), "postgresql")

from app.database import Base


class Job(Base):
    __tablename__ = "job"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    job_code: Mapped[str] = mapped_column(VARCHAR(12), unique=True, nullable=False, index=True)
    # user_code references user_sensitive.user_code (no DB-level FK per project conventions)
    user_code: Mapped[str] = mapped_column(VARCHAR(12), nullable=False, index=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    job_title: Mapped[str] = mapped_column(VARCHAR(200), nullable=False)
    company_name: Mapped[str] = mapped_column(VARCHAR(200), nullable=False)
    company_city: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    company_country: Mapped[str] = mapped_column(VARCHAR(100), nullable=False, index=True)
    employment_type: Mapped[str] = mapped_column(VARCHAR(20), nullable=False, index=True)
    deadline_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    key_skills: Mapped[list] = mapped_column(JSONB_COMPAT, default=list, nullable=False, server_default="[]")
    contact_method: Mapped[str] = mapped_column(VARCHAR(10), nullable=False)
    contact_email: Mapped[str | None] = mapped_column(VARCHAR(320), nullable=True)
    contact_url: Mapped[str | None] = mapped_column(VARCHAR(2048), nullable=True)
    status: Mapped[str] = mapped_column(VARCHAR(20), default="pending_verification", nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    renewal_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False, server_default="0")
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False)
    # Salary range (optional)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_currency: Mapped[str | None] = mapped_column(VARCHAR(3), nullable=True)
    # Recruiter who posted this (null for legacy jobs)
    recruiter_code: Mapped[str | None] = mapped_column(VARCHAR(12), nullable=True)
    edit_token: Mapped[str] = mapped_column(VARCHAR(64), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index("ix_job_status_created_at", "status", "created_at"),
        Index("ix_job_key_skills_gin", "key_skills", postgresql_using="gin"),
    )
