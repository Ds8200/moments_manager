from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

from src.orders.enums import OrderStatus, PaymentMethod


class OrderItemCreateSchema(BaseModel):
    product_id: str | None = None
    product_name: str
    quantity: int = 1
    unit_price: Decimal = Decimal("0")
    unit_cost: Decimal = Decimal("0")
    design_notes: str | None = None


class OrderItemResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str | None
    product_name: str
    quantity: int
    unit_price: Decimal
    unit_cost: Decimal
    total_price: Decimal
    profit: Decimal
    design_notes: str | None


class OrderFileResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    original_name: str
    storage_path: str
    file_type: str
    file_size_bytes: int
    created_at: datetime


class OrderCreateSchema(BaseModel):
    customer_id: str | None = None
    date: date
    target_description: str | None = None
    notes: str | None = None
    items: list[OrderItemCreateSchema] = []


class OrderUpdateSchema(BaseModel):
    customer_id: str | None = None
    date: date | None = None
    target_description: str | None = None
    notes: str | None = None
    items: list[OrderItemCreateSchema] | None = None


class OrderStatusUpdateSchema(BaseModel):
    status: OrderStatus


class OrderPaymentUpdateSchema(BaseModel):
    is_paid: bool
    payment_method: PaymentMethod | None = None


class OrderResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_number: str
    customer_id: str | None
    date: date
    target_description: str | None
    status: str
    is_paid: bool
    payment_method: str | None
    total_amount: Decimal
    total_cost: Decimal
    total_profit: Decimal
    notes: str | None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponseSchema] = []
    files: list[OrderFileResponseSchema] = []


class OrderListResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_number: str
    customer_id: str | None
    date: date
    target_description: str | None
    status: str
    is_paid: bool
    payment_method: str | None
    total_amount: Decimal
    total_profit: Decimal
    notes: str | None
    created_at: datetime
    item_count: int = 0
