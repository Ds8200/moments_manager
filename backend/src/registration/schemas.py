import re

from pydantic import BaseModel, EmailStr, field_validator


class RegistrationSchema(BaseModel):
    business_name: str
    slug: str
    owner_email: EmailStr
    password: str

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[a-z0-9][a-z0-9\-]{1,98}[a-z0-9]$", v):
            raise ValueError(
                "Slug must be 3-100 chars, lowercase letters/numbers/hyphens, "
                "cannot start or end with a hyphen"
            )
        return v

    @field_validator("business_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Business name cannot be empty")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class RegistrationResponseSchema(BaseModel):
    org_id: str
    org_slug: str
    user_id: str
    message: str
