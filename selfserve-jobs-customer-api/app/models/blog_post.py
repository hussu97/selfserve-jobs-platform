from datetime import datetime

from sqlalchemy import (
    JSON,
    VARCHAR,
    BigInteger,
    Index,
    Integer,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)
JSONB_COMPAT = JSON().with_variant(JSONB(), "postgresql")
BIGINT_COMPAT = Integer().with_variant(BigInteger(), "postgresql")

from app.database import Base


class BlogPost(Base):
    __tablename__ = "blog_post"

    id: Mapped[int] = mapped_column(BIGINT_COMPAT, primary_key=True, autoincrement=True)
    post_code: Mapped[str] = mapped_column(VARCHAR(12), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(VARCHAR(500), nullable=False)
    slug: Mapped[str] = mapped_column(VARCHAR(500), unique=True, nullable=False, index=True)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str] = mapped_column(VARCHAR(200), nullable=False)
    tags: Mapped[list] = mapped_column(JSONB_COMPAT, default=list, nullable=False, server_default="[]")
    status: Mapped[str] = mapped_column(VARCHAR(20), default="draft", nullable=False, index=True)
    featured_image_url: Mapped[str | None] = mapped_column(VARCHAR(2048), nullable=True)
    reading_minutes: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    link_click_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Stored OG preview for the primary link in the post (url, title, description, image, domain)
    link_preview: Mapped[dict | None] = mapped_column(JSONB_COMPAT, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index("ix_blog_post_status_created_at", "status", "created_at"),
    )
