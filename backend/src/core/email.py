import logging
from typing import Any

import httpx

from src.config import settings
from src.core.constants.log_messages import (
    BREVO_API_KEY_NOT_CONFIGURED,
    WELCOME_EMAIL_FAILED,
    WELCOME_EMAIL_SENT,
)

logger = logging.getLogger(__name__)

BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"


async def send_html_email(
    to_email: str,
    subject: str,
    html_body: str,
    attachments: list[dict[str, str]] | None = None,
) -> None:
    if not settings.BREVO_API_KEY:
        logger.warning(BREVO_API_KEY_NOT_CONFIGURED, to_email)
        return

    payload: dict[str, Any] = {
        "sender": {
            "name": settings.EMAIL_FROM_NAME,
            "email": settings.EMAIL_FROM,
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_body,
    }

    if attachments:
        # Brevo attachment format: [{"name": "file.pdf", "content": "<base64>"}]
        payload["attachment"] = attachments

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                BREVO_SEND_URL,
                json=payload,
                headers={"api-key": settings.BREVO_API_KEY},
            )
            if not response.is_success:
                logger.error(
                    WELCOME_EMAIL_FAILED, to_email, f"{response.status_code} {response.text}"
                )
                return
        logger.info(WELCOME_EMAIL_SENT, to_email)
    except Exception as exc:
        logger.error(WELCOME_EMAIL_FAILED, to_email, exc)
