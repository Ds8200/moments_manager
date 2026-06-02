import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from src.config import settings
from src.core.constants.log_messages import WELCOME_EMAIL_FAILED, WELCOME_EMAIL_SENT

logger = logging.getLogger(__name__)


async def send_html_email(to_email: str, subject: str, html_body: str) -> None:
    if not settings.SMTP_USER:
        logger.warning("SMTP_USER not configured — email to %s skipped", to_email)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(WELCOME_EMAIL_SENT, to_email)
    except Exception as exc:
        logger.error(WELCOME_EMAIL_FAILED, to_email, exc)
