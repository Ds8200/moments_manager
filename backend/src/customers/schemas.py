from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CustomerCreateSchema(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    notes: str | None = None


class CustomerUpdateSchema(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    notes: str | None = None


class CustomerResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    phone: str | None
    email: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class CustomerWithStatsSchema(CustomerResponseSchema):
    total_orders: int = 0
    total_spent: float = 0.0
