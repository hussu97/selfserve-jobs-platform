"""Add passkey and webauthn_challenge tables

Revision ID: 0018
Revises: 0017
Create Date: 2026-05-06
"""

import sqlalchemy as sa

from alembic import op

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "passkey",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("credential_id", sa.LargeBinary(), nullable=False),
        sa.Column("public_key", sa.LargeBinary(), nullable=False),
        sa.Column("sign_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("aaguid", sa.VARCHAR(36), nullable=True),
        sa.Column("user_email", sa.VARCHAR(320), nullable=False),
        sa.Column("label", sa.VARCHAR(100), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("credential_id", name="uq_passkey_credential_id"),
    )
    op.create_index("ix_passkey_user_email", "passkey", ["user_email"])

    op.create_table(
        "webauthn_challenge",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("session_key", sa.VARCHAR(64), nullable=False),
        sa.Column("challenge", sa.LargeBinary(), nullable=False),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_key", name="uq_webauthn_challenge_session_key"),
    )
    op.create_index("ix_webauthn_challenge_session_key", "webauthn_challenge", ["session_key"])


def downgrade() -> None:
    op.drop_index("ix_webauthn_challenge_session_key", table_name="webauthn_challenge")
    op.drop_table("webauthn_challenge")
    op.drop_index("ix_passkey_user_email", table_name="passkey")
    op.drop_table("passkey")
