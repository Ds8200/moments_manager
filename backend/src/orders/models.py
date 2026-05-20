import uuid
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import String, Text, Boolean, Numeric, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, Optional

from src.database import Base, TimestampMixin, SoftDeleteMixin
from src.orders.enums import OrderStatus, PaymentMethod

if TYPE_CHECKING:
    from src.customers.models import Customer


class Order(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    customer_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("customers.id"), nullable=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    due_datetime: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default=OrderStatus.new, nullable=False
    )
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    payment_method: Mapped[str | None] = mapped_column(String(20), nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    total_profit: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    customer: Mapped[Optional["Customer"]] = relationship(
        "Customer", foreign_keys=[customer_id], lazy="noload"
    )
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    files: Mapped[list["OrderFile"]] = relationship(
        "OrderFile", back_populates="order", cascade="all, delete-orphan"
    )

    @property
    def customer_name(self) -> Optional[str]:
        return self.customer.name if self.customer else None


class OrderItem(Base, TimestampMixin):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String, ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("products.id"), nullable=True
    )
    product_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    profit: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    design_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="items")


class OrderFile(Base, TimestampMixin):
    __tablename__ = "order_files"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String, ForeignKey("orders.id"), nullable=False)
    original_name: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="files")
