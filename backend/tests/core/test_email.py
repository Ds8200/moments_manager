import base64
from unittest.mock import AsyncMock, patch

import pytest

from src.core import email as email_module
from src.core.email import send_html_email_via_smtp

pytestmark = pytest.mark.asyncio  # applies only to async test functions

_SMTP_KWARGS = {
    "host": "smtp.example.com",
    "port": 587,
    "username": "user@example.com",
    "password": "secret",
    "from_email": "user@example.com",
    "from_name": "עסק לדוגמה",
    "to_email": "to@example.com",
    "subject": "subject",
    "html_body": "<p>body</p>",
}


async def test_send_html_email_via_smtp_sends_and_logs_success() -> None:
    with patch.object(email_module.aiosmtplib, "send", new=AsyncMock()) as mock_send:
        with patch.object(email_module.logger, "info") as mock_info:
            await send_html_email_via_smtp(**_SMTP_KWARGS)

    mock_send.assert_called_once()
    msg, kwargs = mock_send.call_args[0][0], mock_send.call_args[1]
    assert kwargs["hostname"] == "smtp.example.com"
    assert kwargs["port"] == 587
    assert kwargs["username"] == "user@example.com"
    assert kwargs["password"] == "secret"
    assert kwargs["start_tls"] is True
    assert msg["To"] == "to@example.com"
    assert msg["Subject"] == "subject"
    mock_info.assert_called_once()


async def test_send_html_email_via_smtp_logs_error_on_failure() -> None:
    with patch.object(
        email_module.aiosmtplib, "send", new=AsyncMock(side_effect=Exception("boom"))
    ):
        with patch.object(email_module.logger, "error") as mock_error:
            await send_html_email_via_smtp(**_SMTP_KWARGS)

    mock_error.assert_called_once()


async def test_send_html_email_via_smtp_attaches_files() -> None:
    content = base64.b64encode(b"file-bytes").decode()
    kwargs = {
        **_SMTP_KWARGS,
        "attachments": [{"name": "invoice.pdf", "content": content}],
    }

    with patch.object(email_module.aiosmtplib, "send", new=AsyncMock()) as mock_send:
        await send_html_email_via_smtp(**kwargs)

    msg = mock_send.call_args[0][0]
    parts = msg.get_payload()
    assert len(parts) == 2
    attachment_part = parts[1]
    assert attachment_part.get_filename() == "invoice.pdf"
    assert base64.b64decode(attachment_part.get_payload()) == b"file-bytes"
