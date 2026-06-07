from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from src.organizations.enums import OrgRole


class BrandColorsSchema(BaseModel):
    primary: str
    secondary: str
    accent: str
    background: str
    text: str


class OrgUpdateSchema(BaseModel):
    name: str | None = None
    openai_api_key: str | None = None
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_from_name: str | None = None


class OrgResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    name: str
    logo_path: str | None
    brand_colors: dict | None
    plan: str
    trial_ends_at: datetime | None
    is_active: bool
    max_users: int
    owner_id: str
    created_at: datetime
    updated_at: datetime

    # Integration status — sensitive values are never returned raw
    has_openai_key: bool = False
    openai_key_preview: str | None = None
    has_smtp_config: bool = False
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_from_email: str | None = None
    smtp_from_name: str | None = None


class OrgSummarySchema(BaseModel):
    """Minimal org info returned during login when org selection is required."""

    id: str
    slug: str
    name: str
    logo_path: str | None
    brand_colors: dict | None
    plan: str
    is_active: bool


class MemberResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    organization_id: str
    role: str
    is_active: bool
    joined_at: datetime | None
    created_at: datetime


class InviteCreateSchema(BaseModel):
    email: EmailStr
    role: OrgRole = OrgRole.member


class InviteResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    email: str
    role: str
    expires_at: datetime
    accepted_at: datetime | None
    created_at: datetime


class OrgBrandingResponseSchema(BaseModel):
    logo_path: str
    brand_colors: BrandColorsSchema
    message: str


class PublicBrandingSchema(BaseModel):
    """Public (unauthenticated) org branding — used by frontend layout to inject CSS variables."""

    model_config = ConfigDict(from_attributes=True)

    slug: str
    name: str
    logo_path: str | None
    brand_colors: dict | None


class AcceptInviteSchema(BaseModel):
    token: str
