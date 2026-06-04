import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.product_categories.models import ProductCategory

logger = logging.getLogger(__name__)


class ProductCategoryRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all(self) -> list[ProductCategory]:
        result = await self._db.execute(select(ProductCategory).order_by(ProductCategory.name))
        return list(result.scalars().all())

    async def get_by_id(self, category_id: str) -> ProductCategory | None:
        result = await self._db.execute(
            select(ProductCategory).where(ProductCategory.id == category_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> ProductCategory | None:
        result = await self._db.execute(select(ProductCategory).where(ProductCategory.name == name))
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> ProductCategory:
        category = ProductCategory(**data)
        self._db.add(category)
        await self._db.flush()
        return category

    async def update(self, category: ProductCategory, data: dict) -> ProductCategory:
        for key, value in data.items():
            setattr(category, key, value)
        await self._db.flush()
        return category

    async def delete(self, category: ProductCategory) -> None:
        await self._db.delete(category)
        await self._db.flush()

    async def count_products(self, category_id: str) -> int:
        # Import here to avoid circular import at module level
        from src.products.models import Product

        result = await self._db.execute(
            select(func.count())
            .select_from(Product)
            .where(Product.category_id == category_id, Product.is_deleted.is_(False))
        )
        return result.scalar_one()
