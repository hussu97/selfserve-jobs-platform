"""Add CHECK constraint limiting key_skills array to 30 items

Revision ID: 0008
Revises: 0007
Create Date: 2026-04-11

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    # PostgreSQL-only: CHECK constraints on JSONB array length.
    # Using json_array_length() which works for both JSON and JSONB columns.
    # The constraint is NOT VALID on existing rows (skips table scan) and only
    # enforces on new/updated rows going forward.
    op.execute(
        sa.text(
            "ALTER TABLE job ADD CONSTRAINT chk_job_key_skills_max_length "
            "CHECK (json_array_length(key_skills) <= 30) NOT VALID"
        )
    )
    op.execute(
        sa.text(
            "ALTER TABLE profile ADD CONSTRAINT chk_profile_key_skills_max_length "
            "CHECK (json_array_length(key_skills) <= 30) NOT VALID"
        )
    )


def downgrade() -> None:
    op.execute(sa.text("ALTER TABLE job DROP CONSTRAINT IF EXISTS chk_job_key_skills_max_length"))
    op.execute(sa.text("ALTER TABLE profile DROP CONSTRAINT IF EXISTS chk_profile_key_skills_max_length"))
