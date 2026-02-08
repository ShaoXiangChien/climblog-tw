"""
Pydantic models for request/response validation.
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, EmailStr, Field, field_validator


class GymType(str, Enum):
    """Climbing gym type enum."""
    BOULDERING = "bouldering"
    LEAD = "lead"
    MIXED = "mixed"


class GymStatus(str, Enum):
    """Gym submission status enum."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class FeedbackCategory(str, Enum):
    """Feedback category enum."""
    BUG = "bug"
    FEATURE_REQUEST = "feature_request"
    IMPROVEMENT = "improvement"
    OTHER = "other"


class FeedbackStatus(str, Enum):
    """Feedback status enum."""
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


# Gym Submission Models
class GymSubmissionCreate(BaseModel):
    """Model for creating a new gym submission."""
    user_id: int = Field(..., description="ID of the user submitting the gym")
    name: str = Field(..., min_length=1, max_length=255, description="Gym name")
    city: str = Field(..., min_length=1, max_length=100, description="City")
    district: Optional[str] = Field(None, max_length=100, description="District")
    address: str = Field(..., min_length=1, description="Full address")
    lat: Optional[str] = Field(None, description="Latitude as string")
    lng: Optional[str] = Field(None, description="Longitude as string")
    type: GymType = Field(..., description="Type of climbing gym")
    price_from: Optional[int] = Field(None, ge=0, description="Starting price")
    hours_text: Optional[str] = Field(None, description="Operating hours text")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags")
    cover_image_url: Optional[str] = Field(None, description="Cover image URL")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    website: Optional[str] = Field(None, max_length=500, description="Website URL")
    description: Optional[str] = Field(None, description="Additional description")

    @field_validator('tags', mode='before')
    @classmethod
    def validate_tags(cls, v):
        """Ensure tags is a list."""
        if v is None:
            return []
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v


class GymSubmissionResponse(BaseModel):
    """Model for gym submission response."""
    id: int
    user_id: int
    name: str
    city: str
    district: Optional[str]
    address: str
    lat: Optional[str]
    lng: Optional[str]
    type: str
    price_from: Optional[int]
    hours_text: Optional[str]
    tags: Optional[str]  # JSON string
    cover_image_url: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Feedback Models
class FeedbackCreate(BaseModel):
    """Model for creating user feedback."""
    user_id: Optional[int] = Field(None, description="User ID (optional for anonymous)")
    email: Optional[EmailStr] = Field(None, description="Contact email")
    category: FeedbackCategory = Field(..., description="Feedback category")
    subject: str = Field(..., min_length=1, max_length=255, description="Subject")
    message: str = Field(..., min_length=1, description="Detailed message")
    app_version: Optional[str] = Field(None, max_length=50, description="App version")
    device_info: Optional[str] = Field(None, description="Device information")


class FeedbackResponse(BaseModel):
    """Model for feedback response."""
    id: int
    user_id: Optional[int]
    email: Optional[str]
    category: str
    subject: str
    message: str
    app_version: Optional[str]
    device_info: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Generic Response Models
class SuccessResponse(BaseModel):
    """Generic success response."""
    success: bool = True
    message: str


class ErrorResponse(BaseModel):
    """Generic error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
