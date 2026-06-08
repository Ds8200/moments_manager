import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.system_settings.models import SystemSettings

logger = logging.getLogger(__name__)


class SystemSettingsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get(self) -> SystemSettings:
        """Return the singleton settings row, creating it if it does not exist."""
        result = await self._db.execute(select(SystemSettings).limit(1))
        settings = result.scalar_one_or_none()
        if settings is None:
            settings = SystemSettings()
            self._db.add(settings)
            await self._db.flush()
            await self._db.refresh(settings)
            logger.info("SystemSettings singleton created")
        return settings

    async def update(self, settings: SystemSettings, fields: dict) -> SystemSettings:
        for key, value in fields.items():
            setattr(settings, key, value)
        await self._db.flush()
        await self._db.refresh(settings)
        return settings
