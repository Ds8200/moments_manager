import logging
from collections.abc import AsyncGenerator
from pathlib import Path

from google import genai
from google.genai import types as genai_types
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.constants import (
    BUSINESS_ADVISOR_PROMPT,
    GEMINI_MODEL,
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
    global _CACHED_PROMPT  # noqa: PLW0603 — intentional module-level cache
    if _CACHED_PROMPT is None:
        prompt_path = (
            Path(__file__).parent.parent.parent / PROMPTS_DIR / BUSINESS_ADVISOR_PROMPT
        )
        _CACHED_PROMPT = prompt_path.read_text(encoding="utf-8")
    return _CACHED_PROMPT


def _to_genai_contents(messages: list[ChatMessageSchema]) -> list[genai_types.Content]:
    """Convert ChatMessageSchema list to google.genai Content objects."""
    return [
        genai_types.Content(
            role=msg.role,
            parts=[genai_types.Part.from_text(text=msg.content)],
        )
        for msg in messages
    ]


def _build_tool_config(registry: ToolRegistry) -> list[genai_types.Tool]:
    declarations = [
        genai_types.FunctionDeclaration(
            name=t["name"],
            description=t["description"],
            parameters=t["parameters"],
        )
        for t in registry.all_declarations()
    ]
    return [genai_types.Tool(function_declarations=declarations)]


class AgentRunner:
    def __init__(self, db: AsyncSession, registry: ToolRegistry) -> None:
        self._db = db
        self._registry = registry

    async def run_stream(
        self,
        messages: list[ChatMessageSchema],
        system_prompt: str,
    ) -> AsyncGenerator[SSEEventSchema, None]:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        history = _to_genai_contents(messages[:-1]) if len(messages) > 1 else []
        last_user_text = messages[-1].content if messages else ""

        config = genai_types.GenerateContentConfig(
            system_instruction=system_prompt,
            tools=_build_tool_config(self._registry),
        )

        chat = client.aio.chats.create(
            model=GEMINI_MODEL,
            config=config,
            history=history,
        )

        logger.info(log_messages.AI_TURN_START, len(messages))

        tool_rounds = 0
        current_input: str | list = last_user_text

        try:
            while tool_rounds < MAX_TOOL_ROUNDS:
                response = await chat.send_message(current_input)

                function_call_parts = [
                    part
                    for candidate in response.candidates
                    for part in (candidate.content.parts or [])
                    if part.function_call and part.function_call.name
                ]

                if function_call_parts:
                    tool_result_parts = []
                    for part in function_call_parts:
                        fc = part.function_call
                        tool_name = fc.name
                        args = dict(fc.args) if fc.args else {}

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
                        tool_result_parts.append(
                            genai_types.Part.from_function_response(
                                name=tool_name, response=result
                            )
                        )

                    tool_rounds += 1
                    current_input = tool_result_parts

                else:
                    text_parts = [
                        part.text
                        for candidate in response.candidates
                        for part in (candidate.content.parts or [])
                        if part.text
                    ]
                    full_text = "".join(text_parts)

                    for token in _tokenize(full_text):
                        yield SSEEventSchema(type="token", content=token)

                    logger.info(log_messages.AI_TURN_DONE, tool_rounds)
                    yield SSEEventSchema(type="done")
                    return

            yield SSEEventSchema(type="done")

        except Exception as exc:
            logger.error(log_messages.AI_GEMINI_ERROR, exc)
            error_str = str(exc)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                friendly = "המכסה החינמית של ה-AI מוצתה. נסה שנית מחר או פנה למנהל המערכת."
            elif "403" in error_str or "API_KEY" in error_str:
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
