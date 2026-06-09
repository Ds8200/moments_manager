import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base, SoftDeleteMixin, TimestampMixin
from src.expense_categories.models import ExpenseCategory


class Expense(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "expenses"
    __table_args__ = (
        Index("ix_expenses_organization_id", "organization_id"),
        Index("ix_expenses_org_deleted_date", "organization_id", "is_deleted", "date"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Mapped[str] = mapped_column(
        String, ForeignKey("organizations.id"), nullable=False, index=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    category_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("expense_categories.id", ondelete="SET NULL"), nullable=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped[ExpenseCategory | None] = relationship("ExpenseCategory", lazy="raise")
