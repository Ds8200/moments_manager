import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.database import BaseRepository
from src.products.models import Product

logger = logging.getLogger(__name__)


class ProductRepository(BaseRepository):
    def __init__(self, db: AsyncSession, org_id: str) -> None:
        super().__init__(db, org_id)

    async def get_all(
        self,
        search: str | None,
        category_id: str | None,
        is_active: bool | None,
        limit: int,
        offset: int,
    ) -> tuple[list[Product], int]:
        await self._apply_org_rls()
        base = select(Product).where(
            Product.is_deleted.is_(False),
            Product.organization_id == self._org_id,
        )
        if search:
            base = base.where(Product.name.ilike(f"%{search}%"))
        if category_id:
            base = base.where(Product.category_id == category_id)
        if is_active is not None:
            base = base.where(Product.is_active == is_active)

        count_q = select(func.count()).select_from(base.subquery())
        total = (await self._db.execute(count_q)).scalar_one()

        items_q = (
            base.options(selectinload(Product.category))
            .order_by(Product.name)
            .limit(limit)
            .offset(offset)
        )
        result = await self._db.execute(items_q)
        return list(result.scalars().all()), total

    async def get_by_id(self, product_id: str) -> Product | None:
        await self._apply_org_rls()
        result = await self._db.execute(
            select(Product)
            .options(selectinload(Product.category))
            .where(
                Product.id == product_id,
                Product.is_deleted.is_(False),
                Product.organization_id == self._org_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> Product:
        await self._apply_org_rls()
        data["organization_id"] = self._org_id
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
