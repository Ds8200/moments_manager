import logging

import httpx

from src.config import settings
from src.core.constants.log_messages import WELCOME_EMAIL_FAILED, WELCOME_EMAIL_SENT

logger = logging.getLogger(__name__)

RESEND_SEND_URL = "https://api.resend.com/emails"


async def send_html_email(to_email: str, subject: str, html_body: str) -> None:
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured — email to %s skipped", to_email)
        return

    sender = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                RESEND_SEND_URL,
                json={
                    "from": sender,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_body,
                },
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            )
            if not response.is_success:
                logger.error(
                    WELCOME_EMAIL_FAILED, to_email,
                    f"{response.status_code} {response.text}"
                )
                return
        logger.info(WELCOME_EMAIL_SENT, to_email)
    except Exception as exc:
        logger.error(WELCOME_EMAIL_FAILED, to_email, exc)
