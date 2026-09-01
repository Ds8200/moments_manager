from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, model_validator

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


class UserRoleUpdateSchema(BaseModel):
    role: UserRole


class UserUpdateMeSchema(BaseModel):
    full_name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

    @model_validator(mode="after")
    def validate_password_fields(self) -> "UserUpdateMeSchema":
        has_current = self.current_password is not None
        has_new = self.new_password is not None
        if has_new and not has_current:
            raise ValueError("current_password is required when setting a new password")
        if has_current and not has_new:
            raise ValueError("new_password is required when current_password is provided")
        return self
