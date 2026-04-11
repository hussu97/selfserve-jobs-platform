from datetime import datetime

from sqlalchemy import VARCHAR, BigInteger, Integer, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)
BIGINT_COMPAT = Integer().with_variant(BigInteger(), "postgresql")

from app.database import Base


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_log"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    admin_email: Mapped[str] = mapped_column(VARCHAR(320), nullable=False, index=True)
    action: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(VARCHAR(20), nullable=True)
    entity_code: Mapped[str | None] = mapped_column(VARCHAR(12), nullable=True, index=True)
    details_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False, server_default=func.now())
