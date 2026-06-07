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
        "Generates a professional email draft using the organization's branded email template. "
        "Returns the subject line, body text, and routing data for the send button. "
        "IMPORTANT: this only creates a draft — it does NOT send any email. "
        "Always tell the user the result is a draft they can review and send via the button. "
        "Use is_bulk=true when the user wants to send to ALL customers "
        "(announcements, updates, promotions)."
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
                    "Set to true when sending to ALL customers "
                    "(announcements, updates, promotions). "
                    "Set to false (default) when sending to a single specific customer."
                ),
            },
        },
        "required": ["customer_name", "subject", "body"],
    },
)
async def draft_email(
    db: AsyncSession,
    org_id: str,
    customer_name: str,
    subject: str,
    body: str,
    is_bulk: bool = False,
    **_: object,
) -> dict:
    from src.ai.repository import AiRepository
    from src.organizations.repository import OrgRepository

    customer_id: str | None = None
    if not is_bulk:
        repo = AiRepository(db, org_id)
        customer_id = await repo.find_customer_id_by_name(customer_name)
        if customer_id is None:
            candidates = await repo.get_all_customer_names()
            return {
                "not_found": True,
                "searched_for": customer_name,
                "candidates": candidates,
            }

    org = await OrgRepository(db).get_by_id(org_id)
    org_name = org.name if org else ""

    final_subject, html_body = build_customer_email(customer_name, subject, body, org_name)
    return {
        "subject": final_subject,
        "body_text": body,
        "preview_html": html_body,
        "customer_id": customer_id,
        "customer_name": customer_name,
        "is_bulk": is_bulk,
        "note": "This is a draft only — no email has been sent.",
    }
