from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProductCategoryCreateSchema(BaseModel):
    name: str


class ProductCategoryUpdateSchema(BaseModel):
    name: str


class ProductCategoryResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    created_at: datetime
    updated_at: datetime
