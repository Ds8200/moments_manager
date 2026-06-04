"""Unit tests for AgentRunner — mocks the OpenAI streaming SDK interface."""

import json
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.ai.schemas import ChatMessageSchema, SSEEventSchema
from src.ai.service import AgentRunner, build_system_prompt
from src.ai.tool_registry import ToolRegistry

# ── Streaming chunk helpers ───────────────────────────────────────────────────


def _make_chunk(
    content: str | None = None,
    tool_calls: list | None = None,
    finish_reason: str | None = None,
) -> MagicMock:
    delta = MagicMock()
    delta.content = content
    delta.tool_calls = tool_calls
    choice = MagicMock()
    choice.delta = delta
    choice.finish_reason = finish_reason
    chunk = MagicMock()
    chunk.choices = [choice]
    return chunk


def _tc_delta(
    index: int,
    tc_id: str | None,
    name: str | None,
    arguments: str | None,
) -> MagicMock:
    func = MagicMock()
    func.name = name
    func.arguments = arguments
    tc = MagicMock()
    tc.index = index
    tc.id = tc_id
    tc.function = func
    return tc


async def _text_stream(text: str) -> AsyncGenerator:
    """Async generator that simulates OpenAI streaming a text-only response."""
    for char in text:
        yield _make_chunk(content=char)
    yield _make_chunk(finish_reason="stop")


async def _tool_stream(tool_name: str, args: dict) -> AsyncGenerator:
    """Async generator that simulates OpenAI streaming a single tool call."""
    # First chunk: id + function name
    yield _make_chunk(tool_calls=[_tc_delta(0, "call_test", tool_name, "")])
    # Second chunk: full JSON arguments
    yield _make_chunk(tool_calls=[_tc_delta(0, None, None, json.dumps(args))])
    # Final chunk: finish reason
    yield _make_chunk(finish_reason="tool_calls")


# ── Patch helper ──────────────────────────────────────────────────────────────


def _patch_openai(*streams):
    """Patch AsyncOpenAI.chat.completions.create to return streams in order."""
    client_mock = MagicMock()
    client_mock.chat.completions.create = AsyncMock(side_effect=list(streams))
    return patch("src.ai.service.AsyncOpenAI", return_value=client_mock)


async def _collect(gen: AsyncGenerator[SSEEventSchema, None]) -> list[SSEEventSchema]:
    return [event async for event in gen]


# ── Fixtures ──────────────────────────────────────────────────────────────────


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


# ── Real streaming: text arrives token-by-token ───────────────────────────────


async def test_text_streams_character_by_character(registry, messages) -> None:
    """Each character from OpenAI yields a separate token event immediately."""
    text = "שלום!"
    with _patch_openai(_text_stream(text)):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    token_events = [e for e in events if e.type == "token"]
    assert len(token_events) == len(text)
    assert "".join(e.content for e in token_events) == text
    assert events[-1].type == "done"


async def test_event_order_is_tokens_then_done(registry, messages) -> None:
    """Tokens must all arrive before the done event."""
    with _patch_openai(_text_stream("אבג")):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    done_index = next(i for i, e in enumerate(events) if e.type == "done")
    token_indices = [i for i, e in enumerate(events) if e.type == "token"]
    assert all(i < done_index for i in token_indices)


# ── Tool call then text ───────────────────────────────────────────────────────


async def test_tool_call_then_text(registry, messages) -> None:
    with _patch_openai(
        _tool_stream("echo", {"value": "test"}),
        _text_stream("The echo says test"),
    ):
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


async def test_tool_result_precedes_tokens(registry, messages) -> None:
    """tool_call and tool_result must appear before any token from the final answer."""
    with _patch_openai(
        _tool_stream("echo", {}),
        _text_stream("done"),
    ):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    first_token_idx = next(i for i, e in enumerate(events) if e.type == "token")
    tool_result_idx = next(i for i, e in enumerate(events) if e.type == "tool_result")
    assert tool_result_idx < first_token_idx


# ── Tool raises exception ─────────────────────────────────────────────────────


async def test_tool_error_wraps_and_continues(messages) -> None:
    error_registry = ToolRegistry()

    async def failing_tool(db, **_):
        raise ValueError("DB exploded")

    error_registry.register(
        name="fail",
        description="Always fails",
        parameters={"type": "object", "properties": {}},
    )(failing_tool)

    with _patch_openai(
        _tool_stream("fail", {}),
        _text_stream("Despite the error, here is the answer"),
    ):
        runner = AgentRunner(db=None, registry=error_registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    result_events = [e for e in events if e.type == "tool_result"]
    assert len(result_events) == 1
    assert "error" in result_events[0].data
    assert events[-1].type == "done"


# ── OpenAI API error ──────────────────────────────────────────────────────────


async def test_api_error_yields_single_error_event(registry, messages) -> None:
    client_mock = MagicMock()
    client_mock.chat.completions.create = AsyncMock(side_effect=Exception("API error"))
    with patch("src.ai.service.AsyncOpenAI", return_value=client_mock):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    assert len(events) == 1
    assert events[0].type == "error"


# ── Friendly error messages ───────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("exc_msg", "expected_fragment"),
    [
        ("429 rate_limit_exceeded", "מכסה"),
        ("401 invalid_api_key", "מפתח"),
        ("insufficient_quota exceeded billing", "OpenAI"),
        ("503 service unavailable", "זמין"),
        ("unknown failure xyz", "שגיאה"),
    ],
)
async def test_friendly_error_messages(
    registry, messages, exc_msg: str, expected_fragment: str
) -> None:
    client_mock = MagicMock()
    client_mock.chat.completions.create = AsyncMock(side_effect=Exception(exc_msg))
    with patch("src.ai.service.AsyncOpenAI", return_value=client_mock):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    assert events[0].type == "error"
    assert expected_fragment in events[0].error


# ── Max tool rounds ───────────────────────────────────────────────────────────


async def test_max_tool_rounds_terminates_with_done(registry, messages) -> None:
    from src.ai.constants import MAX_TOOL_ROUNDS

    # Supply exactly MAX_TOOL_ROUNDS tool-call streams; the loop must stop after them
    streams = [_tool_stream("echo", {"value": "loop"}) for _ in range(MAX_TOOL_ROUNDS)]

    with _patch_openai(*streams):
        runner = AgentRunner(db=None, registry=registry)
        events = await _collect(runner.run_stream(messages, "sys"))

    assert events[-1].type == "done"
    assert len([e for e in events if e.type == "tool_call"]) == MAX_TOOL_ROUNDS


# ── build_system_prompt ─────────────���─────────────────────────────────────────


def test_build_system_prompt_contains_current_year() -> None:
    from datetime import date

    prompt = build_system_prompt()
    assert str(date.today().year) in prompt


def test_build_system_prompt_contains_hebrew_date_header() -> None:
    prompt = build_system_prompt()
    assert "תאריך ושעה נוכחיים" in prompt


def test_build_system_prompt_includes_base_content() -> None:
    prompt = build_system_prompt()
    # The base prompt always contains the role section
    assert "Moments AI" in prompt
