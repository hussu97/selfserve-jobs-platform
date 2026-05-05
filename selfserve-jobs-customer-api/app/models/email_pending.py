from datetime import datetime

from sqlalchemy import VARCHAR, BigInteger, Integer, Text, func
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)
BIGINT_COMPAT = Integer().with_variant(BigInteger(), "postgresql")

from app.database import Base


class EmailPending(Base):
    """Queue of emails that failed delivery and are waiting to be retried."""

    __tablename__ = "email_pending"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    email_type: Mapped[str] = mapped_column(VARCHAR(30), nullable=False, index=True)
    recipient_email: Mapped[str] = mapped_column(VARCHAR(320), nullable=False, index=True)
    entity_type: Mapped[str | None] = mapped_column(VARCHAR(10), nullable=True)
    entity_code: Mapped[str | None] = mapped_column(VARCHAR(12), nullable=True, index=True)
    subject: Mapped[str] = mapped_column(Text, nullable=False)
    html_body: Mapped[str] = mapped_column(Text, nullable=False)
    text_body: Mapped[str] = mapped_column(Text, nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_attempted_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False, server_default=func.now())
