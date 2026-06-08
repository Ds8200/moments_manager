from datetime import datetime

from sqlalchemy import Boolean, DateTime, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from src.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("clock_timestamp()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("clock_timestamp()"),
        onupdate=text("clock_timestamp()"),
        nullable=False,
    )


class SoftDeleteMixin:
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class BaseRepository:
    """Base for all org-scoped repositories. Sets the PostgreSQL RLS variable per session."""

    def __init__(self, db: AsyncSession, org_id: str) -> None:
        self._db = db
        self._org_id = org_id

    async def _apply_org_rls(self) -> None:
        # Raw SQL required: PostgreSQL SET LOCAL has no SQLAlchemy ORM equivalent.
        # SET LOCAL rejects bind parameters ($1 syntax); UUID contains only hex and
        # hyphens so direct interpolation is safe here.
        await self._db.execute(text(f"SET LOCAL app.current_org_id = '{self._org_id}'"))
