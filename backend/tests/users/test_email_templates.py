import base64
from unittest.mock import AsyncMock, MagicMock, patch

from src.core import email as email_module
from src.core.email import send_html_email
from src.users.email_templates import LOGO_CID, build_welcome_email


def test_build_welcome_email_embeds_logo_and_brand_colors() -> None:
    subject, html, inline_images = build_welcome_email(
        "new@example.com", "temp-pass-123", "magic-token-abc"
    )

    assert subject
    # logo referenced inline via cid
    assert f"cid:{LOGO_CID}" in html
    # brand purple applied somewhere in the template
    assert "#9C27B0" in html
    # magic quick-login link present
    assert "magic-token-abc" in html

    # logo bytes returned for inline embedding
    assert LOGO_CID in inline_images
    assert isinstance(inline_images[LOGO_CID], bytes)
    assert len(inline_images[LOGO_CID]) > 0


async def test_send_html_email_includes_inline_attachments(monkeypatch) -> None:
    monkeypatch.setattr(email_module.settings, "RESEND_API_KEY", "test-key")

    captured: dict = {}

    response = MagicMock()
    response.raise_for_status = MagicMock()

    client = AsyncMock()

    async def fake_post(url, json, headers):
        captured["payload"] = json
        return response

    client.post = fake_post

    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=client)
    cm.__aexit__ = AsyncMock(return_value=False)

    with patch.object(email_module.httpx, "AsyncClient", return_value=cm):
        await send_html_email(
            "to@example.com",
            "subject",
            "<p>cid:moments-logo</p>",
            inline_images={"moments-logo": b"PNGDATA"},
        )

    payload = captured["payload"]
    assert "attachments" in payload
    attachment = payload["attachments"][0]
    assert attachment["content_id"] == "moments-logo"
    assert attachment["content"] == base64.b64encode(b"PNGDATA").decode("ascii")


async def test_send_html_email_without_images_has_no_attachments(monkeypatch) -> None:
    monkeypatch.setattr(email_module.settings, "RESEND_API_KEY", "test-key")

    captured: dict = {}
    response = MagicMock()
    response.raise_for_status = MagicMock()
    client = AsyncMock()

    async def fake_post(url, json, headers):
        captured["payload"] = json
        return response

    client.post = fake_post
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=client)
    cm.__aexit__ = AsyncMock(return_value=False)

    with patch.object(email_module.httpx, "AsyncClient", return_value=cm):
        await send_html_email("to@example.com", "subject", "<p>hi</p>")

    assert "attachments" not in captured["payload"]
