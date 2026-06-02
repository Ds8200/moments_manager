import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from src.auth.router import router as auth_router
from src.config import settings
from src.core.constants import log_messages
from src.core.exception_handlers import register_exception_handlers
from src.core.middleware import register_middleware
from src.core.rate_limit import limiter
from src.customers.router import router as customers_router
from src.database import engine
from src.expenses.router import router as expenses_router
from src.orders.router import router as orders_router
from src.products.router import router as products_router
from src.reports.router import router as reports_router
from src.users.router import router as users_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_host = settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "unknown"
    logger.info(
        log_messages.APP_START,
        db_host,
        settings.CORS_ORIGINS,
        settings.LOG_LEVEL,
    )

    async with engine.connect() as conn:
        try:
            await conn.execute(text("SELECT 1"))
            logger.info(log_messages.DB_CONNECTED)
        except Exception as exc:
            logger.error(log_messages.DB_CONNECT_FAILED, exc)
            raise

    os.makedirs(settings.UPLOADS_DIR, exist_ok=True)

    yield

    await engine.dispose()
    logger.info(log_messages.APP_STOP)


app = FastAPI(title="Moments API", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

register_middleware(app)
register_exception_handlers(app)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(customers_router)
app.include_router(products_router)
app.include_router(orders_router)
app.include_router(expenses_router)
app.include_router(reports_router)

app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")


@app.get("/health/live")
async def health_live():
    return {"status": "ok"}


@app.get("/health/ready")
async def health_ready():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception:
        return JSONResponse(status_code=503, content={"status": "unavailable"})
