"""Add renewal_count column to job and profile tables

Revision ID: 0009
Revises: 0008
Create Date: 2026-04-11

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("job", sa.Column("renewal_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("profile", sa.Column("renewal_count", sa.Integer(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("job", "renewal_count")
    op.drop_column("profile", "renewal_count")
