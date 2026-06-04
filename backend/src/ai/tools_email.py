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
        "Returns the subject line and body text. "
        "IMPORTANT: this only creates a draft — it does NOT send any email. "
        "Always tell the user the result is a draft they can review."
    ),
    parameters={
        "type": "object",
        "properties": {
            "customer_name": {
                "type": "string",
                "description": "Full name of the email recipient.",
            },
            "subject": {
                "type": "string",
                "description": "Email subject line.",
            },
            "body": {
                "type": "string",
                "description": "Email body text (plain text, no HTML).",
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
    **_: object,
) -> dict:
    final_subject, html_body = build_customer_email(customer_name, subject, body)
    return {
        "subject": final_subject,
        "body_text": body,
        "preview_html": html_body,
        "note": "This is a draft only — no email has been sent.",
    }
