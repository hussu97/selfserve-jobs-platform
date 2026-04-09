"""add email_log table

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-10

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "email_log",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("email_type", sa.VARCHAR(30), nullable=False),
        sa.Column("recipient_email", sa.VARCHAR(320), nullable=False),
        sa.Column("entity_type", sa.VARCHAR(10), nullable=True),
        sa.Column("entity_code", sa.VARCHAR(12), nullable=True),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("resend_id", sa.VARCHAR(255), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_email_log_email_type", "email_log", ["email_type"])
    op.create_index("ix_email_log_recipient_email", "email_log", ["recipient_email"])
    op.create_index("ix_email_log_entity_code", "email_log", ["entity_code"])


def downgrade() -> None:
    op.drop_table("email_log")
