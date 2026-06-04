import json
import logging
from collections.abc import AsyncGenerator
from pathlib import Path

from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.constants import (
    BUSINESS_ADVISOR_PROMPT,
    GROQ_MODEL,
    MAX_TOOL_ROUNDS,
    PROMPTS_DIR,
)
from src.ai.schemas import ChatMessageSchema, SSEEventSchema
from src.ai.tool_registry import ToolRegistry
from src.config import settings
from src.core.constants import log_messages

logger = logging.getLogger(__name__)

_CACHED_PROMPT: str | None = None


def load_system_prompt() -> str:
    # Re-reads the file on every server restart (module reload).
    # To hot-reload in dev: restart the uvicorn process.
    global _CACHED_PROMPT  # noqa: PLW0603 — intentional module-level cache
    if _CACHED_PROMPT is None:
        prompt_path = (
            Path(__file__).parent.parent.parent / PROMPTS_DIR / BUSINESS_ADVISOR_PROMPT
        )
        _CACHED_PROMPT = prompt_path.read_text(encoding="utf-8")
    return _CACHED_PROMPT


def _build_tools(registry: ToolRegistry) -> list[dict]:
    """Return tool definitions in OpenAI/Groq function-calling format."""
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
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        tools = _build_tools(self._registry)
        conversation = _build_messages(system_prompt, messages)

        logger.info(log_messages.AI_TURN_START, len(messages))

        tool_rounds = 0

        try:
            while tool_rounds < MAX_TOOL_ROUNDS:
                response = await client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=conversation,  # type: ignore[arg-type]
                    tools=tools,  # type: ignore[arg-type]
                    tool_choice="auto",
                )
                choice = response.choices[0]

                if choice.finish_reason == "tool_calls" and choice.message.tool_calls:
                    # Append assistant turn (with tool calls) to history
                    assistant_msg: dict = {"role": "assistant", "content": choice.message.content}
                    assistant_msg["tool_calls"] = [
                        {
                            "id": tc.id,
                            "type": tc.type,
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in choice.message.tool_calls
                    ]
                    conversation.append(assistant_msg)

                    for tool_call in choice.message.tool_calls:
                        tool_name = tool_call.function.name
                        try:
                            args = json.loads(tool_call.function.arguments)
                        except json.JSONDecodeError:
                            args = {}

                        logger.info(log_messages.AI_TOOL_CALLED, tool_name)
                        yield SSEEventSchema(type="tool_call", tool_name=tool_name)

                        try:
                            result = await self._registry.execute(tool_name, args, self._db)
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
                            "tool_call_id": tool_call.id,
                            "content": json.dumps(result, ensure_ascii=False),
                        })

                    tool_rounds += 1

                else:
                    text = choice.message.content or ""
                    for token in _tokenize(text):
                        yield SSEEventSchema(type="token", content=token)

                    logger.info(log_messages.AI_TURN_DONE, tool_rounds)
                    yield SSEEventSchema(type="done")
                    return

            yield SSEEventSchema(type="done")

        except Exception as exc:
            logger.error(log_messages.AI_API_ERROR, exc)
            error_str = str(exc)
            if "429" in error_str or "rate_limit" in error_str.lower():
                friendly = "המכסה החינמית של ה-AI מוצתה. נסה שנית בעוד מספר דקות."
            elif "401" in error_str or "invalid_api_key" in error_str.lower():
                friendly = "מפתח ה-API אינו תקין. פנה למנהל המערכת."
            elif "503" in error_str or "unavailable" in error_str.lower():
                friendly = "שירות ה-AI אינו זמין כרגע. נסה שנית בעוד מספר דקות."
            else:
                friendly = "אירעה שגיאה בשירות ה-AI. נסה שנית."
            yield SSEEventSchema(type="error", error=friendly)


def _tokenize(text: str) -> list[str]:
    """Split text into word-level tokens for streaming effect."""
    tokens: list[str] = []
    current = ""
    for char in text:
        current += char
        if char in (" ", "\n", ".", ",", "!", "?", ":", ";"):
            tokens.append(current)
            current = ""
    if current:
        tokens.append(current)
    return tokens
