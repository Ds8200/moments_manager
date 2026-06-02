from enum import Enum


class OrderSortField(str, Enum):
    created_at = "created_at"
    customer_name = "customer_name"
    due_datetime = "due_datetime"
    urgency = "urgency"


class OrderStatus(str, Enum):
    new = "new"
    waiting_approval = "waiting_approval"
    approved = "approved"
    printing = "printing"
    ready = "ready"
    completed = "completed"
    cancelled = "cancelled"


class PaymentMethod(str, Enum):
    cash = "cash"
    transfer = "transfer"
    partial = "partial"


class UrgencyLevel(str, Enum):
    normal      = "normal"
    urgent      = "urgent"
    very_urgent = "very_urgent"
