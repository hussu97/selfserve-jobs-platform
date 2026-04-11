"""Introduce user_sensitive table; consolidate email/phone from job, profile, email_verification

Revision ID: 0010
Revises: 0009
Create Date: 2026-04-12

Each unique email across job + profile gets one user_sensitive row. The job, profile,
and email_verification tables drop their email columns and instead store a user_code
that references user_sensitive.user_code. profile.contact_number moves to
user_sensitive.user_phone.

Existing data is migrated in-place without data loss.
"""

from collections.abc import Sequence
from datetime import UTC, datetime

import sqlalchemy as sa

from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    from nanoid import generate

    # ------------------------------------------------------------------
    # 1. Create user_sensitive table
    # ------------------------------------------------------------------
    op.create_table(
        "user_sensitive",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_code", sa.VARCHAR(12), nullable=False),
        sa.Column("user_email", sa.VARCHAR(320), nullable=False),
        sa.Column("user_phone", sa.VARCHAR(30), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_code"),
        sa.UniqueConstraint("user_email"),
    )
    op.create_index("ix_user_sensitive_user_code", "user_sensitive", ["user_code"])
    op.create_index("ix_user_sensitive_user_email", "user_sensitive", ["user_email"])

    # ------------------------------------------------------------------
    # 2. Add nullable user_code columns to entity tables
    # ------------------------------------------------------------------
    op.add_column("job", sa.Column("user_code", sa.VARCHAR(12), nullable=True))
    op.add_column("profile", sa.Column("user_code", sa.VARCHAR(12), nullable=True))
    op.add_column("email_verification", sa.Column("user_code", sa.VARCHAR(12), nullable=True))

    # ------------------------------------------------------------------
    # 3. Data migration
    # ------------------------------------------------------------------
    conn = op.get_bind()
    now_ts = datetime.now(UTC)

    # Collect all unique emails together with their phone numbers (from profile).
    # If an email exists in both job and profile, the profile's contact_number wins.
    job_emails = conn.execute(sa.text("SELECT DISTINCT email FROM job")).fetchall()
    profile_rows = conn.execute(sa.text("SELECT email, contact_number FROM profile")).fetchall()

    phone_by_email: dict[str, str | None] = {}
    for email, phone in profile_rows:
        phone_by_email.setdefault(email, phone)

    all_emails: set[str] = {row[0] for row in job_emails} | {row[0] for row in profile_rows}

    email_to_code: dict[str, str] = {}
    for email in all_emails:
        code = generate(size=12)
        email_to_code[email] = code
        conn.execute(
            sa.text(
                "INSERT INTO user_sensitive (user_code, user_email, user_phone, created_at, updated_at) "
                "VALUES (:code, :email, :phone, :now, :now)"
            ),
            {"code": code, "email": email, "phone": phone_by_email.get(email), "now": now_ts},
        )

    # Propagate user_code into job rows
    for email, code in email_to_code.items():
        conn.execute(
            sa.text("UPDATE job SET user_code = :code WHERE email = :email"),
            {"code": code, "email": email},
        )

    # Propagate user_code into profile rows
    for email, code in email_to_code.items():
        conn.execute(
            sa.text("UPDATE profile SET user_code = :code WHERE email = :email"),
            {"code": code, "email": email},
        )

    # Propagate user_code into email_verification via the linked entity's user_code.
    # Uses PostgreSQL UPDATE … FROM syntax (this migration runs on PostgreSQL only).
    conn.execute(
        sa.text(
            """
            UPDATE email_verification ev
            SET user_code = j.user_code
            FROM job j
            WHERE ev.entity_type = 'job'
              AND ev.entity_code = j.job_code
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE email_verification ev
            SET user_code = p.user_code
            FROM profile p
            WHERE ev.entity_type = 'profile'
              AND ev.entity_code = p.profile_code
            """
        )
    )
    # Recruiter verifications intentionally keep user_code = NULL

    # ------------------------------------------------------------------
    # 4. Make user_code NOT NULL on job and profile
    # ------------------------------------------------------------------
    op.alter_column("job", "user_code", nullable=False)
    op.alter_column("profile", "user_code", nullable=False)

    # ------------------------------------------------------------------
    # 5. Add indexes
    # ------------------------------------------------------------------
    op.create_index("ix_job_user_code", "job", ["user_code"])
    op.create_index("ix_profile_user_code", "profile", ["user_code"])
    op.create_index("ix_email_verification_user_code", "email_verification", ["user_code"])

    # ------------------------------------------------------------------
    # 6. Drop the columns that have been consolidated into user_sensitive
    # ------------------------------------------------------------------
    op.drop_column("job", "email")
    op.drop_column("profile", "email")
    op.drop_column("profile", "contact_number")
    op.drop_column("email_verification", "email")


def downgrade() -> None:
    # Re-add the old columns (data is not restored — downgrade is structural only)
    op.add_column("email_verification", sa.Column("email", sa.VARCHAR(320), nullable=True))
    op.add_column("profile", sa.Column("contact_number", sa.VARCHAR(30), nullable=True))
    op.add_column("profile", sa.Column("email", sa.VARCHAR(320), nullable=True))
    op.add_column("job", sa.Column("email", sa.VARCHAR(320), nullable=True))

    # Restore email from user_sensitive back into job and profile
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE job j
            SET email = us.user_email
            FROM user_sensitive us
            WHERE j.user_code = us.user_code
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE profile p
            SET email      = us.user_email,
                contact_number = us.user_phone
            FROM user_sensitive us
            WHERE p.user_code = us.user_code
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE email_verification ev
            SET email = us.user_email
            FROM user_sensitive us
            WHERE ev.user_code = us.user_code
            """
        )
    )

    # Drop user_code columns and indexes
    op.drop_index("ix_email_verification_user_code", table_name="email_verification")
    op.drop_index("ix_profile_user_code", table_name="profile")
    op.drop_index("ix_job_user_code", table_name="job")

    op.drop_column("email_verification", "user_code")
    op.drop_column("profile", "user_code")
    op.drop_column("job", "user_code")

    op.drop_index("ix_user_sensitive_user_email", table_name="user_sensitive")
    op.drop_index("ix_user_sensitive_user_code", table_name="user_sensitive")
    op.drop_table("user_sensitive")
