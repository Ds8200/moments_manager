from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from src.users.enums import UserRole


class UserCreateSchema(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.user


class UserResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
