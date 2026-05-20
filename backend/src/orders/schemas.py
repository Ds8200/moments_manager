from datetime import date as Date
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from src.orders.enums import OrderStatus, PaymentMethod


class OrderItemCreateSchema(BaseModel):
    product_id: Optional[str] = None
    product_name: str
    quantity: int = 1
    unit_price: Decimal = Decimal("0")
    unit_cost: Decimal = Decimal("0")
    design_notes: Optional[str] = None


class OrderItemResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: Optional[str]
    product_name: str
    quantity: int
    unit_price: Decimal
    unit_cost: Decimal
    total_price: Decimal
    profit: Decimal
    design_notes: Optional[str]


class OrderFileResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    original_name: str
    storage_path: str
    file_type: str
    file_size_bytes: int
    created_at: datetime


class OrderCreateSchema(BaseModel):
    customer_id: Optional[str] = None
    date: Date
    target_description: Optional[str] = None
    notes: Optional[str] = None
    items: list[OrderItemCreateSchema] = []


class OrderUpdateSchema(BaseModel):
    customer_id: Optional[str] = None
    date: Optional[Date] = None
    target_description: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[list[OrderItemCreateSchema]] = None


class OrderStatusUpdateSchema(BaseModel):
    status: OrderStatus


class OrderPaymentUpdateSchema(BaseModel):
    is_paid: bool
    payment_method: Optional[PaymentMethod] = None


class OrderResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_number: str
    customer_id: Optional[str]
    customer_name: Optional[str] = None
    date: Date
    target_description: Optional[str]
    status: str
    is_paid: bool
    payment_method: Optional[str]
    total_amount: Decimal
    total_cost: Decimal
    total_profit: Decimal
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponseSchema] = []
    files: list[OrderFileResponseSchema] = []


class OrderListResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_number: str
    customer_id: Optional[str]
    customer_name: Optional[str] = None
    date: Date
    target_description: Optional[str]
    status: str
    is_paid: bool
    payment_method: Optional[str]
    total_amount: Decimal
    total_profit: Decimal
    notes: Optional[str]
    created_at: datetime
    item_count: int = 0
