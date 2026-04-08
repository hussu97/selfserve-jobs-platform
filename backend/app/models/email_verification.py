from datetime import datetime

from sqlalchemy import BigInteger, VARCHAR, func
from sqlalchemy.dialects.postgresql import TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EmailVerification(Base):
    __tablename__ = "email_verification"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    verification_code: Mapped[str] = mapped_column(VARCHAR(64), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(VARCHAR(320), nullable=False)
    entity_type: Mapped[str] = mapped_column(VARCHAR(10), nullable=False)
    entity_code: Mapped[str] = mapped_column(VARCHAR(12), nullable=False, index=True)
    verified_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now()
    )
