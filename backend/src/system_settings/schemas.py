from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SystemSmtpUpdateSchema(BaseModel):
    platform_smtp_host: str | None = None
    platform_smtp_port: int | None = None
    platform_smtp_username: str | None = None
    platform_smtp_password: str | None = None
    platform_smtp_from_email: str | None = None
    platform_smtp_from_name: str | None = None


class SystemOpenAIUpdateSchema(BaseModel):
    platform_openai_api_key: str | None = None


class SysAdminPasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class SystemSettingsResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    has_smtp_config: bool
    smtp_host: str | None
    smtp_port: int | None
    smtp_username: str | None
    smtp_from_email: str | None
    smtp_from_name: str | None
    has_openai_key: bool
    openai_key_preview: str | None
    updated_at: datetime


class MessageResponseSchema(BaseModel):
    message: str
