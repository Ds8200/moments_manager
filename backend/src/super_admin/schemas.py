from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

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


class OrgOwnerEmailSchema(BaseModel):
    """Recipient entry for the sys-admin compose-email page."""

    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: str
    full_name: str
    org_id: str
    org_name: str


class AdminAttachmentSchema(BaseModel):
    name: str
    content: str  # base64-encoded


class AdminComposeEmailSchema(BaseModel):
    org_owner_ids: list[str]
    manual_emails: list[EmailStr] = []
    subject: str = Field(min_length=1)
    body: str = Field(min_length=1)
    attachments: list[AdminAttachmentSchema] | None = None


class AdminComposeEmailResponseSchema(BaseModel):
    message: str
    sent_to: int


class OrgActionResponseSchema(BaseModel):
    message: str
