"""Unit tests for ToolRegistry — no DB required."""
import pytest

from src.ai.tool_registry import ToolRegistry


@pytest.fixture()
def registry() -> ToolRegistry:
    return ToolRegistry()


async def _noop_fn(db, **_):
    return {"ok": True}


def test_register_stores_tool(registry: ToolRegistry) -> None:
    registry.register(
        name="my_tool",
        description="A test tool",
        parameters={"type": "object", "properties": {}},
    )(_noop_fn)

    tool = registry.get("my_tool")
    assert tool is not None
    assert tool.name == "my_tool"
    assert tool.description == "A test tool"
    assert tool.fn is _noop_fn


def test_get_unknown_returns_none(registry: ToolRegistry) -> None:
    assert registry.get("nonexistent") is None


def test_all_declarations_returns_correct_format(registry: ToolRegistry) -> None:
    registry.register(
        name="tool_a",
        description="Tool A",
        parameters={"type": "object", "properties": {"x": {"type": "integer"}}},
    )(_noop_fn)
    registry.register(
        name="tool_b",
        description="Tool B",
        parameters={"type": "object", "properties": {}},
    )(_noop_fn)

    declarations = registry.all_declarations()
    assert len(declarations) == 2

    names = {d["name"] for d in declarations}
    assert "tool_a" in names
    assert "tool_b" in names

    for decl in declarations:
        assert "name" in decl
        assert "description" in decl
        assert "parameters" in decl


async def test_execute_calls_tool_fn(registry: ToolRegistry) -> None:
    calls: list[dict] = []

    async def tracking_fn(db, **kwargs):
        calls.append({"db": db, **kwargs})
        return {"result": "ok"}

    registry.register(
        name="tracked",
        description="Tracks calls",
        parameters={"type": "object", "properties": {}},
    )(tracking_fn)

    result = await registry.execute("tracked", {"extra": 1}, db=None)

    assert result == {"result": "ok"}
    assert len(calls) == 1
    assert calls[0]["extra"] == 1


async def test_execute_unknown_tool_returns_error(registry: ToolRegistry) -> None:
    result = await registry.execute("unknown_tool", {}, db=None)
    assert "error" in result
    assert "unknown_tool" in result["error"].lower()
