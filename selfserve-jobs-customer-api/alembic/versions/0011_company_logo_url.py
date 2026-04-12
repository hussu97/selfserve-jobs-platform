"""Add company_logo_url to job table

Revision ID: 0011
Revises: 0010
Create Date: 2026-04-12
"""

import sqlalchemy as sa

from alembic import op

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("job", sa.Column("company_logo_url", sa.VARCHAR(2048), nullable=True))


def downgrade() -> None:
    op.drop_column("job", "company_logo_url")
