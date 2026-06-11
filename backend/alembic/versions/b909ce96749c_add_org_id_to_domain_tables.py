"""add_org_id_to_domain_tables

Revision ID: b909ce96749c
Revises: 616ffd169b02
Create Date: 2026-06-07 15:20:22.915114

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'b909ce96749c'
down_revision: Union[str, None] = '616ffd169b02'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('customers', sa.Column('organization_id', sa.String(), nullable=True))
    op.create_index('ix_customers_organization_id', 'customers', ['organization_id'], unique=False)
    op.create_foreign_key(None, 'customers', 'organizations', ['organization_id'], ['id'])
    op.add_column('expense_categories', sa.Column('organization_id', sa.String(), nullable=True))
    op.drop_constraint(op.f('expense_categories_name_key'), 'expense_categories', type_='unique')
    op.create_unique_constraint('uq_expense_category_org_name', 'expense_categories', ['organization_id', 'name'])
    op.create_foreign_key(None, 'expense_categories', 'organizations', ['organization_id'], ['id'])
    op.add_column('expenses', sa.Column('organization_id', sa.String(), nullable=True))
    op.create_index('ix_expenses_organization_id', 'expenses', ['organization_id'], unique=False)
    op.create_foreign_key(None, 'expenses', 'organizations', ['organization_id'], ['id'])
    op.add_column('orders', sa.Column('organization_id', sa.String(), nullable=True))
    op.drop_constraint(op.f('orders_order_number_key'), 'orders', type_='unique')
    op.create_index('ix_orders_organization_id', 'orders', ['organization_id'], unique=False)
    op.create_unique_constraint('uq_order_org_number', 'orders', ['organization_id', 'order_number'])
    op.create_foreign_key(None, 'orders', 'organizations', ['organization_id'], ['id'])
    op.add_column('product_categories', sa.Column('organization_id', sa.String(), nullable=True))
    op.drop_constraint(op.f('product_categories_name_key'), 'product_categories', type_='unique')
    op.create_unique_constraint('uq_product_category_org_name', 'product_categories', ['organization_id', 'name'])
    op.create_foreign_key(None, 'product_categories', 'organizations', ['organization_id'], ['id'])
    op.add_column('products', sa.Column('organization_id', sa.String(), nullable=True))
    op.create_index('ix_products_organization_id', 'products', ['organization_id'], unique=False)
    op.create_foreign_key(None, 'products', 'organizations', ['organization_id'], ['id'])


def _drop_org_fk(conn, table: str) -> None:
    """Lookup and drop the organization_id FK by name — autogenerate used name=None."""
    row = conn.execute(
        text(
            "SELECT tc.constraint_name "
            "FROM information_schema.table_constraints AS tc "
            "JOIN information_schema.key_column_usage AS kcu "
            "  ON tc.constraint_name = kcu.constraint_name "
            " AND tc.table_schema    = kcu.table_schema "
            "WHERE tc.constraint_type = 'FOREIGN KEY' "
            "  AND tc.table_name      = :tbl "
            "  AND kcu.column_name    = 'organization_id' "
            "  AND tc.table_schema    = 'public' "
            "LIMIT 1"
        ),
        {"tbl": table},
    ).fetchone()
    if row:
        conn.execute(text(f'ALTER TABLE {table} DROP CONSTRAINT "{row[0]}"'))  # noqa: S608


def downgrade() -> None:
    conn = op.get_bind()

    _drop_org_fk(conn, 'products')
    op.drop_index('ix_products_organization_id', table_name='products')
    op.drop_column('products', 'organization_id')

    _drop_org_fk(conn, 'product_categories')
    op.drop_constraint('uq_product_category_org_name', 'product_categories', type_='unique')
    op.create_unique_constraint(
        op.f('product_categories_name_key'), 'product_categories', ['name'],
        postgresql_nulls_not_distinct=False,
    )
    op.drop_column('product_categories', 'organization_id')

    _drop_org_fk(conn, 'orders')
    op.drop_constraint('uq_order_org_number', 'orders', type_='unique')
    op.drop_index('ix_orders_organization_id', table_name='orders')
    op.create_unique_constraint(
        op.f('orders_order_number_key'), 'orders', ['order_number'],
        postgresql_nulls_not_distinct=False,
    )
    op.drop_column('orders', 'organization_id')

    _drop_org_fk(conn, 'expenses')
    op.drop_index('ix_expenses_organization_id', table_name='expenses')
    op.drop_column('expenses', 'organization_id')

    _drop_org_fk(conn, 'expense_categories')
    op.drop_constraint('uq_expense_category_org_name', 'expense_categories', type_='unique')
    op.create_unique_constraint(
        op.f('expense_categories_name_key'), 'expense_categories', ['name'],
        postgresql_nulls_not_distinct=False,
    )
    op.drop_column('expense_categories', 'organization_id')

    _drop_org_fk(conn, 'customers')
    op.drop_index('ix_customers_organization_id', table_name='customers')
    op.drop_column('customers', 'organization_id')
