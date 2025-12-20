"""
Pydantic schemas for request/response validation.
"""
import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from pydantic import EmailStr

# ===== Auth Schemas =====

class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)  # Bcrypt has 72-byte limit
    name: str = Field(min_length=1, max_length=255)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user data in responses."""
    id: uuid.UUID
    email: str
    name: str
    avatar_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for authentication token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthResponse(BaseModel):
    """Schema for login/register response."""
    user: UserResponse
    tokens: TokenResponse


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh request."""
    refresh_token: str


# ===== Task Schemas =====

class TaskCreate(BaseModel):
    """Schema for creating a new task."""
    task_name: str = Field(min_length=1, max_length=500)
    description: Optional[str] = None
    category: str = Field(default="personal", pattern="^(work|personal|health)$")
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    due_date: Optional[date] = None
    manual_duration: Optional[int] = Field(default=None, ge=5, le=480)  # 5 min to 8 hours


class TaskUpdate(BaseModel):
    """Schema for updating a task."""
    task_name: Optional[str] = Field(default=None, min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, pattern="^(work|personal|health)$")
    priority: Optional[str] = Field(default=None, pattern="^(low|medium|high)$")
    due_date: Optional[date] = None
    manual_duration: Optional[int] = Field(default=None, ge=5, le=480)
    is_completed: Optional[bool] = None


class TaskSchedule(BaseModel):
    """Schema for scheduling a task."""
    scheduled_start_time: datetime


class TaskResponse(BaseModel):
    """Schema for task data in responses."""
    id: uuid.UUID
    task_name: str
    description: Optional[str] = None
    estimated_duration: Optional[int] = None
    manual_duration: Optional[int] = None
    effective_duration: int
    category: str
    priority: str
    due_date: Optional[date] = None
    is_scheduled: bool
    scheduled_start_time: Optional[datetime] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Schema for paginated task list."""
    tasks: List[TaskResponse]
    total: int


# ===== LLM Schemas =====

class DurationEstimateRequest(BaseModel):
    """Schema for duration estimation request."""
    task_description: str = Field(min_length=1, max_length=1000)


class DurationEstimateResponse(BaseModel):
    """Schema for duration estimation response."""
    estimated_duration: int  # minutes
    unit: str = "minutes"
    confidence: float = Field(ge=0, le=1)
    reasoning: Optional[str] = None


# ===== Calendar Schemas =====

class ExternalEventResponse(BaseModel):
    """Schema for external calendar event."""
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_all_day: bool
    location: Optional[str] = None
    source: str  # 'google' or 'microsoft'
    is_external: bool = True
    
    class Config:
        from_attributes = True


class CalendarEventsResponse(BaseModel):
    """Schema for calendar events list."""
    events: List[ExternalEventResponse]


class CalendarSyncResponse(BaseModel):
    """Schema for calendar sync result."""
    synced_events: int
    last_synced_at: datetime


# ===== Error Schemas =====

class ErrorDetail(BaseModel):
    """Schema for error detail."""
    field: Optional[str] = None
    message: str


class ErrorResponse(BaseModel):
    """Schema for error response."""
    code: str
    message: str
    details: Optional[List[ErrorDetail]] = None
