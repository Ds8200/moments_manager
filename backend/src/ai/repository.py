"""Read-only query methods that power the AI agent's analytical tools."""

import logging
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import and_, extract, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.customers.models import Customer
from src.database import BaseRepository
from src.orders.enums import OrderStatus
from src.orders.models import Order, OrderItem
from src.products.models import Product

logger = logging.getLogger(__name__)

_ACTIVE_STATUSES = [
    OrderStatus.new.value,
    OrderStatus.waiting_approval.value,
    OrderStatus.approved.value,
    OrderStatus.printing.value,
    OrderStatus.ready.value,
]


def _search_terms(query: str) -> list[str]:
    """Return search variants by stripping the longest matching Hebrew plural suffix."""
    suffixes = ("יות", "ות", "ים", "ם")
    terms: set[str] = {query}
    for suffix in suffixes:
        if query.endswith(suffix) and len(query) - len(suffix) >= 2:
            terms.add(query[: -len(suffix)])
            break
    return list(terms)


class AiRepository(BaseRepository):
    def __init__(self, db: AsyncSession, org_id: str) -> None:
        super().__init__(db, org_id)

    async def get_customer_profile(self, customer_name: str) -> dict | None:
        """Returns full customer profile including recent orders and stats."""
        await self._apply_org_rls()
        cust_result = await self._db.execute(
            select(Customer)
            .where(
                Customer.organization_id == self._org_id,
                Customer.name.ilike(f"%{customer_name}%"),
                Customer.is_deleted.is_(False),
            )
            .order_by(Customer.name)
            .limit(1)
        )
        customer = cust_result.scalar_one_or_none()
        if customer is None:
            return None

        stats_result = await self._db.execute(
            select(
                func.count(Order.id),
                func.coalesce(func.sum(Order.total_amount), Decimal("0")),
                func.max(Order.date),
            ).where(
                Order.customer_id == customer.id,
                Order.organization_id == self._org_id,
                Order.is_deleted.is_(False),
            )
        )
        count, total_spent, last_order_date = stats_result.one()

        recent_result = await self._db.execute(
            select(Order)
            .where(
                Order.customer_id == customer.id,
                Order.organization_id == self._org_id,
                Order.is_deleted.is_(False),
            )
            .order_by(Order.created_at.desc())
            .limit(3)
        )
        recent_orders = [
            {
                "order_number": o.order_number,
                "date": str(o.date),
                "total_amount": str(o.total_amount),
                "status": o.status,
                "is_paid": o.is_paid,
            }
            for o in recent_result.scalars().all()
        ]

        return {
            "name": customer.name,
            "phone": customer.phone,
            "email": customer.email,
            "notes": customer.notes,
            "order_count": count,
            "total_spent": str(total_spent),
            "last_order_date": str(last_order_date) if last_order_date else None,
            "recent_orders": recent_orders,
        }

    async def get_unpaid_invoices(self, min_days_old: int = 0) -> list[dict]:
        """Returns unpaid orders older than min_days_old days, sorted by amount."""
        await self._apply_org_rls()
        cutoff = date.today() - timedelta(days=min_days_old)
        result = await self._db.execute(
            select(Order)
            .options(selectinload(Order.customer))
            .where(
                and_(
                    Order.organization_id == self._org_id,
                    Order.is_deleted.is_(False),
                    Order.is_paid.is_(False),
                    Order.status != OrderStatus.cancelled.value,
                    Order.date <= cutoff,
                )
            )
            .order_by(Order.total_amount.desc(), Order.date.asc())
        )
        today = date.today()
        return [
            {
                "customer_name": o.customer.name if o.customer else "לקוח לא ידוע",
                "order_number": o.order_number,
                "total_amount": str(o.total_amount),
                "date": str(o.date),
                "days_since_order": (today - o.date).days,
                "status": o.status,
            }
            for o in result.scalars().all()
        ]

    async def get_pipeline_by_status(self) -> dict:
        """Returns value and count of active orders grouped by status."""
        await self._apply_org_rls()
        result = await self._db.execute(
            select(
                Order.status,
                func.count(Order.id),
                func.coalesce(func.sum(Order.total_amount), Decimal("0")),
            )
            .where(
                Order.organization_id == self._org_id,
                Order.is_deleted.is_(False),
                Order.status.in_(_ACTIVE_STATUSES),
            )
            .group_by(Order.status)
        )
        rows = result.all()
        by_status: dict[str, dict] = {}
        grand_total = Decimal("0")
        grand_count = 0
        for status, count, total in rows:
            by_status[status] = {"count": count, "value": str(total)}
            grand_total += total
            grand_count += count
        return {
            "total_value": str(grand_total),
            "total_count": grand_count,
            "by_status": by_status,
        }

    async def get_product_performance(self, year: int, month: int | None, limit: int) -> list[dict]:
        """Returns revenue and profit per product name for a given period."""
        await self._apply_org_rls()
        filters = [
            Order.organization_id == self._org_id,
            Order.is_deleted.is_(False),
            extract("year", Order.date) == year,
        ]
        if month is not None:
            filters.append(extract("month", Order.date) == month)

        result = await self._db.execute(
            select(
                OrderItem.product_name,
                func.count(OrderItem.order_id.distinct()),
                func.coalesce(func.sum(OrderItem.total_price), Decimal("0")),
                func.coalesce(func.sum(OrderItem.profit), Decimal("0")),
            )
            .join(Order, OrderItem.order_id == Order.id)
            .where(and_(*filters))
            .group_by(OrderItem.product_name)
            .order_by(func.sum(OrderItem.total_price).desc())
            .limit(limit)
        )
        return [
            {
                "product_name": row[0],
                "order_count": row[1],
                "revenue": str(row[2]),
                "profit": str(row[3]),
                "margin_pct": (
                    round(float(row[3]) / float(row[2]) * 100, 1) if row[2] and row[2] > 0 else 0.0
                ),
            }
            for row in result.all()
        ]

    async def search_orders(self, query: str, limit: int) -> dict:
        """Free-text search across order numbers, customer names, notes, and product names."""
        await self._apply_org_rls()
        terms = [f"%{t}%" for t in _search_terms(query)]
        customer_ids = select(Customer.id).where(
            Customer.organization_id == self._org_id,
            or_(*[Customer.name.ilike(t) for t in terms]),
        )
        order_ids_by_product = select(OrderItem.order_id).where(
            or_(*[OrderItem.product_name.ilike(t) for t in terms])
        )
        result = await self._db.execute(
            select(Order)
            .options(selectinload(Order.customer))
            .where(
                Order.organization_id == self._org_id,
                Order.is_deleted.is_(False),
                or_(
                    *[Order.order_number.ilike(t) for t in terms],
                    Order.customer_id.in_(customer_ids),
                    *[Order.notes.ilike(t) for t in terms],
                    Order.id.in_(order_ids_by_product),
                ),
            )
            .order_by(Order.created_at.desc())
            .limit(limit)
        )
        orders = list(result.scalars().all())
        return {
            "orders": [
                {
                    "order_number": o.order_number,
                    "customer": o.customer.name if o.customer else "לקוח לא ידוע",
                    "total_amount": str(o.total_amount),
                    "status": o.status,
                    "urgency": o.urgency,
                    "date": str(o.date),
                    "due_datetime": str(o.due_datetime) if o.due_datetime else None,
                    "is_paid": o.is_paid,
                }
                for o in orders
            ],
            "count": len(orders),
            "query": query,
        }

    async def get_inactive_customers(self, days_since: int, limit: int) -> list[dict]:
        """Returns customers with no order in the last days_since days."""
        await self._apply_org_rls()
        cutoff = date.today() - timedelta(days=days_since)
        result = await self._db.execute(
            select(
                Customer.name,
                func.max(Order.date).label("last_order_date"),
                func.count(Order.id).label("total_orders"),
            )
            .outerjoin(
                Order,
                and_(
                    Order.customer_id == Customer.id,
                    Order.organization_id == self._org_id,
                    Order.is_deleted.is_(False),
                ),
            )
            .where(
                Customer.organization_id == self._org_id,
                Customer.is_deleted.is_(False),
            )
            .group_by(Customer.id, Customer.name)
            .having(
                or_(
                    func.max(Order.date) < cutoff,
                    func.max(Order.date).is_(None),
                )
            )
            .order_by(func.max(Order.date).asc().nullsfirst())
            .limit(limit)
        )
        today = date.today()
        return [
            {
                "customer_name": row.name,
                "last_order_date": str(row.last_order_date) if row.last_order_date else None,
                "days_inactive": (
                    (today - row.last_order_date).days if row.last_order_date else None
                ),
                "total_orders": row.total_orders,
            }
            for row in result.all()
        ]

    async def get_order_items_by_number(self, order_number: str) -> dict | None:
        """Returns full item breakdown of an order identified by order_number."""
        await self._apply_org_rls()
        result = await self._db.execute(
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.customer),
            )
            .where(
                Order.organization_id == self._org_id,
                Order.order_number == order_number,
                Order.is_deleted.is_(False),
            )
        )
        order = result.scalar_one_or_none()
        if order is None:
            return None
        return {
            "order_number": order.order_number,
            "customer": order.customer.name if order.customer else "לקוח לא ידוע",
            "date": str(order.date),
            "status": order.status,
            "urgency": order.urgency,
            "is_paid": order.is_paid,
            "total_amount": str(order.total_amount),
            "items": [
                {
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "unit_price": str(item.unit_price),
                    "total_price": str(item.total_price),
                    "profit": str(item.profit),
                    "design_notes": item.design_notes,
                }
                for item in order.items
            ],
            "item_count": len(order.items),
        }

    async def get_product_catalog(
        self, search: str | None, active_only: bool, limit: int
    ) -> list[dict]:
        """Returns products from the catalog with category and pricing."""
        await self._apply_org_rls()
        query = (
            select(Product)
            .options(selectinload(Product.category))
            .where(
                Product.organization_id == self._org_id,
                Product.is_deleted.is_(False),
            )
        )
        if search:
            search_filters = [Product.name.ilike(f"%{t}%") for t in _search_terms(search)]
            query = query.where(or_(*search_filters))
        if active_only:
            query = query.where(Product.is_active.is_(True))
        query = query.order_by(Product.name).limit(limit)

        result = await self._db.execute(query)
        return [
            {
                "name": p.name,
                "category": p.category.name if p.category else None,
                "base_price": str(p.base_price),
                "base_cost": str(p.base_cost),
                "avg_production_days": p.avg_production_days,
                "is_active": p.is_active,
            }
            for p in result.scalars().all()
        ]

    async def find_customer_id_by_name(self, customer_name: str) -> str | None:
        """Returns the ID of the first customer whose name contains customer_name."""
        await self._apply_org_rls()
        result = await self._db.execute(
            select(Customer.id)
            .where(
                Customer.organization_id == self._org_id,
                Customer.name.ilike(f"%{customer_name}%"),
                Customer.is_deleted.is_(False),
            )
            .order_by(Customer.name)
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def search_order_numbers(self, partial: str, limit: int = 10) -> list[str]:
        """Returns order numbers matching a partial string — for order disambiguation."""
        await self._apply_org_rls()
        result = await self._db.execute(
            select(Order.order_number)
            .where(
                Order.organization_id == self._org_id,
                Order.is_deleted.is_(False),
                Order.order_number.ilike(f"%{partial.strip()}%"),
            )
            .order_by(Order.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_all_customer_names(self, limit: int = 50) -> list[str]:
        """Returns all active customer names — passed to the LLM for disambiguation."""
        await self._apply_org_rls()
        result = await self._db.execute(
            select(Customer.name)
            .where(
                Customer.organization_id == self._org_id,
                Customer.is_deleted.is_(False),
            )
            .order_by(Customer.name)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_all_product_names(self, active_only: bool = True, limit: int = 50) -> list[str]:
        """Returns all product names — passed to the LLM for disambiguation."""
        await self._apply_org_rls()
        query = select(Product.name).where(
            Product.organization_id == self._org_id,
            Product.is_deleted.is_(False),
        )
        if active_only:
            query = query.where(Product.is_active.is_(True))
        result = await self._db.execute(query.order_by(Product.name).limit(limit))
        return list(result.scalars().all())
