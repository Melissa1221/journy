"""
Trip Pydantic Models

Request/response models for trip API endpoints.
"""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CreateTripRequest(BaseModel):
    """Request body for creating a new trip."""
    name: str = Field(..., min_length=1, max_length=100, description="Trip name")
    start_date: date = Field(..., description="Trip start date")
    end_date: date = Field(..., description="Trip end date")
    location: Optional[str] = Field(None, max_length=200, description="Trip location/destination")


class UpdateTripRequest(BaseModel):
    """Request body for updating a trip."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = Field(None, max_length=200)
    status: Optional[str] = Field(None, pattern="^(active|completed|cancelled)$")


class JoinTripRequest(BaseModel):
    """Request body for joining a trip (anonymous users)."""
    display_name: str = Field(..., min_length=1, max_length=50, description="Display name for anonymous user")


class TripResponse(BaseModel):
    """Full trip response for authenticated users."""
    id: int
    name: str
    session_code: str
    start_date: date
    end_date: date
    location: Optional[str]
    status: str
    creator_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TripPublicInfo(BaseModel):
    """Limited trip info for join page (no auth required)."""
    id: int
    name: str
    start_date: date
    end_date: date
    location: Optional[str]
    participant_count: int
    status: str


class TripListResponse(BaseModel):
    """Response for listing user's trips."""
    trips: List[TripResponse]
    total: int
