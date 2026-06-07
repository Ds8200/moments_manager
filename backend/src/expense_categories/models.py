import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base, TimestampMixin


class ExpenseCategory(Base, TimestampMixin):
    __tablename__ = "expense_categories"
    __table_args__ = (
        UniqueConstraint("organization_id", "name", name="uq_expense_category_org_name"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Mapped[str] = mapped_column(
        String, ForeignKey("organizations.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
