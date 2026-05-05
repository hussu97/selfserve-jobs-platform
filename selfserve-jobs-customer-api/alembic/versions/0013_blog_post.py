"""Add blog_post table

Revision ID: 0013
Revises: 0012
Create Date: 2026-05-05
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP as _PG_TIMESTAMP

from alembic import op

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)


def upgrade() -> None:
    op.create_table(
        "blog_post",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("post_code", sa.VARCHAR(12), nullable=False),
        sa.Column("title", sa.VARCHAR(500), nullable=False),
        sa.Column("slug", sa.VARCHAR(500), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("author", sa.VARCHAR(200), nullable=False),
        sa.Column("tags", JSONB(), nullable=False, server_default="[]"),
        sa.Column("status", sa.VARCHAR(20), nullable=False, server_default="draft"),
        sa.Column("featured_image_url", sa.VARCHAR(2048), nullable=True),
        sa.Column("reading_minutes", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("link_click_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("link_preview", JSONB(), nullable=True),
        sa.Column("created_at", TIMESTAMPTZ, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", TIMESTAMPTZ, nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_blog_post_post_code", "blog_post", ["post_code"], unique=True)
    op.create_index("ix_blog_post_slug", "blog_post", ["slug"], unique=True)
    op.create_index("ix_blog_post_status", "blog_post", ["status"])
    op.create_index("ix_blog_post_status_created_at", "blog_post", ["status", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_blog_post_status_created_at", table_name="blog_post")
    op.drop_index("ix_blog_post_status", table_name="blog_post")
    op.drop_index("ix_blog_post_slug", table_name="blog_post")
    op.drop_index("ix_blog_post_post_code", table_name="blog_post")
    op.drop_table("blog_post")
