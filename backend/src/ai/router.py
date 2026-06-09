import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.constants import MAX_TOOL_ROUNDS  # noqa: F401 — used in service
from src.ai.schemas import ChatRequestSchema
from src.ai.service import AgentRunner, build_system_prompt
from src.ai.tool_registry import tool_registry
from src.core.constants.http_messages import AI_NOT_CONFIGURED
from src.core.dependencies import get_db, get_org_context
from src.core.enums.error_codes import ErrorCode
from src.core.exceptions import ServiceUnavailableError
from src.core.rate_limit import limiter
from src.system_settings.repository import SystemSettingsRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/chat")
@limiter.limit("20/hour")
async def ai_chat(
    request: Request,
    body: ChatRequestSchema,
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_org_context),
) -> StreamingResponse:
    org_api_key: str | None = getattr(ctx.org, "openai_api_key", None)
    effective_key = org_api_key
    if not effective_key:
        sys_settings = await SystemSettingsRepository(db).get()
        effective_key = sys_settings.platform_openai_api_key or None

    if not effective_key:
        raise ServiceUnavailableError(AI_NOT_CONFIGURED, code=ErrorCode.AI_NOT_CONFIGURED)

    if not body.messages:
        raise HTTPException(status_code=422, detail="messages must not be empty")

    system_prompt = build_system_prompt(ctx.org.name)
    runner = AgentRunner(db, ctx.org_id, tool_registry, openai_api_key=effective_key)

    async def event_generator():
        async for event in runner.run_stream(body.messages, system_prompt):
            yield f"data: {event.model_dump_json()}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
