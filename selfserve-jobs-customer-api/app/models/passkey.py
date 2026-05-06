from datetime import datetime

from sqlalchemy import VARCHAR, BigInteger, Integer, LargeBinary, func
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)
BIGINT_COMPAT = Integer().with_variant(BigInteger(), "postgresql")

from app.database import Base


class Passkey(Base):
    __tablename__ = "passkey"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    credential_id: Mapped[bytes] = mapped_column(LargeBinary, unique=True, nullable=False)
    public_key: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    sign_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    aaguid: Mapped[str | None] = mapped_column(VARCHAR(36), nullable=True)
    user_email: Mapped[str] = mapped_column(VARCHAR(320), nullable=False, index=True)
    label: Mapped[str | None] = mapped_column(VARCHAR(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False, server_default=func.now())


class WebAuthnChallenge(Base):
    __tablename__ = "webauthn_challenge"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    session_key: Mapped[str] = mapped_column(VARCHAR(64), unique=True, nullable=False, index=True)
    challenge: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False)
