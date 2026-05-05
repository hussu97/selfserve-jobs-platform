"""add email_pending table

Revision ID: 0017
Revises: 0016
Create Date: 2026-05-05

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0017"
down_revision: str | None = "0016"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "email_pending",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("email_type", sa.VARCHAR(30), nullable=False),
        sa.Column("recipient_email", sa.VARCHAR(320), nullable=False),
        sa.Column("entity_type", sa.VARCHAR(10), nullable=True),
        sa.Column("entity_code", sa.VARCHAR(12), nullable=True),
        sa.Column("subject", sa.Text(), nullable=False),
        sa.Column("html_body", sa.Text(), nullable=False),
        sa.Column("text_body", sa.Text(), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_attempted_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_email_pending_email_type", "email_pending", ["email_type"])
    op.create_index("ix_email_pending_recipient_email", "email_pending", ["recipient_email"])
    op.create_index("ix_email_pending_entity_code", "email_pending", ["entity_code"])
    op.create_index("ix_email_pending_created_at", "email_pending", ["created_at"])


def downgrade() -> None:
    op.drop_table("email_pending")
