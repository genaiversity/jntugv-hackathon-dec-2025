from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .models import UserType, PhaseType, ArtifactType


class ProjectCreate(BaseModel):
    name: str
    description: str
    user_type: UserType
    constraints: Optional[str] = None
    skills: Optional[str] = None
    time_available: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    user_type: UserType
    constraints: Optional[str]
    skills: Optional[str]
    time_available: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ArtifactResponse(BaseModel):
    id: int
    phase_id: int
    artifact_type: ArtifactType
    content: str
    version: int
    model_used: str
    created_at: datetime

    class Config:
        from_attributes = True


class PhaseResponse(BaseModel):
    id: int
    project_id: int
    phase_type: PhaseType
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    artifacts: List[ArtifactResponse] = []

    class Config:
        from_attributes = True


class ProjectDetailResponse(ProjectResponse):
    phases: List[PhaseResponse] = []


class GenerateRequest(BaseModel):
    regenerate: bool = False
    custom_instructions: Optional[str] = None


class GenerateResponse(BaseModel):
    phase: PhaseResponse
    artifacts: List[ArtifactResponse]
    message: str


class ExportCustomRequest(BaseModel):
    artifact_ids: List[int]
    format: str = "markdown"


class CodeZipRequest(BaseModel):
    artifact_id: Optional[int] = None


# --- File-by-file code generation (chat-style) ---


class CodeGenSessionResponse(BaseModel):
    id: int
    project_id: int
    status: str
    model_used: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CodeGenFileResponse(BaseModel):
    id: int
    session_id: int
    path: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CodeGenMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class CodeGenSessionDetailResponse(CodeGenSessionResponse):
    files: List[CodeGenFileResponse] = []
    messages: List[CodeGenMessageResponse] = []


class CodeGenCreateSessionRequest(BaseModel):
    model_used: Optional[str] = None


class CodeGenUpsertFileRequest(BaseModel):
    path: str
    content: str


class CodeGenGenerateFileRequest(BaseModel):
    path: str
    instructions: Optional[str] = None


class CodeGenPlanResponse(BaseModel):
    session_id: int
    suggested_paths: List[str]


class CodeGenApplyPlanResponse(BaseModel):
    session_id: int
    created_files: int
    total_files: int


# --- Simple Q/A chat endpoint (for frontend floating bot) ---


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
