from unittest.mock import AsyncMock

import pytest

from src.core.exceptions import NotFoundError
from src.orders.enums import OrderStatus, UrgencyLevel
from src.orders.schemas import OrderStatusUpdateSchema, OrderUpdateSchema, OrderUrgencyUpdateSchema
from src.orders.service import OrderService, _compute_item_fields

pytestmark = pytest.mark.asyncio


def test_compute_item_fields_calculates_total_and_profit() -> None:
    result = _compute_item_fields(
        {"quantity": 3, "unit_price": "10", "unit_cost": "4", "product_name": "X"}
    )

    assert str(result["total_price"]) == "30"
    assert str(result["profit"]) == "18"


async def test_get_order_not_found() -> None:
    db = AsyncMock()
    service = OrderService(db)
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.get_order("missing")


async def test_update_order_not_found() -> None:
    db = AsyncMock()
    service = OrderService(db)
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.update_order("missing", OrderUpdateSchema())


async def test_update_status_not_found() -> None:
    db = AsyncMock()
    service = OrderService(db)
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.update_status("missing", OrderStatusUpdateSchema(status=OrderStatus.new))


async def test_update_urgency_not_found() -> None:
    db = AsyncMock()
    service = OrderService(db)
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.update_urgency(
            "missing", OrderUrgencyUpdateSchema(urgency=UrgencyLevel.urgent)
        )


async def test_delete_order_not_found() -> None:
    db = AsyncMock()
    service = OrderService(db)
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.delete_order("missing")
