"""Add admin_audit_log table

Revision ID: 0007
Revises: 0006
Create Date: 2026-04-11

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "admin_audit_log",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("admin_email", sa.VARCHAR(320), nullable=False),
        sa.Column("action", sa.VARCHAR(100), nullable=False),
        sa.Column("entity_type", sa.VARCHAR(20), nullable=True),
        sa.Column("entity_code", sa.VARCHAR(12), nullable=True),
        sa.Column("details_json", JSON(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_audit_log_admin_email", "admin_audit_log", ["admin_email"])
    op.create_index("ix_admin_audit_log_entity_code", "admin_audit_log", ["entity_code"])


def downgrade() -> None:
    op.drop_index("ix_admin_audit_log_entity_code", table_name="admin_audit_log")
    op.drop_index("ix_admin_audit_log_admin_email", table_name="admin_audit_log")
    op.drop_table("admin_audit_log")
