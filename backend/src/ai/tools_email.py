"""Email communication tools for the AI agent."""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.tool_registry import tool_registry
from src.customers.email_templates import build_customer_email

logger = logging.getLogger(__name__)


# ── Email Draft ────────────────────────────────────────────────────────────────


@tool_registry.register(
    name="draft_email",
    description=(
        "Generates a professional email draft using the Moments email template. "
        "Returns the subject line, body text, and routing data for the send button. "
        "IMPORTANT: this only creates a draft — it does NOT send any email. "
        "Always tell the user the result is a draft they can review and send via the button. "
        "Use is_bulk=true when the user wants to send to ALL customers (announcements, updates, promotions)."
    ),
    parameters={
        "type": "object",
        "properties": {
            "customer_name": {
                "type": "string",
                "description": (
                    "Full name of the email recipient. "
                    "When is_bulk=true, use a generic greeting like 'לקוחות יקרים'."
                ),
            },
            "subject": {
                "type": "string",
                "description": "Email subject line.",
            },
            "body": {
                "type": "string",
                "description": (
                    "Email body text (plain text, no HTML). "
                    "Write ONLY the main content — do NOT include a greeting (שלום...) "
                    "or a closing (תודה רבה, בברכה) because the email template already adds those."
                ),
            },
            "is_bulk": {
                "type": "boolean",
                "description": (
                    "Set to true when sending to ALL customers (announcements, updates, promotions). "
                    "Set to false (default) when sending to a single specific customer."
                ),
            },
        },
        "required": ["customer_name", "subject", "body"],
    },
)
async def draft_email(
    db: AsyncSession,
    customer_name: str,
    subject: str,
    body: str,
    is_bulk: bool = False,
    **_: object,
) -> dict:
    from src.ai.repository import AiRepository

    customer_id: str | None = None
    if not is_bulk:
        customer_id = await AiRepository(db).find_customer_id_by_name(customer_name)

    final_subject, html_body = build_customer_email(customer_name, subject, body)
    return {
        "subject": final_subject,
        "body_text": body,
        "preview_html": html_body,
        "customer_id": customer_id,
        "customer_name": customer_name,
        "is_bulk": is_bulk,
        "note": "This is a draft only — no email has been sent.",
    }
