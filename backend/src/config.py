import logging

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    TEST_DATABASE_URL: str | None = None
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "https://nihulo.vercel.app"]
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    MAGIC_LOGIN_EXPIRE_HOURS: int = 72
    UPLOADS_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10
    APP_URL: str = "http://localhost:3000"
    APP_DOMAIN: str = "localhost:3000"
    SYSTEM_ADMIN_EMAIL: str = ""
    COOKIE_SECURE: bool = False
    # Platform SMTP and OpenAI key are now stored in the system_settings DB table.
    # Configure them via the sys-admin settings page, not environment variables.

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
