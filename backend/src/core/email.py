import base64
import logging

import httpx

from src.config import settings
from src.core.constants.log_messages import WELCOME_EMAIL_FAILED, WELCOME_EMAIL_SENT

logger = logging.getLogger(__name__)

RESEND_SEND_URL = "https://api.resend.com/emails"


async def send_html_email(
    to_email: str,
    subject: str,
    html_body: str,
    inline_images: dict[str, bytes] | None = None,
) -> None:
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured — email to %s skipped", to_email)
        return

    sender = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"

    payload: dict = {
        "from": sender,
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    }
    if inline_images:
        # Resend inline attachments: referenced from the HTML via cid:<content_id>
        payload["attachments"] = [
            {
                "filename": f"{cid}.png",
                "content": base64.b64encode(data).decode("ascii"),
                "content_id": cid,
            }
            for cid, data in inline_images.items()
        ]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                RESEND_SEND_URL,
                json=payload,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            )
            response.raise_for_status()
        logger.info(WELCOME_EMAIL_SENT, to_email)
    except Exception as exc:
        logger.error(WELCOME_EMAIL_FAILED, to_email, exc)
