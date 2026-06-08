import uuid

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base, TimestampMixin


class SystemSettings(Base, TimestampMixin):
    """Platform-level settings stored in DB. Exactly one row ever exists (singleton)."""

    __tablename__ = "system_settings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Platform SMTP — used for registration welcome emails, password change confirmations,
    # new-customer welcome emails, and sys-admin outbound emails.
    platform_smtp_host: Mapped[str | None] = mapped_column(String(255), nullable=True)
    platform_smtp_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    platform_smtp_username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    platform_smtp_password: Mapped[str | None] = mapped_column(Text, nullable=True)
    platform_smtp_from_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    platform_smtp_from_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Platform OpenAI API key — fallback when an org has no key of its own.
    platform_openai_api_key: Mapped[str | None] = mapped_column(Text, nullable=True)
