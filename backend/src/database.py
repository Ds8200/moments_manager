from datetime import datetime

from sqlalchemy import Boolean, DateTime, func, text
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
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
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
        await self._db.execute(
            text("SET LOCAL app.current_org_id = :org_id"), {"org_id": self._org_id}
        )
