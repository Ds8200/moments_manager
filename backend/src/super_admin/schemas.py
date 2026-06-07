from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from src.organizations.enums import OrgPlan


class OrgAdminResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    name: str
    logo_path: str | None
    plan: str
    trial_ends_at: datetime | None
    is_active: bool
    max_users: int
    owner_id: str
    member_count: int
    created_at: datetime
    updated_at: datetime


class OrgStatusUpdateSchema(BaseModel):
    is_active: bool


class OrgPlanUpdateSchema(BaseModel):
    plan: OrgPlan
    max_users: int | None = None
    trial_ends_at: datetime | None = None


class OrgCreateAdminSchema(BaseModel):
    """Super-admin manually creates an org and its initial owner account."""

    business_name: str
    slug: str
    owner_email: EmailStr
    owner_full_name: str
    owner_password: str
    plan: OrgPlan = OrgPlan.trial
