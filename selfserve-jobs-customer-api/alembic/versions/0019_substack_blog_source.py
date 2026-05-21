"""Add Substack source metadata to blog_post

Revision ID: 0019
Revises: 0018
Create Date: 2026-05-22
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP

from alembic import op

revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)


def upgrade() -> None:
    op.add_column("blog_post", sa.Column("source", sa.VARCHAR(40), nullable=False, server_default="internal"))
    op.add_column("blog_post", sa.Column("source_guid", sa.VARCHAR(1000), nullable=True))
    op.add_column("blog_post", sa.Column("external_url", sa.VARCHAR(2048), nullable=True))
    op.add_column("blog_post", sa.Column("published_at", TIMESTAMPTZ, nullable=True))
    op.add_column("blog_post", sa.Column("source_synced_at", TIMESTAMPTZ, nullable=True))
    op.execute("UPDATE blog_post SET published_at = created_at WHERE published_at IS NULL")
    op.alter_column("blog_post", "published_at", nullable=False, server_default=sa.func.now())
    op.create_index("ix_blog_post_status_published_at", "blog_post", ["status", "published_at"])
    op.create_index("ix_blog_post_source_guid", "blog_post", ["source", "source_guid"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_blog_post_source_guid", table_name="blog_post")
    op.drop_index("ix_blog_post_status_published_at", table_name="blog_post")
    op.drop_column("blog_post", "source_synced_at")
    op.drop_column("blog_post", "published_at")
    op.drop_column("blog_post", "external_url")
    op.drop_column("blog_post", "source_guid")
    op.drop_column("blog_post", "source")
