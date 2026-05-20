from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class ProductCreateSchema(BaseModel):
    name: str
    category: str | None = None
    base_price: Decimal = Decimal("0")
    base_cost: Decimal = Decimal("0")
    avg_production_days: int = 0


class ProductUpdateSchema(BaseModel):
    name: str | None = None
    category: str | None = None
    base_price: Decimal | None = None
    base_cost: Decimal | None = None
    avg_production_days: int | None = None
    is_active: bool | None = None


class ProductResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str | None
    base_price: Decimal
    base_cost: Decimal
    avg_production_days: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
