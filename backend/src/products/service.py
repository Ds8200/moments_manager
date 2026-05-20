import logging
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import NotFoundError
from src.core.schemas import PaginatedResponse, PaginationParams
from src.products.repository import ProductRepository
from src.products.schemas import (
    ProductCreateSchema,
    ProductResponseSchema,
    ProductUpdateSchema,
)

logger = logging.getLogger(__name__)


class ProductService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = ProductRepository(db)

    async def list_products(
        self,
        params: PaginationParams,
        search: str | None = None,
        category: str | None = None,
    ) -> PaginatedResponse[ProductResponseSchema]:
        products, total = await self._repo.get_all(search, category, params.page_size, params.offset)
        pages = (total + params.page_size - 1) // params.page_size
        return PaginatedResponse(
            items=[ProductResponseSchema.model_validate(p) for p in products],
            total=total,
            page=params.page,
            page_size=params.page_size,
            pages=pages,
        )

    async def get_product(self, product_id: str) -> ProductResponseSchema:
        product = await self._repo.get_by_id(product_id)
        if not product:
            raise NotFoundError("Product", product_id)
        return ProductResponseSchema.model_validate(product)

    async def create_product(self, data: ProductCreateSchema) -> ProductResponseSchema:
        product = await self._repo.create(data.model_dump(exclude_none=True))
        await self._db.commit()
        return ProductResponseSchema.model_validate(product)

    async def update_product(
        self, product_id: str, data: ProductUpdateSchema
    ) -> ProductResponseSchema:
        product = await self._repo.get_by_id(product_id)
        if not product:
            raise NotFoundError("Product", product_id)
        updated = await self._repo.update(product, data.model_dump(exclude_none=True))
        await self._db.commit()
        return ProductResponseSchema.model_validate(updated)

    async def delete_product(self, product_id: str) -> None:
        product = await self._repo.get_by_id(product_id)
        if not product:
            raise NotFoundError("Product", product_id)
        await self._repo.soft_delete(product)
        await self._db.commit()
