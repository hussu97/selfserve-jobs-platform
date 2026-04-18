"""Add current_employment_status to profile and last_renewed_at to job/profile

Revision ID: 0012
Revises: 0011
Create Date: 2026-04-18
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP as _PG_TIMESTAMP

from alembic import op

revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None

TIMESTAMPTZ = _PG_TIMESTAMP(timezone=True)


def upgrade() -> None:
    # profile: add current_employment_status (non-nullable, default full_time)
    op.add_column(
        "profile",
        sa.Column(
            "current_employment_status",
            sa.VARCHAR(20),
            nullable=False,
            server_default="full_time",
        ),
    )

    # profile: add last_renewed_at — backfill from created_at, then enforce NOT NULL
    op.add_column("profile", sa.Column("last_renewed_at", TIMESTAMPTZ, nullable=True))
    op.execute("UPDATE profile SET last_renewed_at = created_at")
    op.alter_column("profile", "last_renewed_at", nullable=False)

    # job: add last_renewed_at — backfill from created_at, then enforce NOT NULL
    op.add_column("job", sa.Column("last_renewed_at", TIMESTAMPTZ, nullable=True))
    op.execute("UPDATE job SET last_renewed_at = created_at")
    op.alter_column("job", "last_renewed_at", nullable=False)

    # indexes for sorted queries
    op.create_index(
        "ix_profile_status_employment_sort",
        "profile",
        ["status", "current_employment_status", "last_renewed_at"],
    )
    op.create_index(
        "ix_job_status_last_renewed",
        "job",
        ["status", "last_renewed_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_job_status_last_renewed", table_name="job")
    op.drop_index("ix_profile_status_employment_sort", table_name="profile")
    op.drop_column("job", "last_renewed_at")
    op.drop_column("profile", "last_renewed_at")
    op.drop_column("profile", "current_employment_status")
