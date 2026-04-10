"""add admin portal: rejection reasons table + recruiter rejection fields

Revision ID: 0005
Revises: 0004
Create Date: 2026-04-11

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SEED_REASONS = [
    ("incomplete_information", "Incomplete Information"),
    ("unverifiable_company", "Unverifiable Company"),
    ("duplicate_account", "Duplicate Account"),
    ("policy_violation", "Policy Violation"),
    ("fraudulent_activity", "Fraudulent Activity"),
    ("not_hiring_platform", "Not a Hiring Platform"),
    ("other", "Other"),
]


def upgrade() -> None:
    # Create recruiter_rejection_reason lookup table
    op.create_table(
        "recruiter_rejection_reason",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("code", sa.VARCHAR(50), nullable=False),
        sa.Column("name", sa.VARCHAR(200), nullable=False),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_recruiter_rejection_reason_code",
        "recruiter_rejection_reason",
        ["code"],
        unique=True,
    )

    # Seed default rejection reasons
    reason_table = sa.table(
        "recruiter_rejection_reason",
        sa.column("code", sa.VARCHAR),
        sa.column("name", sa.VARCHAR),
    )
    op.bulk_insert(reason_table, [{"code": code, "name": name} for code, name in SEED_REASONS])

    # Add rejection fields to recruiter table
    op.add_column("recruiter", sa.Column("rejection_reason_code", sa.VARCHAR(50), nullable=True))
    op.add_column("recruiter", sa.Column("rejection_comment", sa.Text(), nullable=True))
    op.add_column(
        "recruiter",
        sa.Column("reviewed_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("recruiter", "reviewed_at")
    op.drop_column("recruiter", "rejection_comment")
    op.drop_column("recruiter", "rejection_reason_code")
    op.drop_index("ix_recruiter_rejection_reason_code", table_name="recruiter_rejection_reason")
    op.drop_table("recruiter_rejection_reason")
