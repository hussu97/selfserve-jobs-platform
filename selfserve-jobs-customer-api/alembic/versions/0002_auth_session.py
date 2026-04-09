"""add auth_session and login_token tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "login_token",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("token", sa.VARCHAR(64), nullable=False),
        sa.Column("email", sa.VARCHAR(320), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("expires_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index("ix_login_token_token", "login_token", ["token"])
    op.create_index("ix_login_token_email", "login_token", ["email"])

    op.create_table(
        "auth_session",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("session_token", sa.VARCHAR(64), nullable=False),
        sa.Column("email", sa.VARCHAR(320), nullable=False),
        sa.Column("expires_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_token"),
    )
    op.create_index("ix_auth_session_session_token", "auth_session", ["session_token"])
    op.create_index("ix_auth_session_email", "auth_session", ["email"])


def downgrade() -> None:
    op.drop_table("auth_session")
    op.drop_table("login_token")
