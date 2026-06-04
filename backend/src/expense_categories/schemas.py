from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ExpenseCategoryCreateSchema(BaseModel):
    name: str


class ExpenseCategoryUpdateSchema(BaseModel):
    name: str


class ExpenseCategoryResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    created_at: datetime
    updated_at: datetime
