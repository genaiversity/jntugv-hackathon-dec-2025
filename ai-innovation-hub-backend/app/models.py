from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserType(str, Enum):
    STUDENT = "student"
    FOUNDER = "founder"
    HACKATHON = "hackathon"
    INCUBATOR = "incubator"


class PhaseType(str, Enum):
    IDEATION = "ideation"
    CONCEPT_DESIGN = "concept_design"
    LAUNCH_CONTENT = "launch_content"
    VALIDATION = "validation"
    TECH_BUILD = "tech_build"
    CODE_GENERATION = "code_generation"
    FINAL_SPEC = "final_spec"


class ArtifactType(str, Enum):
    PROBLEM_STATEMENT = "problem_statement"
    PERSONAS = "personas"
    IDEA_VARIANTS = "idea_variants"
    FEATURE_LIST = "feature_list"
    USER_FLOWS = "user_flows"
    LANDING_PAGE = "landing_page"
    PITCH_OUTLINE = "pitch_outline"
    TAGLINES = "taglines"
    EXPERIMENT_PLAN = "experiment_plan"
    SURVEY_QUESTIONS = "survey_questions"
    METRICS = "metrics"
    TECH_STACK = "tech_stack"
    API_DESIGN = "api_design"
    PROJECT_TASKS = "project_tasks"
    STARTER_CODE = "starter_code"
    GENERATED_APP = "generated_app"
    FULL_SPEC = "full_spec"


class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str
    user_type: UserType
    constraints: Optional[str] = None
    skills: Optional[str] = None
    time_available: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    phases: List["Phase"] = Relationship(back_populates="project")


class Phase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    phase_type: PhaseType
    status: str = "pending"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    project: Optional[Project] = Relationship(back_populates="phases")
    artifacts: List["Artifact"] = Relationship(back_populates="phase")


class Artifact(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phase_id: int = Field(foreign_key="phase.id")
    artifact_type: ArtifactType
    content: str
    version: int = 1
    model_used: str
    prompt_used: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    phase: Optional[Phase] = Relationship(back_populates="artifacts")


# --- File-by-file code generation (chat-style) ---


class CodeGenSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    status: str = "active"  # active | completed
    model_used: str = "coder"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    project: Optional[Project] = Relationship()
    files: List["CodeGenFile"] = Relationship(back_populates="session")
    messages: List["CodeGenMessage"] = Relationship(back_populates="session")


class CodeGenFile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="codegensession.id", index=True)
    path: str = Field(index=True)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    session: Optional[CodeGenSession] = Relationship(back_populates="files")


class CodeGenMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="codegensession.id", index=True)
    role: str  # user | assistant | system
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    session: Optional[CodeGenSession] = Relationship(back_populates="messages")
