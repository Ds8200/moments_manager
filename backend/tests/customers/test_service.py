from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import BackgroundTasks

from src.core.exceptions import ConflictError, NotFoundError
from src.core.schemas import PaginationParams
from src.customers.schemas import (
    ComposeEmailSchema,
    CustomerCreateSchema,
    CustomerSendEmailSchema,
    CustomerUpdateSchema,
)
from src.customers.service import CustomerService

pytestmark = pytest.mark.asyncio


def _make_customer(customer_id: str = "c-1", name: str = "Test") -> MagicMock:
    customer = MagicMock()
    customer.id = customer_id
    customer.name = name
    customer.phone = None
    customer.email = None
    customer.notes = None
    customer.created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    customer.updated_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    return customer


def _make_org(*, smtp_configured: bool = True) -> MagicMock:
    org = MagicMock()
    org.name = "עסק לדוגמה"
    org.logo_path = None
    org.brand_colors = None
    org.smtp_host = "smtp.example.com" if smtp_configured else None
    org.smtp_port = 587
    org.smtp_username = "user@example.com"
    org.smtp_password = "secret" if smtp_configured else None
    org.smtp_from_email = "user@example.com"
    org.smtp_from_name = "עסק לדוגמה"
    return org


async def test_get_customer_raises_not_found_when_missing() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.get_customer("nope")


async def test_update_customer_raises_not_found_when_missing() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.update_customer("nope", CustomerUpdateSchema(name="X"))


async def test_delete_customer_raises_not_found_when_missing() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.delete_customer("nope")


def _make_sys_settings(*, smtp_configured: bool = False) -> MagicMock:
    s = MagicMock()
    s.platform_smtp_host = "smtp.example.com" if smtp_configured else None
    s.platform_smtp_password = "secret" if smtp_configured else None
    s.platform_smtp_port = 587
    s.platform_smtp_username = "platform@example.com"
    s.platform_smtp_from_email = "platform@example.com"
    s.platform_smtp_from_name = "Nihulo"
    return s


async def test_create_customer_commits() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    customer = _make_customer()
    customer.email = None  # no email — skips welcome email path
    service._repo.create.return_value = customer
    service._repo.get_by_id.return_value = customer

    bg = BackgroundTasks()
    result = await service.create_customer(
        CustomerCreateSchema(name="Test"), bg, _make_org(), _make_sys_settings()
    )

    assert result.name == "Test"
    db.commit.assert_awaited_once()


async def test_create_customer_dispatches_welcome_email_when_platform_smtp_configured() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    customer = _make_customer()
    customer.email = "customer@example.com"
    service._repo.create.return_value = customer
    service._repo.get_by_id.return_value = customer

    bg = BackgroundTasks()
    sys_s = _make_sys_settings(smtp_configured=True)
    with patch("src.customers.service.send_html_email_via_smtp") as mock_send:
        await service.create_customer(
            CustomerCreateSchema(name="Test"), bg, _make_org(), sys_s
        )

    assert len(bg.tasks) == 1
    assert bg.tasks[0].func is mock_send


async def test_create_customer_skips_welcome_email_when_no_platform_smtp() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    customer = _make_customer()
    customer.email = "customer@example.com"
    service._repo.create.return_value = customer
    service._repo.get_by_id.return_value = customer

    bg = BackgroundTasks()
    sys_s = _make_sys_settings(smtp_configured=False)
    await service.create_customer(
        CustomerCreateSchema(name="Test"), bg, _make_org(), sys_s
    )

    assert len(bg.tasks) == 0


async def test_create_customer_skips_welcome_email_when_no_customer_email() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    customer = _make_customer()
    customer.email = None
    service._repo.create.return_value = customer
    service._repo.get_by_id.return_value = customer

    bg = BackgroundTasks()
    await service.create_customer(
        CustomerCreateSchema(name="Test"), bg, _make_org(), _make_sys_settings(smtp_configured=True)
    )

    assert len(bg.tasks) == 0


async def test_list_customers_computes_pages() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    service._repo.get_all.return_value = ([_make_customer() for _ in range(5)], 12)

    result = await service.list_customers(PaginationParams(page=1, page_size=5))

    assert result.total == 12
    assert result.pages == 3
    assert len(result.items) == 5


async def test_send_email_to_customer_not_found() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    service._repo.get_by_id.return_value = None

    with pytest.raises(NotFoundError):
        await service.send_email_to_customer(
            "nope",
            CustomerSendEmailSchema(subject="hi", body="hello"),
            BackgroundTasks(),
            _make_org(),
        )


async def test_send_email_to_customer_no_email() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    customer = _make_customer()
    customer.email = None
    service._repo.get_by_id.return_value = customer

    with pytest.raises(ConflictError):
        await service.send_email_to_customer(
            "c-1",
            CustomerSendEmailSchema(subject="hi", body="hello"),
            BackgroundTasks(),
            _make_org(),
        )


async def test_send_email_to_customer_org_email_not_configured() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    customer = _make_customer()
    customer.email = "test@example.com"
    service._repo.get_by_id.return_value = customer

    with pytest.raises(ConflictError):
        await service.send_email_to_customer(
            "c-1",
            CustomerSendEmailSchema(subject="hi", body="hello"),
            BackgroundTasks(),
            _make_org(smtp_configured=False),
        )


async def test_send_email_to_customer_queues_task() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    customer = _make_customer()
    customer.email = "test@example.com"
    service._repo.get_by_id.return_value = customer

    bg = BackgroundTasks()
    with patch("src.customers.service.send_html_email_via_smtp") as mock_send:
        result = await service.send_email_to_customer(
            "c-1", CustomerSendEmailSchema(subject="נושא", body="גוף"), bg, _make_org()
        )

    assert result.message
    assert len(bg.tasks) == 1
    task_func = bg.tasks[0].func
    assert task_func is mock_send


async def test_compose_email_org_email_not_configured() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()

    with pytest.raises(ConflictError):
        await service.compose_email(
            ComposeEmailSchema(customer_ids=[], manual_emails=["a@b.com"], subject="s", body="b"),
            BackgroundTasks(),
            _make_org(smtp_configured=False),
        )


async def test_compose_email_sends_to_all_recipients() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    c1 = _make_customer("c-1", "Alice")
    c1.email = "alice@example.com"
    c2 = _make_customer("c-2", "Bob")
    c2.email = "bob@example.com"
    service._repo.get_by_ids.return_value = [c1, c2]

    bg = BackgroundTasks()
    with patch("src.customers.service.send_html_email_via_smtp"):
        result = await service.compose_email(
            ComposeEmailSchema(
                customer_ids=["c-1", "c-2"],
                manual_emails=["manual@example.com"],
                subject="נושא",
                body="גוף",
            ),
            bg,
            _make_org(),
        )

    assert result.sent_to == 3
    assert len(bg.tasks) == 3


async def test_compose_email_skips_customer_without_email() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    customer = _make_customer("c-1", "No Email")
    customer.email = None
    service._repo.get_by_ids.return_value = [customer]

    bg = BackgroundTasks()
    with patch("src.customers.service.send_html_email_via_smtp"):
        result = await service.compose_email(
            ComposeEmailSchema(customer_ids=["c-1"], manual_emails=[], subject="s", body="b"),
            bg,
            _make_org(),
        )

    assert result.sent_to == 0
    assert len(bg.tasks) == 0


async def test_compose_email_skips_missing_customer_id() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    service._repo.get_by_ids.return_value = []

    bg = BackgroundTasks()
    with patch("src.customers.service.send_html_email_via_smtp"):
        result = await service.compose_email(
            ComposeEmailSchema(
                customer_ids=["missing-id"], manual_emails=[], subject="s", body="b"
            ),
            bg,
            _make_org(),
        )

    assert result.sent_to == 0


async def test_compose_email_fetches_customers_in_batch() -> None:
    db = AsyncMock()
    service = CustomerService(db, "test-org-id")
    service._repo = AsyncMock()
    c1 = _make_customer("c-1", "Alice")
    c1.email = "alice@example.com"
    c2 = _make_customer("c-2", "Bob")
    c2.email = "bob@example.com"
    service._repo.get_by_ids.return_value = [c1, c2]

    bg = BackgroundTasks()
    with patch("src.customers.service.send_html_email_via_smtp"):
        await service.compose_email(
            ComposeEmailSchema(
                customer_ids=["c-1", "c-2"], manual_emails=[], subject="s", body="b"
            ),
            bg,
            _make_org(),
        )

    service._repo.get_by_ids.assert_awaited_once_with(["c-1", "c-2"])
    service._repo.get_by_id.assert_not_awaited()
