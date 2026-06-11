import base64
import logging
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from src.core.constants.log_messages import SMTP_EMAIL_FAILED, SMTP_EMAIL_SENT

logger = logging.getLogger(__name__)


def platform_smtp_kwargs(sys_settings) -> dict | None:
    """Return SMTP kwargs dict for the platform sender, or None if not configured."""
    if not (sys_settings.platform_smtp_host and sys_settings.platform_smtp_password):
        return None
    return {
        "host": sys_settings.platform_smtp_host,
        "port": sys_settings.platform_smtp_port or 587,
        "username": sys_settings.platform_smtp_username or "",
        "password": sys_settings.platform_smtp_password,
        "from_email": sys_settings.platform_smtp_from_email
        or sys_settings.platform_smtp_username
        or "",
        "from_name": sys_settings.platform_smtp_from_name or "Nihulo",
    }


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
    attachments: list[dict[str, str]] | None = None,
) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    for attachment in attachments or []:
        part = MIMEApplication(base64.b64decode(attachment["content"]))
        part.add_header("Content-Disposition", "attachment", filename=attachment["name"])
        msg.attach(part)

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
