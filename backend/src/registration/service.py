import logging
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import ConflictError
from src.core.security import hash_password
from src.organizations.enums import OrgPlan, OrgRole
from src.organizations.repository import MembershipRepository, OrgRepository
from src.registration.schemas import RegistrationResponseSchema, RegistrationSchema
from src.users.enums import UserRole
from src.users.repository import UserRepository

logger = logging.getLogger(__name__)

_TRIAL_DAYS = 14
_TRIAL_MAX_USERS = 2


class RegistrationService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._users = UserRepository(db)
        self._orgs = OrgRepository(db)
        self._members = MembershipRepository(db)

    async def register(
        self,
        data: RegistrationSchema,
        background_tasks: BackgroundTasks,
    ) -> RegistrationResponseSchema:
        existing_user = await self._users.get_by_email(data.owner_email)
        if existing_user:
            from src.core.constants.http_messages import USER_EMAIL_EXISTS

            raise ConflictError(USER_EMAIL_EXISTS, code=ErrorCode.USER_EMAIL_EXISTS)

        if await self._orgs.slug_exists(data.slug):
            from src.organizations.constants import ORG_SLUG_EXISTS

            raise ConflictError(ORG_SLUG_EXISTS, code=ErrorCode.CONFLICT)

        # Create owner user
        hashed = hash_password(data.password)
        user = await self._users.create(
            email=data.owner_email,
            hashed_password=hashed,
            full_name=data.business_name,
            role=UserRole.user.value,
        )

        # Create organization (trial plan)
        trial_ends_at = datetime.now(timezone.utc) + timedelta(days=_TRIAL_DAYS)
        org = await self._orgs.create(
            slug=data.slug,
            name=data.business_name,
            owner_id=user.id,
            plan=OrgPlan.trial.value,
            max_users=_TRIAL_MAX_USERS,
            trial_ends_at=trial_ends_at,
        )

        # Create owner membership
        await self._members.create(
            org_id=org.id,
            user_id=user.id,
            role=OrgRole.owner.value,
        )

        await self._db.commit()

        logger.info("Organization registered: %s (slug=%s, owner=%s)", org.name, org.slug, user.id)

        background_tasks.add_task(
            _send_welcome_email, data.owner_email, data.business_name, data.slug
        )

        return RegistrationResponseSchema(
            org_id=org.id,
            org_slug=org.slug,
            user_id=user.id,
            message="Registration successful — check your email to get started",
        )


async def _send_welcome_email(owner_email: str, business_name: str, org_slug: str) -> None:
    from src.config import settings
    from src.core.email import send_html_email

    app_url = f"http://{org_slug}.{settings.APP_DOMAIN}"
    subject = f"ברוכים הבאים ל-{business_name}"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
      <h2>ברוכים הבאים, {business_name}!</h2>
      <p>הארגון שלך נוצר בהצלחה.</p>
      <p>
        <a href="{app_url}/onboarding"
           style="background:#3b5bdb;color:#fff;padding:12px 24px;
                  border-radius:4px;text-decoration:none;display:inline-block;">
          התחל להגדיר את העסק שלך
        </a>
      </p>
      <p style="color:#888;font-size:12px;">
        כתובת הכניסה שלך: <a href="{app_url}">{app_url}</a>
      </p>
    </div>
    """
    await send_html_email(owner_email, subject, html_body)
