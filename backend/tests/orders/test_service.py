from datetime import datetime, timezone, timedelta

import pytest
from unittest.mock import AsyncMock

from src.core.exceptions import NotFoundError
from src.orders.enums import OrderStatus, OrderUrgency
from src.orders.schemas import OrderStatusUpdateSchema, OrderUpdateSchema
from src.orders.service import OrderService, _compute_item_fields, _compute_urgency

pytestmark = pytest.mark.asyncio


def test_compute_item_fields_calculates_total_and_profit() -> None:
    result = _compute_item_fields(
        {"quantity": 3, "unit_price": "10", "unit_cost": "4", "product_name": "X"}
    )

    assert str(result["total_price"]) == "30"
    assert str(result["profit"]) == "18"


def test_compute_urgency_returns_none_when_due_datetime_missing() -> None:
    assert _compute_urgency(None) is None


def test_compute_urgency_critical_under_24h() -> None:
    soon = datetime.now(timezone.utc) + timedelta(hours=5)
    assert _compute_urgency(soon) == OrderUrgency.critical


def test_compute_urgency_low_when_far_future() -> None:
    far = datetime.now(timezone.utc) + timedelta(days=30)
    assert _compute_urgency(far) == OrderUrgency.low


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


async def test_delete_order_not_found() -> None:
    db = AsyncMock()
    service = OrderService(db)
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.delete_order("missing")
