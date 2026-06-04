"""Unit tests for AgentRunner — mocks the google.genai SDK."""
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.ai.schemas import ChatMessageSchema, SSEEventSchema
from src.ai.service import AgentRunner, _tokenize
from src.ai.tool_registry import ToolRegistry


@pytest.fixture()
def registry() -> ToolRegistry:
    reg = ToolRegistry()

    async def echo_tool(db, **kwargs):
        return {"echo": kwargs.get("value", "pong")}

    reg.register(
        name="echo",
        description="Returns echo",
        parameters={
            "type": "object",
            "properties": {"value": {"type": "string"}},
        },
    )(echo_tool)
    return reg


@pytest.fixture()
def messages() -> list[ChatMessageSchema]:
    return [ChatMessageSchema(role="user", content="Hello")]


def _make_text_part(text: str) -> MagicMock:
    part = MagicMock()
    part.text = text
    part.function_call = None
    return part


def _make_fc_part(tool_name: str, args: dict) -> MagicMock:
    fc = MagicMock()
    fc.name = tool_name
    fc.args = args
    part = MagicMock()
    part.function_call = fc
    part.text = None
    return part


def _make_response(*parts) -> MagicMock:
    candidate = MagicMock()
    candidate.content.parts = list(parts)
    response = MagicMock()
    response.candidates = [candidate]
    return response


async def _collect(gen: AsyncGenerator[SSEEventSchema, None]) -> list[SSEEventSchema]:
    return [event async for event in gen]


def _patch_genai(chat_mock):
    client_mock = MagicMock()
    client_mock.aio.chats.create.return_value = chat_mock
    return patch("src.ai.service.genai.Client", return_value=client_mock)


# ── Text-only turn ─────────────────────────────────────────────────────────────

async def test_text_only_response(registry, messages) -> None:
    chat_mock = MagicMock()
    chat_mock.send_message = AsyncMock(
        return_value=_make_response(_make_text_part("שלום!"))
    )

    with _patch_genai(chat_mock):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    types = [e.type for e in events]
    assert "token" in types
    assert types[-1] == "done"


# ── Tool call then text ────────────────────────────────────────────────────────

async def test_tool_call_then_text(registry, messages) -> None:
    tool_response = _make_response(_make_fc_part("echo", {"value": "test"}))
    text_response = _make_response(_make_text_part("The echo says test"))

    chat_mock = MagicMock()
    chat_mock.send_message = AsyncMock(
        side_effect=[tool_response, text_response]
    )

    with _patch_genai(chat_mock):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    types = [e.type for e in events]
    assert "tool_call" in types
    assert "tool_result" in types
    assert "token" in types
    assert types[-1] == "done"

    tool_call_event = next(e for e in events if e.type == "tool_call")
    assert tool_call_event.tool_name == "echo"

    tool_result_event = next(e for e in events if e.type == "tool_result")
    assert tool_result_event.data == {"echo": "test"}


# ── Tool raises exception ──────────────────────────────────────────────────────

async def test_tool_error_continues_stream(messages) -> None:
    error_registry = ToolRegistry()

    async def failing_tool(db, **_):
        raise ValueError("DB exploded")

    error_registry.register(
        name="fail",
        description="Always fails",
        parameters={"type": "object", "properties": {}},
    )(failing_tool)

    tool_response = _make_response(_make_fc_part("fail", {}))
    text_response = _make_response(_make_text_part("Despite the error, here is the answer"))

    chat_mock = MagicMock()
    chat_mock.send_message = AsyncMock(
        side_effect=[tool_response, text_response]
    )

    with _patch_genai(chat_mock):
        runner = AgentRunner(db=None, registry=error_registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    result_events = [e for e in events if e.type == "tool_result"]
    assert len(result_events) == 1
    assert "error" in result_events[0].data
    assert events[-1].type == "done"


# ── Gemini API error ───────────────────────────────────────────────────────────

async def test_gemini_error_yields_error_event(registry, messages) -> None:
    chat_mock = MagicMock()
    chat_mock.send_message = AsyncMock(side_effect=Exception("API quota exceeded"))

    with _patch_genai(chat_mock):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    assert len(events) == 1
    assert events[0].type == "error"
    assert "API quota exceeded" in events[0].error


# ── Max tool rounds ────────────────────────────────────────────────────────────

async def test_max_tool_rounds_terminates(registry, messages) -> None:
    # Always returns a tool call — would loop forever without the cap
    chat_mock = MagicMock()
    chat_mock.send_message = AsyncMock(
        return_value=_make_response(_make_fc_part("echo", {"value": "loop"}))
    )

    with _patch_genai(chat_mock):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    assert events[-1].type == "done"
    tool_call_events = [e for e in events if e.type == "tool_call"]
    from src.ai.constants import MAX_TOOL_ROUNDS
    assert len(tool_call_events) <= MAX_TOOL_ROUNDS


# ── Tokenizer helper ───────────────────────────────────────────────────────────

def test_tokenize_splits_on_spaces() -> None:
    tokens = _tokenize("hello world")
    assert tokens == ["hello ", "world"]


def test_tokenize_empty_string() -> None:
    assert _tokenize("") == []


def test_tokenize_preserves_all_chars() -> None:
    text = "שלום, עולם!"
    assert "".join(_tokenize(text)) == text
