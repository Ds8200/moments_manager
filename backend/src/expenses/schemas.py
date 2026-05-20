from datetime import date as Date
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ExpenseCreateSchema(BaseModel):
    date: Date
    category: str
    amount: Decimal
    notes: Optional[str] = None


class ExpenseUpdateSchema(BaseModel):
    date: Optional[Date] = None
    category: Optional[str] = None
    amount: Optional[Decimal] = None
    notes: Optional[str] = None


class ExpenseResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    date: Date
    category: str
    amount: Decimal
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
