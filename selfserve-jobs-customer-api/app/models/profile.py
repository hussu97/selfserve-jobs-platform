from datetime import datetime

from sqlalchemy import (
    JSON,
    VARCHAR,
    BigInteger,
    Boolean,
    Index,
    Integer,
    SmallInteger,
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


class Profile(Base):
    __tablename__ = "profile"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    profile_code: Mapped[str] = mapped_column(VARCHAR(12), unique=True, nullable=False, index=True)
    # user_code references user_sensitive.user_code (no DB-level FK per project conventions)
    user_code: Mapped[str] = mapped_column(VARCHAR(12), nullable=False, index=True)
    person_name: Mapped[str] = mapped_column(VARCHAR(200), nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resume_gcs_path: Mapped[str | None] = mapped_column(VARCHAR(500), nullable=True)
    resume_original_filename: Mapped[str | None] = mapped_column(VARCHAR(255), nullable=True)
    brief: Mapped[str] = mapped_column(Text, nullable=False)
    current_city: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    current_country: Mapped[str] = mapped_column(VARCHAR(100), nullable=False, index=True)
    years_of_experience: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    current_title: Mapped[str] = mapped_column(VARCHAR(200), nullable=False)
    notice_period: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True)
    relocation_preference: Mapped[str] = mapped_column(VARCHAR(20), default="open", nullable=False)
    linkedin_profile_link: Mapped[str | None] = mapped_column(VARCHAR(500), nullable=True)
    key_skills: Mapped[list] = mapped_column(JSONB_COMPAT, default=list, nullable=False, server_default="[]")
    status: Mapped[str] = mapped_column(VARCHAR(20), default="pending_verification", nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    renewal_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False, server_default="0")
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False)
    edit_token: Mapped[str] = mapped_column(VARCHAR(64), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index("ix_profile_status_created_at", "status", "created_at"),
        Index("ix_profile_key_skills_gin", "key_skills", postgresql_using="gin"),
    )
