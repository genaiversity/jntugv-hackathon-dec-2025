"""Pydantic models for request/response validation."""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ToolType(str, Enum):
    """Available tool types."""
    GMAIL = "gmail"
    CALENDAR = "calendar"
    DOCS = "docs"
    SLACK = "slack"
    SMS = "sms"


class ConversationStatus(str, Enum):
    """Conversation state status."""
    PENDING = "pending"
    AWAITING_CONFIRMATION = "awaiting_confirmation"
    COMPLETED = "completed"
    FAILED = "failed"


class UserRequest(BaseModel):
    """User request model."""
    user_id: str = Field(..., description="Unique user identifier")
    message: str = Field(..., description="User message/query")
    session_id: Optional[str] = Field(None, description="Session identifier for conversation tracking")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")


class AgentResponse(BaseModel):
    """Agent response model."""
    response: str = Field(..., description="Agent's response message")
    session_id: str = Field(..., description="Session identifier")
    action_required: bool = Field(False, description="Whether user action is required")
    suggested_actions: Optional[List[str]] = Field(None, description="List of suggested actions")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")


class ToolAction(BaseModel):
    """Tool action model."""
    tool_type: ToolType = Field(..., description="Type of tool to use")
    action: str = Field(..., description="Action to perform")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Action parameters")
    requires_confirmation: bool = Field(True, description="Whether action requires user confirmation")


class ConversationState(BaseModel):
    """Conversation state model for Redis storage."""
    session_id: str = Field(..., description="Session identifier")
    user_id: str = Field(..., description="User identifier")
    status: ConversationStatus = Field(ConversationStatus.PENDING, description="Current status")
    pending_action: Optional[ToolAction] = Field(None, description="Pending action awaiting confirmation")
    conversation_history: List[Dict[str, str]] = Field(default_factory=list, description="Conversation history")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")


class EmailData(BaseModel):
    """Email data model."""
    to: EmailStr = Field(..., description="Recipient email address")
    subject: str = Field(..., description="Email subject")
    body: str = Field(..., description="Email body content")
    cc: Optional[List[EmailStr]] = Field(None, description="CC recipients")
    bcc: Optional[List[EmailStr]] = Field(None, description="BCC recipients")
    attachments: Optional[List[str]] = Field(None, description="Attachment file paths")


class CalendarEvent(BaseModel):
    """Calendar event model."""
    summary: str = Field(..., description="Event title/summary")
    description: Optional[str] = Field(None, description="Event description")
    start_time: datetime = Field(..., description="Event start time")
    end_time: datetime = Field(..., description="Event end time")
    attendees: Optional[List[EmailStr]] = Field(None, description="Event attendees")
    location: Optional[str] = Field(None, description="Event location")
    timezone: str = Field("UTC", description="Event timezone")


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str = Field(..., description="Service status")
    mongodb: bool = Field(..., description="MongoDB connection status")
    redis: bool = Field(..., description="Redis connection status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Health check timestamp")
