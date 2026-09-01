from datetime import date, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from src.core.exceptions import NotFoundError
from src.core.schemas import PaginationParams
from src.orders.enums import OrderStatus, UrgencyLevel
from src.orders.schemas import OrderStatusUpdateSchema, OrderUpdateSchema, OrderUrgencyUpdateSchema
from src.orders.service import OrderService, _compute_item_fields

pytestmark = pytest.mark.asyncio


def _make_order_stub(items: list[SimpleNamespace]) -> SimpleNamespace:
    return SimpleNamespace(
        id="order-1",
        order_number="ORD-0001",
        customer_id="customer-1",
        customer_name="Customer A",
        date=date.today(),
        due_datetime=None,
        urgency=UrgencyLevel.normal,
        status=OrderStatus.new.value,
        is_paid=False,
        payment_method=None,
        total_amount="0",
        total_profit="0",
        notes=None,
        created_at=datetime.now(),
        items=items,
    )


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


async def test_list_orders_maps_item_summaries() -> None:
    db = AsyncMock()
    service = OrderService(db)
    service._repo = AsyncMock()
    order_items = [
        SimpleNamespace(id="item-1", product_id=None, product_name="Sticker", quantity=10),
        SimpleNamespace(id="item-2", product_id=None, product_name="Poster", quantity=2),
    ]
    order = _make_order_stub(order_items)
    service._repo.get_all.return_value = ([order], 1)

    result = await service.list_orders(PaginationParams())

    assert result.total == 1
    assert len(result.items) == 1
    assert [item.product_name for item in result.items[0].items] == ["Sticker", "Poster"]
    assert [item.quantity for item in result.items[0].items] == [10, 2]
    assert not hasattr(result.items[0], "item_count")


async def test_delete_order_not_found() -> None:
    db = AsyncMock()
    service = OrderService(db)
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.delete_order("missing")
