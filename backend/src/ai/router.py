import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.constants import MAX_TOOL_ROUNDS  # noqa: F401 — used in service
from src.ai.schemas import ChatRequestSchema
from src.ai.service import AgentRunner, load_system_prompt
from src.ai.tool_registry import tool_registry
from src.config import settings
from src.core.constants.http_messages import AI_NOT_CONFIGURED
from src.core.dependencies import get_current_user, get_db
from src.core.rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/chat")
@limiter.limit("20/hour")
async def ai_chat(
    request: Request,
    body: ChatRequestSchema,
    db: AsyncSession = Depends(get_db),
    _user: object = Depends(get_current_user),
) -> StreamingResponse:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail=AI_NOT_CONFIGURED)

    if not body.messages:
        raise HTTPException(status_code=422, detail="messages must not be empty")

    system_prompt = load_system_prompt()
    runner = AgentRunner(db, tool_registry)

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
