import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.products.models import Product

logger = logging.getLogger(__name__)


class ProductRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all(
        self,
        search: str | None,
        category: str | None,
        is_active: bool | None,
        limit: int,
        offset: int,
    ) -> tuple[list[Product], int]:
        query = select(Product).where(Product.is_deleted.is_(False))
        if search:
            query = query.where(Product.name.ilike(f"%{search}%"))
        if category:
            query = query.where(Product.category == category)
        if is_active is not None:
            query = query.where(Product.is_active == is_active)
        count_q = select(func.count()).select_from(query.subquery())
        total = (await self._db.execute(count_q)).scalar_one()
        query = query.order_by(Product.name).limit(limit).offset(offset)
        result = await self._db.execute(query)
        return result.scalars().all(), total

    async def get_by_id(self, product_id: str) -> Product | None:
        result = await self._db.execute(
            select(Product).where(Product.id == product_id, Product.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> Product:
        product = Product(**data)
        self._db.add(product)
        await self._db.flush()
        return product

    async def update(self, product: Product, data: dict) -> Product:
        for key, value in data.items():
            setattr(product, key, value)
        await self._db.flush()
        return product

    async def soft_delete(self, product: Product) -> None:
        product.is_deleted = True
        product.deleted_at = datetime.now(timezone.utc)
        await self._db.flush()
