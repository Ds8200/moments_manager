from enum import Enum


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
