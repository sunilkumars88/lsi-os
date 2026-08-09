from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    org_name: str = "Personal Workspace"


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    email: EmailStr
    full_name: str
    role: str
    org_id: str
    org_name: str | None = None


class DocumentIn(BaseModel):
    title: str
    content: str
    doc_type: str = "general"
    source: str = "upload"


class DocumentOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    title: str
    doc_type: str
    source: str
    created_at: datetime
    preview: str | None = None


class SearchIn(BaseModel):
    query: str
    limit: int = 6


class ChatIn(BaseModel):
    message: str
    session_id: str | None = None
    use_rag: bool = True
    use_tools: bool = True


class ChatOut(BaseModel):
    session_id: str
    message_id: str
    content: str
    citations: list[Any] = []
    tool_traces: list[Any] = []
    model: str
    provider: str


class AgentJobIn(BaseModel):
    name: str
    agent_type: str
    query: str
    requires_approval: bool | None = None


class WorkflowIn(BaseModel):
    name: str
    description: str = ""
    steps: list[dict[str, Any]] = []


class WorkflowOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    description: str
    steps: list[Any]
    is_active: bool
