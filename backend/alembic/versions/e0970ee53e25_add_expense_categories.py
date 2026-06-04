"""add_expense_categories

Revision ID: e0970ee53e25
Revises: 2f8f09c2c189
Create Date: 2026-06-04 11:42:50.547712

"""

import datetime
import uuid
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e0970ee53e25"
down_revision: Union[str, None] = "2f8f09c2c189"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Mapping: old English code → Hebrew display name seeded into expense_categories
_CATEGORY_MAPPING = {
    "ink": "דיו וצבעים",
    "materials": "חומרי גלם",
    "equipment": "ציוד",
    "shipping": "משלוחים",
    "utilities": "חשמל/מים",
    "other": "אחר",
}


def upgrade() -> None:
    # 1. Create expense_categories table
    op.create_table(
        "expense_categories",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # 2. Seed the 6 default categories and capture their generated IDs
    now = datetime.datetime.now(datetime.timezone.utc)
    category_ids: dict[str, str] = {}
    for eng, heb in _CATEGORY_MAPPING.items():
        new_id = str(uuid.uuid4())
        category_ids[eng] = new_id
        op.execute(
            sa.text(
                "INSERT INTO expense_categories (id, name, created_at, updated_at) "
                "VALUES (:id, :name, :created_at, :updated_at)"
            ).bindparams(id=new_id, name=heb, created_at=now, updated_at=now)
        )

    # 3. Add category_id FK column (nullable)
    op.add_column("expenses", sa.Column("category_id", sa.String(), nullable=True))
    op.create_foreign_key(
        None, "expenses", "expense_categories", ["category_id"], ["id"], ondelete="SET NULL"
    )

    # 4. Migrate existing expense rows: map old string value to new UUID
    for eng, cat_id in category_ids.items():
        op.execute(
            sa.text(
                "UPDATE expenses SET category_id = :cat_id "
                "WHERE category = :eng AND is_deleted = false"
            ).bindparams(cat_id=cat_id, eng=eng)
        )

    # 5. Drop the old string column
    op.drop_column("expenses", "category")


def downgrade() -> None:
    # Re-add the string column (data loss on category_id → name mapping is accepted in downgrade)
    op.add_column(
        "expenses",
        sa.Column("category", sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    )
    # Best-effort: populate category string from joined name
    op.execute(
        sa.text(
            "UPDATE expenses e SET category = ec.name "
            "FROM expense_categories ec WHERE e.category_id = ec.id"
        )
    )
    op.drop_constraint(None, "expenses", type_="foreignkey")
    op.drop_column("expenses", "category_id")
    op.drop_table("expense_categories")
