import json
import logging
import re
from collections.abc import AsyncGenerator
from pathlib import Path

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.constants import (
    BUSINESS_ADVISOR_PROMPT,
    MAX_TOOL_ROUNDS,
    OPENAI_MODEL,
    PROMPTS_DIR,
)
from src.ai.schemas import ChatMessageSchema, SSEEventSchema
from src.ai.tool_registry import ToolRegistry
from src.config import settings
from src.core.constants import log_messages

logger = logging.getLogger(__name__)

# Guards against models that accidentally leak function-call syntax in text output.
# Applied per-chunk; cross-chunk leakage is not caught but is exceedingly rare.
_FUNCTION_CALL_RE = re.compile(r"<function=\w+>.*?</function>", re.DOTALL)

_CACHED_PROMPT: str | None = None


def load_system_prompt() -> str:
    global _CACHED_PROMPT  # noqa: PLW0603 — intentional module-level cache
    if _CACHED_PROMPT is None:
        prompt_path = (
            Path(__file__).parent.parent.parent / PROMPTS_DIR / BUSINESS_ADVISOR_PROMPT
        )
        _CACHED_PROMPT = prompt_path.read_text(encoding="utf-8")
    return _CACHED_PROMPT


def _build_tools(registry: ToolRegistry) -> list[dict]:
    return [
        {
            "type": "function",
            "function": {
                "name": t["name"],
                "description": t["description"],
                "parameters": t["parameters"],
            },
        }
        for t in registry.all_declarations()
    ]


def _build_messages(
    system_prompt: str,
    messages: list[ChatMessageSchema],
) -> list[dict]:
    result: list[dict] = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        result.append({"role": msg.role, "content": msg.content})
    return result


class AgentRunner:
    def __init__(self, db: AsyncSession, registry: ToolRegistry) -> None:
        self._db = db
        self._registry = registry

    async def run_stream(
        self,
        messages: list[ChatMessageSchema],
        system_prompt: str,
    ) -> AsyncGenerator[SSEEventSchema, None]:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        tools = _build_tools(self._registry)
        conversation = _build_messages(system_prompt, messages)

        logger.info(log_messages.AI_TURN_START, len(messages))

        tool_rounds = 0

        try:
            while tool_rounds < MAX_TOOL_ROUNDS:
                # Real streaming: text tokens are forwarded immediately as they arrive.
                # Tool-call chunks are accumulated across the stream until complete,
                # then executed synchronously before the next round.
                stream = await client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=conversation,  # type: ignore[arg-type]
                    tools=tools,  # type: ignore[arg-type]
                    tool_choice="auto",
                    parallel_tool_calls=True,
                    stream=True,
                )

                # Accumulators for this round
                # tool_calls_acc: index → {id, name, arguments}
                tool_calls_acc: dict[int, dict[str, str]] = {}
                content_parts: list[str] = []
                finish_reason: str | None = None

                async for chunk in stream:
                    if not chunk.choices:
                        continue

                    choice = chunk.choices[0]
                    delta = choice.delta

                    if choice.finish_reason:
                        finish_reason = choice.finish_reason

                    # Text token — sanitize and forward immediately
                    if delta.content:
                        clean = _FUNCTION_CALL_RE.sub("", delta.content)
                        if clean:
                            content_parts.append(clean)
                            yield SSEEventSchema(type="token", content=clean)

                    # Tool-call chunks — accumulate by index until stream ends
                    if delta.tool_calls:
                        for tc_delta in delta.tool_calls:
                            idx = tc_delta.index
                            if idx not in tool_calls_acc:
                                tool_calls_acc[idx] = {
                                    "id": "",
                                    "name": "",
                                    "arguments": "",
                                }
                            if tc_delta.id:
                                tool_calls_acc[idx]["id"] = tc_delta.id
                            if tc_delta.function:
                                if tc_delta.function.name:
                                    tool_calls_acc[idx]["name"] += tc_delta.function.name
                                if tc_delta.function.arguments:
                                    tool_calls_acc[idx]["arguments"] += (
                                        tc_delta.function.arguments
                                    )

                # ── Stream for this round is complete ──────────────────────────

                if finish_reason == "tool_calls" and tool_calls_acc:
                    # Reconstruct the assistant message for conversation history
                    ordered_calls = [tool_calls_acc[i] for i in sorted(tool_calls_acc)]
                    assistant_msg: dict = {
                        "role": "assistant",
                        "content": "".join(content_parts) or None,
                        "tool_calls": [
                            {
                                "id": v["id"],
                                "type": "function",
                                "function": {
                                    "name": v["name"],
                                    "arguments": v["arguments"],
                                },
                            }
                            for v in ordered_calls
                        ],
                    }
                    conversation.append(assistant_msg)

                    # Execute each tool call and append its result
                    for v in ordered_calls:
                        tool_name = v["name"]
                        try:
                            raw = json.loads(v["arguments"] or "{}")
                            args = raw if isinstance(raw, dict) else {}
                        except (json.JSONDecodeError, TypeError):
                            args = {}

                        logger.info(log_messages.AI_TOOL_CALLED, tool_name)
                        yield SSEEventSchema(type="tool_call", tool_name=tool_name)

                        try:
                            result = await self._registry.execute(
                                tool_name, args, self._db
                            )
                        except Exception as exc:
                            logger.error(log_messages.AI_TOOL_ERROR, tool_name, exc)
                            result = {"error": str(exc)}

                        yield SSEEventSchema(
                            type="tool_result",
                            tool_name=tool_name,
                            data=result,
                        )
                        conversation.append({
                            "role": "tool",
                            "tool_call_id": v["id"],
                            "content": json.dumps(result, ensure_ascii=False),
                        })

                    tool_rounds += 1

                else:
                    # Text response — already streamed token-by-token above
                    logger.info(log_messages.AI_TURN_DONE, tool_rounds)
                    yield SSEEventSchema(type="done")
                    return

            # Reached MAX_TOOL_ROUNDS without a final text response
            yield SSEEventSchema(type="done")

        except Exception as exc:
            logger.error(log_messages.AI_API_ERROR, exc)
            error_str = str(exc)
            if "insufficient_quota" in error_str.lower() or "billing" in error_str.lower():
                friendly = "יש בעיה בחשבון OpenAI. בדוק את פרטי התשלום בפלטפורמה."
            elif "429" in error_str or "rate_limit" in error_str.lower() or "quota" in error_str.lower():  # noqa: E501
                friendly = "המכסה של ה-AI מוצתה. נסה שנית בעוד מספר שניות."
            elif "401" in error_str or "invalid_api_key" in error_str.lower() or "authentication" in error_str.lower():  # noqa: E501
                friendly = "מפתח ה-API אינו תקין. פנה למנהל המערכת."
            elif "503" in error_str or "unavailable" in error_str.lower():
                friendly = "שירות ה-AI אינו זמין כרגע. נסה שנית בעוד מספר דקות."
            else:
                friendly = "אירעה שגיאה בשירות ה-AI. נסה שנית."
            yield SSEEventSchema(type="error", error=friendly)
