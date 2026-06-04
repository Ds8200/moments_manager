import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


@dataclass
class Tool:
    name: str
    description: str
    parameters: dict
    fn: Callable[..., Awaitable[dict]]


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(
        self,
        name: str,
        description: str,
        parameters: dict,
    ) -> Callable:
        """Decorator factory — wraps an async callable as a Tool and registers it."""

        def decorator(fn: Callable[..., Awaitable[dict]]) -> Callable:
            self._tools[name] = Tool(
                name=name,
                description=description,
                parameters=parameters,
                fn=fn,
            )
            return fn

        return decorator

    def get(self, name: str) -> Tool | None:
        return self._tools.get(name)

    def all_declarations(self) -> list[dict]:
        """Returns Gemini-compatible FunctionDeclaration list."""
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters,
            }
            for tool in self._tools.values()
        ]

    async def execute(self, name: str, args: dict, db: AsyncSession) -> dict:
        tool = self.get(name)
        if tool is None:
            return {"error": f"Unknown tool: {name}"}
        return await tool.fn(db=db, **(args or {}))


tool_registry = ToolRegistry()
