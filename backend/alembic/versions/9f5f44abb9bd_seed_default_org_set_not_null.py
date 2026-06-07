"""seed_default_org_set_not_null

Revision ID: 9f5f44abb9bd
Revises: b909ce96749c
Create Date: 2026-06-07 15:20:51.294762

Seeds a default organization from the first system_admin (or first user),
backfills all domain tables with that org's ID, then sets NOT NULL on all
organization_id columns. Also migrates old 'admin' role to 'system_admin'.
"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '9f5f44abb9bd'
down_revision: Union[str, None] = 'b909ce96749c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_DOMAIN_TABLES = [
    "customers",
    "products",
    "product_categories",
    "orders",
    "expenses",
    "expense_categories",
]


def upgrade() -> None:
    conn = op.get_bind()

    # Migrate old 'admin' role to 'system_admin'
    conn.execute(text("UPDATE users SET role = 'system_admin' WHERE role = 'admin'"))

    # Find the first system_admin (owner of the default org), fall back to any user
    owner = conn.execute(
        text("SELECT id FROM users WHERE role = 'system_admin' ORDER BY created_at LIMIT 1")
    ).fetchone()
    if not owner:
        owner = conn.execute(
            text("SELECT id FROM users ORDER BY created_at LIMIT 1")
        ).fetchone()

    # Only seed a default org if any data rows exist in any domain table
    has_data = any(
        conn.execute(text(f"SELECT 1 FROM {t} LIMIT 1")).fetchone()  # noqa: S608
        for t in _DOMAIN_TABLES
    )

    default_org_id: str | None = None

    if owner and has_data:
        # Check if a default org already exists (idempotent)
        existing_org = conn.execute(
            text("SELECT id FROM organizations WHERE owner_id = :uid ORDER BY created_at LIMIT 1"),
            {"uid": owner.id},
        ).fetchone()

        if existing_org:
            default_org_id = existing_org.id
        else:
            default_org_id = str(uuid.uuid4())
            conn.execute(
                text(
                    """
                    INSERT INTO organizations
                        (id, slug, name, plan, is_active, max_users, owner_id,
                         created_at, updated_at, is_deleted)
                    VALUES
                        (:id, 'default', 'Default Organization', 'professional',
                         TRUE, 9999, :owner_id, NOW(), NOW(), FALSE)
                    """
                ),
                {"id": default_org_id, "owner_id": owner.id},
            )
            conn.execute(
                text(
                    """
                    INSERT INTO organization_memberships
                        (id, organization_id, user_id, role, is_active,
                         joined_at, created_at, updated_at)
                    VALUES
                        (:id, :org_id, :user_id, 'owner', TRUE, NOW(), NOW(), NOW())
                    """
                ),
                {"id": str(uuid.uuid4()), "org_id": default_org_id, "user_id": owner.id},
            )

        # Backfill all domain tables
        for table in _DOMAIN_TABLES:
            conn.execute(
                text(f"UPDATE {table} SET organization_id = :org_id WHERE organization_id IS NULL"),  # noqa: S608
                {"org_id": default_org_id},
            )

    # Before setting NOT NULL: delete any remaining orphaned rows that still have NULL.
    # This handles dev/test DBs where data exists but no owner could be resolved.
    for table in _DOMAIN_TABLES:
        null_count = conn.execute(
            text(f"SELECT COUNT(*) FROM {table} WHERE organization_id IS NULL")  # noqa: S608
        ).scalar()
        if null_count:
            conn.execute(
                text(f"DELETE FROM {table} WHERE organization_id IS NULL")  # noqa: S608
            )

    # Set NOT NULL on all organization_id columns
    for table in _DOMAIN_TABLES:
        op.alter_column(table, "organization_id", nullable=False)


def downgrade() -> None:
    for table in _DOMAIN_TABLES:
        op.alter_column(table, "organization_id", nullable=True)
    # Do not reverse the role rename or drop the default org — data loss risk
