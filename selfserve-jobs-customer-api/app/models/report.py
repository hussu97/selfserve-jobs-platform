from datetime import datetime

from sqlalchemy import BigInteger, Text, VARCHAR, func
from sqlalchemy.dialects.postgresql import TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Report(Base):
    __tablename__ = "report"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    report_code: Mapped[str] = mapped_column(VARCHAR(12), unique=True, nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(VARCHAR(10), nullable=False)
    entity_code: Mapped[str] = mapped_column(VARCHAR(12), nullable=False, index=True)
    reporter_email: Mapped[str] = mapped_column(VARCHAR(320), nullable=False)
    reason: Mapped[str] = mapped_column(VARCHAR(50), nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(VARCHAR(20), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now(), onupdate=func.now()
    )
