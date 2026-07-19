from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class FormCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    workspace_id: Optional[int] = None
    settings: Optional[dict] = None


class FormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    workspace_id: Optional[int] = None
    settings: Optional[dict] = None


class FormSummary(BaseModel):
    id: int
    title: str
    status: str
    response_count: int
    updated_at: datetime
    workspace_id: Optional[int] = None
    completion_rate: Optional[float] = 0.0
    slug: str

    class Config:
        from_attributes = True


class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class WorkspaceUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class WorkspaceRead(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkspaceSummary(BaseModel):
    id: int
    name: str
    owner_id: int
    form_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuestionRead(BaseModel):
    id: int
    type: str
    title: str
    description: Optional[str] = None
    required: bool
    order_index: int
    options: Optional[List[str]] = None
    settings: Optional[dict] = None

    class Config:
        from_attributes = True


class FormRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    slug: str
    status: str
    created_at: datetime
    updated_at: datetime
    workspace_id: Optional[int] = None
    questions: List[QuestionRead] = []
    settings: Optional[dict] = None

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    type: str
    title: Optional[str] = ""
    description: Optional[str] = None
    required: Optional[bool] = False
    options: Optional[List[str]] = None
    settings: Optional[dict] = None

class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required: Optional[bool] = None
    options: Optional[List[str]] = None
    settings: Optional[dict] = None


class ShareInfo(BaseModel):
    """Everything the Share page needs: identity, slug/public link, and
    publish state. `public_url` is a best-effort absolute link built from
    FRONTEND_BASE_URL; the frontend recomputes it from window.location.origin
    for accuracy, so this field is mainly useful for API consumers/tests."""
    id: int
    title: str
    description: Optional[str] = None
    slug: str
    status: str
    public_url: str
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SlugUpdate(BaseModel):
    slug: str = Field(..., min_length=1, max_length=100)


class ResponseSubmit(BaseModel):
    answers: List[dict]  # each dict: {"question_id": int, "value": Any}
    view_id: Optional[int] = None


class ResponseRead(BaseModel):
    id: int
    form_id: int
    submitted_at: datetime
    completed: bool
    view_id: Optional[int] = None
    answers: List[dict]  # each dict: {"question_id": int, "value": Any, "question_type": str, ...}

    class Config:
        from_attributes = True


class WorkspaceInviteRequest(BaseModel):
    email: str


class WorkspaceInviteResponse(BaseModel):
    status: str
    message: str
    mock_sent: bool = False
