from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from src.organizations.enums import OrgPlan


class OrgAdminResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    org_number: str
    slug: str
    name: str
    logo_path: str | None
    plan: str
    trial_ends_at: datetime | None
    is_active: bool
    max_users: int
    owner_id: str
    owner_email: str
    member_count: int
    created_at: datetime
    updated_at: datetime


class OrgStatusUpdateSchema(BaseModel):
    is_active: bool


class OrgPlanUpdateSchema(BaseModel):
    plan: OrgPlan
    max_users: int | None = None
    trial_ends_at: datetime | None = None


class OrgUpdateAdminSchema(BaseModel):
    name: str | None = None
    slug: str | None = None


class OrgCreateAdminSchema(BaseModel):
    """Super-admin creates an org — either with an existing user or a brand-new one."""

    business_name: str
    plan: OrgPlan = OrgPlan.trial
    slug: str | None = None
    existing_user_id: str | None = None
    owner_email: EmailStr | None = None
    owner_full_name: str | None = None
    owner_password: str | None = None
    owner_phone: str | None = None

    @model_validator(mode="after")
    def check_owner(self) -> "OrgCreateAdminSchema":
        has_existing = bool(self.existing_user_id)
        has_new = bool(self.owner_email and self.owner_full_name and self.owner_password)
        if not has_existing and not has_new:
            raise ValueError(
                "Provide existing_user_id OR (owner_email + owner_full_name + owner_password)"
            )
        return self


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


class OrgOwnerAdminResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    phone: str | None
    org_count: int
    created_at: datetime


class UserSearchResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    phone: str | None


class OrgActionResponseSchema(BaseModel):
    message: str
