"""add recruiter table, salary fields on job, user_type on auth_session

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-10

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create recruiter table
    op.create_table(
        "recruiter",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("recruiter_code", sa.VARCHAR(12), nullable=False),
        sa.Column("email", sa.VARCHAR(320), nullable=False),
        sa.Column("name", sa.VARCHAR(200), nullable=False),
        sa.Column("linkedin_profile_url", sa.VARCHAR(500), nullable=False),
        sa.Column("status", sa.VARCHAR(30), nullable=False, server_default="pending_verification"),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_recruiter_recruiter_code", "recruiter", ["recruiter_code"], unique=True)
    op.create_index("ix_recruiter_email", "recruiter", ["email"], unique=True)

    # Add user_type and recruiter_code to auth_session
    op.add_column("auth_session", sa.Column("user_type", sa.VARCHAR(20), nullable=True))
    op.add_column("auth_session", sa.Column("recruiter_code", sa.VARCHAR(12), nullable=True))

    # Add salary fields and recruiter_code to job
    op.add_column("job", sa.Column("salary_min", sa.Integer(), nullable=True))
    op.add_column("job", sa.Column("salary_max", sa.Integer(), nullable=True))
    op.add_column("job", sa.Column("salary_currency", sa.VARCHAR(3), nullable=True))
    op.add_column("job", sa.Column("recruiter_code", sa.VARCHAR(12), nullable=True))


def downgrade() -> None:
    op.drop_column("job", "recruiter_code")
    op.drop_column("job", "salary_currency")
    op.drop_column("job", "salary_max")
    op.drop_column("job", "salary_min")
    op.drop_column("auth_session", "recruiter_code")
    op.drop_column("auth_session", "user_type")
    op.drop_index("ix_recruiter_email", table_name="recruiter")
    op.drop_index("ix_recruiter_recruiter_code", table_name="recruiter")
    op.drop_table("recruiter")
