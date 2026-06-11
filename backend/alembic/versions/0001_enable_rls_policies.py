"""enable_rls_policies

Revision ID: 0001a_rls_policies
Revises: 9f5f44abb9bd
Create Date: 2026-06-07

Enables PostgreSQL Row Level Security on all org-scoped domain tables and creates
policies that restrict reads and writes to rows matching the current session's
app.current_org_id setting (SET LOCAL by BaseRepository._apply_org_rls).

The policy uses USING (organization_id::text = current_setting('app.current_org_id', true))
with the second arg true so the function returns '' instead of raising when the
setting is absent — rows are then invisible rather than causing a 500 on startup
health checks that run without an org context.

Bypass: SUPERUSER and the backend db user are granted BYPASSRLS in production.
In dev/test the database owner bypasses RLS automatically.
"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

revision: str = "0001a_rls_policies"
down_revision: Union[str, None] = "9f5f44abb9bd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLES = [
    "customers",
    "products",
    "product_categories",
    "orders",
    "expenses",
    "expense_categories",
]


def upgrade() -> None:
    conn = op.get_bind()
    for table in _TABLES:
        conn.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY"))
        conn.execute(text(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY"))
        conn.execute(
            text(
                f"CREATE POLICY org_isolation ON {table} "
                "USING (organization_id::text = "
                "current_setting('app.current_org_id', true))"
            )
        )


def downgrade() -> None:
    conn = op.get_bind()
    for table in reversed(_TABLES):
        conn.execute(text(f"DROP POLICY IF EXISTS org_isolation ON {table}"))
        conn.execute(text(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY"))
        conn.execute(text(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY"))
