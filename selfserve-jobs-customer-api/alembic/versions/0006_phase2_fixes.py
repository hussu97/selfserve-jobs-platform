"""Phase 2 fixes: unique constraint on report, last_active_at on auth_session, DB indexes

Revision ID: 0006
Revises: 0005
Create Date: 2026-04-11

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # --- report: unique constraint to prevent duplicate reports (fixes race condition) ---
    op.create_unique_constraint(
        "uq_report_entity_reporter",
        "report",
        ["entity_type", "entity_code", "reporter_email"],
    )

    # --- auth_session: add last_active_at for activity tracking ---
    op.add_column("auth_session", sa.Column("last_active_at", sa.TIMESTAMP(timezone=True), nullable=True))

    # --- Phase 3 DB indexes for performance ---

    # email index on job and profile (used in rate limiting, management links, verification)
    op.create_index("ix_job_email", "job", ["email"])
    op.create_index("ix_profile_email", "profile", ["email"])

    # compound (status, expires_at) for expiry cron
    op.create_index("ix_job_status_expires_at", "job", ["status", "expires_at"])
    op.create_index("ix_profile_status_expires_at", "profile", ["status", "expires_at"])

    # compound (entity_type, entity_code) on email_verification for verification lookups
    op.create_index(
        "ix_email_verification_entity",
        "email_verification",
        ["entity_type", "entity_code"],
    )

    # compound (email, status) on job/profile for active listing count checks
    op.create_index("ix_job_email_status", "job", ["email", "status"])
    op.create_index("ix_profile_email_status", "profile", ["email", "status"])


def downgrade() -> None:
    op.drop_index("ix_profile_email_status", table_name="profile")
    op.drop_index("ix_job_email_status", table_name="job")
    op.drop_index("ix_email_verification_entity", table_name="email_verification")
    op.drop_index("ix_profile_status_expires_at", table_name="profile")
    op.drop_index("ix_job_status_expires_at", table_name="job")
    op.drop_index("ix_profile_email", table_name="profile")
    op.drop_index("ix_job_email", table_name="job")
    op.drop_column("auth_session", "last_active_at")
    op.drop_constraint("uq_report_entity_reporter", "report", type_="unique")
