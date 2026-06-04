from typing import Literal

from pydantic import BaseModel


class ChatMessageSchema(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequestSchema(BaseModel):
    messages: list[ChatMessageSchema]


class SSEEventSchema(BaseModel):
    type: Literal["token", "tool_call", "tool_result", "done", "error"]
    content: str | None = None
    tool_name: str | None = None
    data: dict | None = None
    error: str | None = None
