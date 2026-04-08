"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-04-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "job",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("job_code", sa.VARCHAR(12), nullable=False),
        sa.Column("email", sa.VARCHAR(320), nullable=False),
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("job_title", sa.VARCHAR(200), nullable=False),
        sa.Column("company_name", sa.VARCHAR(200), nullable=False),
        sa.Column("company_city", sa.VARCHAR(100), nullable=False),
        sa.Column("company_country", sa.VARCHAR(100), nullable=False),
        sa.Column("employment_type", sa.VARCHAR(20), nullable=False),
        sa.Column("deadline_date", sa.Date(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("key_skills", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("contact_method", sa.VARCHAR(10), nullable=False),
        sa.Column("contact_email", sa.VARCHAR(320), nullable=True),
        sa.Column("contact_url", sa.VARCHAR(2048), nullable=True),
        sa.Column("status", sa.VARCHAR(20), nullable=False, server_default="pending_verification"),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("edit_token", sa.VARCHAR(64), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("job_code"),
        sa.UniqueConstraint("edit_token"),
    )
    op.create_index("ix_job_job_code", "job", ["job_code"])
    op.create_index("ix_job_company_country", "job", ["company_country"])
    op.create_index("ix_job_employment_type", "job", ["employment_type"])
    op.create_index("ix_job_status_created_at", "job", ["status", "created_at"])
    op.create_index("ix_job_key_skills_gin", "job", ["key_skills"], postgresql_using="gin")

    op.create_table(
        "profile",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("profile_code", sa.VARCHAR(12), nullable=False),
        sa.Column("person_name", sa.VARCHAR(200), nullable=False),
        sa.Column("email", sa.VARCHAR(320), nullable=False),
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("contact_number", sa.VARCHAR(30), nullable=True),
        sa.Column("resume_gcs_path", sa.VARCHAR(500), nullable=True),
        sa.Column("resume_original_filename", sa.VARCHAR(255), nullable=True),
        sa.Column("brief", sa.Text(), nullable=False),
        sa.Column("current_city", sa.VARCHAR(100), nullable=False),
        sa.Column("current_country", sa.VARCHAR(100), nullable=False),
        sa.Column("years_of_experience", sa.SmallInteger(), nullable=False),
        sa.Column("current_title", sa.VARCHAR(200), nullable=False),
        sa.Column("notice_period", sa.VARCHAR(50), nullable=True),
        sa.Column("relocation_preference", sa.VARCHAR(20), nullable=False, server_default="open"),
        sa.Column("linkedin_profile_link", sa.VARCHAR(500), nullable=True),
        sa.Column("key_skills", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("status", sa.VARCHAR(20), nullable=False, server_default="pending_verification"),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("edit_token", sa.VARCHAR(64), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("profile_code"),
        sa.UniqueConstraint("edit_token"),
    )
    op.create_index("ix_profile_profile_code", "profile", ["profile_code"])
    op.create_index("ix_profile_current_country", "profile", ["current_country"])
    op.create_index("ix_profile_status_created_at", "profile", ["status", "created_at"])
    op.create_index("ix_profile_key_skills_gin", "profile", ["key_skills"], postgresql_using="gin")

    op.create_table(
        "email_verification",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("verification_code", sa.VARCHAR(64), nullable=False),
        sa.Column("email", sa.VARCHAR(320), nullable=False),
        sa.Column("entity_type", sa.VARCHAR(10), nullable=False),
        sa.Column("entity_code", sa.VARCHAR(12), nullable=False),
        sa.Column("verified_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("expires_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("verification_code"),
    )
    op.create_index("ix_email_verification_verification_code", "email_verification", ["verification_code"])
    op.create_index("ix_email_verification_entity_code", "email_verification", ["entity_code"])

    op.create_table(
        "report",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("report_code", sa.VARCHAR(12), nullable=False),
        sa.Column("entity_type", sa.VARCHAR(10), nullable=False),
        sa.Column("entity_code", sa.VARCHAR(12), nullable=False),
        sa.Column("reporter_email", sa.VARCHAR(320), nullable=False),
        sa.Column("reason", sa.VARCHAR(50), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("status", sa.VARCHAR(20), nullable=False, server_default="pending"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("report_code"),
    )
    op.create_index("ix_report_report_code", "report", ["report_code"])
    op.create_index("ix_report_entity_code", "report", ["entity_code"])


def downgrade() -> None:
    op.drop_table("report")
    op.drop_table("email_verification")
    op.drop_table("profile")
    op.drop_table("job")
