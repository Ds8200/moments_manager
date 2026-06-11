import logging

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants.http_messages import (
    PRODUCT_CATEGORY_IN_USE,
    PRODUCT_CATEGORY_NAME_EXISTS,
    RESOURCE_PRODUCT_CATEGORY,
)
from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import ConflictError, NotFoundError
from src.product_categories.repository import ProductCategoryRepository
from src.product_categories.schemas import (
    ProductCategoryCreateSchema,
    ProductCategoryResponseSchema,
    ProductCategoryUpdateSchema,
)

logger = logging.getLogger(__name__)


class ProductCategoryService:
    def __init__(self, db: AsyncSession, org_id: str) -> None:
        self._db = db
        self._repo = ProductCategoryRepository(db, org_id)

    async def list_categories(self) -> list[ProductCategoryResponseSchema]:
        categories = await self._repo.get_all()
        return [ProductCategoryResponseSchema.model_validate(c) for c in categories]

    async def create_category(
        self, data: ProductCategoryCreateSchema
    ) -> ProductCategoryResponseSchema:
        existing = await self._repo.get_by_name(data.name)
        if existing:
            raise ConflictError(PRODUCT_CATEGORY_NAME_EXISTS, code=ErrorCode.CATEGORY_NAME_EXISTS)
        category = await self._repo.create(data.model_dump())
        await self._db.commit()
        return ProductCategoryResponseSchema.model_validate(category)

    async def update_category(
        self, category_id: str, data: ProductCategoryUpdateSchema
    ) -> ProductCategoryResponseSchema:
        category = await self._repo.get_by_id(category_id)
        if not category:
            raise NotFoundError(RESOURCE_PRODUCT_CATEGORY, category_id)
        existing = await self._repo.get_by_name(data.name)
        if existing and existing.id != category_id:
            raise ConflictError(PRODUCT_CATEGORY_NAME_EXISTS, code=ErrorCode.CATEGORY_NAME_EXISTS)
        await self._repo.update(category, data.model_dump())
        await self._db.commit()
        refreshed = await self._repo.get_by_id(category_id)
        return ProductCategoryResponseSchema.model_validate(refreshed)

    async def delete_category(self, category_id: str) -> None:
        category = await self._repo.get_by_id(category_id)
        if not category:
            raise NotFoundError(RESOURCE_PRODUCT_CATEGORY, category_id)
        count = await self._repo.count_products(category_id)
        if count > 0:
            raise ConflictError(PRODUCT_CATEGORY_IN_USE, ErrorCode.CATEGORY_IN_USE)
        await self._repo.delete(category)
        await self._db.commit()
