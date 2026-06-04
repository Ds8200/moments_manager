"""Unit tests for AgentRunner — mocks the Groq SDK."""
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


def _make_text_choice(text: str) -> MagicMock:
    msg = MagicMock()
    msg.content = text
    msg.tool_calls = None
    choice = MagicMock()
    choice.finish_reason = "stop"
    choice.message = msg
    response = MagicMock()
    response.choices = [choice]
    return response


def _make_tool_call_choice(tool_name: str, args: dict) -> MagicMock:
    import json
    func = MagicMock()
    func.name = tool_name
    func.arguments = json.dumps(args)
    tc = MagicMock()
    tc.id = "call_test123"
    tc.type = "function"
    tc.function = func
    msg = MagicMock()
    msg.content = None
    msg.tool_calls = [tc]
    choice = MagicMock()
    choice.finish_reason = "tool_calls"
    choice.message = msg
    response = MagicMock()
    response.choices = [choice]
    return response


async def _collect(gen: AsyncGenerator[SSEEventSchema, None]) -> list[SSEEventSchema]:
    return [event async for event in gen]


def _patch_groq(side_effect):
    client_mock = MagicMock()
    client_mock.chat.completions.create = AsyncMock(side_effect=side_effect)
    return patch("src.ai.service.AsyncGroq", return_value=client_mock)


# ── Text-only turn ─────────────────────────────────────────────────────────────

async def test_text_only_response(registry, messages) -> None:
    with _patch_groq([_make_text_choice("שלום!")]):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    types = [e.type for e in events]
    assert "token" in types
    assert types[-1] == "done"


# ── Tool call then text ────────────────────────────────────────────────────────

async def test_tool_call_then_text(registry, messages) -> None:
    with _patch_groq([
        _make_tool_call_choice("echo", {"value": "test"}),
        _make_text_choice("The echo says test"),
    ]):
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

    with _patch_groq([
        _make_tool_call_choice("fail", {}),
        _make_text_choice("Despite the error, here is the answer"),
    ]):
        runner = AgentRunner(db=None, registry=error_registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    result_events = [e for e in events if e.type == "tool_result"]
    assert len(result_events) == 1
    assert "error" in result_events[0].data
    assert events[-1].type == "done"


# ── Groq API error ─────────────────────────────────────────────────────────────

async def test_api_error_yields_error_event(registry, messages) -> None:
    with _patch_groq(Exception("API quota exceeded")):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    assert len(events) == 1
    assert events[0].type == "error"


# ── Friendly error messages ────────────────────────────────────────────────────

async def test_rate_limit_shows_friendly_message(registry, messages) -> None:
    with _patch_groq(Exception("429 rate_limit_exceeded")):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    assert events[0].type == "error"
    assert "מכסה" in events[0].error


async def test_invalid_key_shows_friendly_message(registry, messages) -> None:
    with _patch_groq(Exception("401 invalid_api_key")):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    assert events[0].type == "error"
    assert "מפתח" in events[0].error


# ── Max tool rounds ────────────────────────────────────────────────────────────

async def test_max_tool_rounds_terminates(registry, messages) -> None:
    with _patch_groq(_make_tool_call_choice("echo", {"value": "loop"})):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    assert events[-1].type == "done"
    from src.ai.constants import MAX_TOOL_ROUNDS
    assert len([e for e in events if e.type == "tool_call"]) <= MAX_TOOL_ROUNDS


# ── Tokenizer ─────────────────────────────────────────────────────────────────

def test_tokenize_splits_on_spaces() -> None:
    assert _tokenize("hello world") == ["hello ", "world"]


def test_tokenize_empty_string() -> None:
    assert _tokenize("") == []


def test_tokenize_preserves_all_chars() -> None:
    text = "שלום, עולם!"
    assert "".join(_tokenize(text)) == text
