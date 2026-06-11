"""add_org_integrations

Revision ID: 0002_add_org_integrations
Revises: 0001a_rls_policies
Create Date: 2026-06-07

Adds per-org integration fields to the organizations table:
- openai_api_key: optional OpenAI API key for per-org AI usage
- smtp_*: SMTP credentials for per-org email sending via org's own address
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_add_org_integrations"
down_revision = "0001a_rls_policies"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("organizations", sa.Column("openai_api_key", sa.Text(), nullable=True))
    op.add_column("organizations", sa.Column("smtp_host", sa.String(255), nullable=True))
    op.add_column("organizations", sa.Column("smtp_port", sa.Integer(), nullable=True))
    op.add_column("organizations", sa.Column("smtp_username", sa.String(255), nullable=True))
    op.add_column("organizations", sa.Column("smtp_password", sa.Text(), nullable=True))
    op.add_column("organizations", sa.Column("smtp_from_email", sa.String(255), nullable=True))
    op.add_column("organizations", sa.Column("smtp_from_name", sa.String(200), nullable=True))


def downgrade() -> None:
    op.drop_column("organizations", "smtp_from_name")
    op.drop_column("organizations", "smtp_from_email")
    op.drop_column("organizations", "smtp_password")
    op.drop_column("organizations", "smtp_username")
    op.drop_column("organizations", "smtp_port")
    op.drop_column("organizations", "smtp_host")
    op.drop_column("organizations", "openai_api_key")
