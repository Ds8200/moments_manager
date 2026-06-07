from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core import email as email_module
from src.core.email import send_html_email
from src.users.email_templates import BRAND_PURPLE, LOGO_URL, build_welcome_email

pytestmark = pytest.mark.asyncio  # applies only to async test functions


def test_build_welcome_email_contains_logo_and_brand_colors() -> None:
    subject, html = build_welcome_email(
        "new@example.com", "temp-pass-123", "magic-token-abc", "עסק לדוגמה"
    )

    assert subject
    assert "עסק לדוגמה" in subject
    # logo referenced via hosted URL
    assert LOGO_URL in html
    # brand purple applied to headings/buttons
    assert BRAND_PURPLE in html
    # magic quick-login link present
    assert "magic-token-abc" in html
    # credential values interpolated
    assert "new@example.com" in html
    assert "temp-pass-123" in html
    # org name interpolated into body and footer
    assert "עסק לדוגמה" in html


def test_build_welcome_email_returns_two_tuple() -> None:
    result = build_welcome_email("a@b.com", "pw", "tok", "עסק לדוגמה")
    assert isinstance(result, tuple)
    assert len(result) == 2
    subject, html = result
    assert isinstance(subject, str)
    assert isinstance(html, str)


async def test_send_html_email_posts_to_brevo(monkeypatch) -> None:
    monkeypatch.setattr(email_module.settings, "BREVO_API_KEY", "test-brevo-key")

    captured: dict = {}
    response = MagicMock()
    response.is_success = True
    client = AsyncMock()

    async def fake_post(url, json, headers):
        captured["url"] = url
        captured["payload"] = json
        captured["headers"] = headers
        return response

    client.post = fake_post
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=client)
    cm.__aexit__ = AsyncMock(return_value=False)

    with patch.object(email_module.httpx, "AsyncClient", return_value=cm):
        await send_html_email("to@example.com", "subject", "<p>body</p>")

    assert "brevo.com" in captured["url"]
    payload = captured["payload"]
    assert payload["to"] == [{"email": "to@example.com"}]
    assert payload["subject"] == "subject"
    assert payload["htmlContent"] == "<p>body</p>"
    assert captured["headers"]["api-key"] == "test-brevo-key"


async def test_send_html_email_skips_when_no_api_key(monkeypatch) -> None:
    monkeypatch.setattr(email_module.settings, "BREVO_API_KEY", "")

    with patch.object(email_module.httpx, "AsyncClient") as mock_client:
        await send_html_email("to@example.com", "subject", "<p>body</p>")

    mock_client.assert_not_called()


async def test_send_html_email_logs_error_on_non_success(monkeypatch) -> None:
    monkeypatch.setattr(email_module.settings, "BREVO_API_KEY", "test-key")

    response = MagicMock()
    response.is_success = False
    response.status_code = 400
    response.text = "Bad Request"
    client = AsyncMock()
    client.post = AsyncMock(return_value=response)
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=client)
    cm.__aexit__ = AsyncMock(return_value=False)

    with patch.object(email_module.httpx, "AsyncClient", return_value=cm):
        with patch.object(email_module.logger, "error") as mock_error:
            await send_html_email("to@example.com", "subject", "<p>body</p>")

    mock_error.assert_called_once()
