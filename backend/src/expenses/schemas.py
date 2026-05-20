from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class ExpenseCreateSchema(BaseModel):
    date: date
    category: str
    amount: Decimal
    notes: str | None = None


class ExpenseUpdateSchema(BaseModel):
    date: date | None = None
    category: str | None = None
    amount: Decimal | None = None
    notes: str | None = None


class ExpenseResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    date: date
    category: str
    amount: Decimal
    notes: str | None
    created_at: datetime
    updated_at: datetime
