import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

import aiosmtplib
import httpx

from src.config import settings
from src.core.constants.log_messages import (
    BREVO_API_KEY_NOT_CONFIGURED,
    WELCOME_EMAIL_FAILED,
    WELCOME_EMAIL_SENT,
)

logger = logging.getLogger(__name__)

SMTP_EMAIL_FAILED = "SMTP email to %s failed: %s"
SMTP_EMAIL_SENT = "SMTP email sent to %s via %s"

BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"


async def send_html_email(
    to_email: str,
    subject: str,
    html_body: str,
    attachments: list[dict[str, str]] | None = None,
    from_name: str | None = None,
) -> None:
    if not settings.BREVO_API_KEY:
        logger.warning(BREVO_API_KEY_NOT_CONFIGURED, to_email)
        return

    payload: dict[str, Any] = {
        "sender": {
            "name": from_name or settings.EMAIL_FROM_NAME,
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


async def send_html_email_via_smtp(
    host: str,
    port: int,
    username: str,
    password: str,
    from_email: str,
    from_name: str,
    to_email: str,
    subject: str,
    html_body: str,
) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=host,
            port=port,
            username=username,
            password=password,
            start_tls=True,
        )
        logger.info(SMTP_EMAIL_SENT, to_email, host)
    except Exception as exc:
        logger.error(SMTP_EMAIL_FAILED, to_email, exc)
