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


class OrderUrgency(str, Enum):
    critical = "critical"  # ≤ 24 שעות
    high = "high"          # 1–3 ימים
    medium = "medium"      # 3–7 ימים
    low = "low"            # > 7 ימים
