"""
Session/Trip Service

CRUD operations for trips using Supabase.
"""

from datetime import date
from typing import Optional, List
from .supabase_client import get_supabase_client


async def create_trip(
    creator_id: str,
    name: str,
    start_date: date,
    end_date: date,
    location: Optional[str] = None
) -> dict:
    """
    Create a new trip with a unique session code.

    Args:
        creator_id: UUID of the authenticated user creating the trip
        name: Name of the trip
        start_date: Trip start date
        end_date: Trip end date
        location: Optional location/destination

    Returns:
        Created trip record including generated session_code
    """
    supabase = get_supabase_client()

    # Generate unique session code using database function
    code_result = supabase.rpc('generate_session_code').execute()
    session_code = code_result.data

    # Insert trip
    trip_data = {
        "creator_id": creator_id,
        "name": name,
        "session_code": session_code,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "location": location,
        "status": "active"
    }

    result = supabase.table("trips").insert(trip_data).execute()
    trip = result.data[0]

    # Add creator as admin participant
    supabase.table("trip_participants").insert({
        "trip_id": trip["id"],
        "user_id": creator_id,
        "role": "admin"
    }).execute()

    return trip


async def get_trip_by_id(trip_id: int) -> Optional[dict]:
    """Get trip by ID."""
    supabase = get_supabase_client()

    result = supabase.table("trips").select("*").eq("id", trip_id).execute()

    if result.data:
        return result.data[0]
    return None


async def get_trip_by_code(session_code: str) -> Optional[dict]:
    """Get trip by session code (case-insensitive)."""
    supabase = get_supabase_client()

    result = supabase.table("trips").select("*").eq(
        "session_code", session_code.upper()
    ).execute()

    if result.data:
        return result.data[0]
    return None


async def get_user_trips(user_id: str) -> List[dict]:
    """Get all trips for a user (as participant or creator)."""
    supabase = get_supabase_client()

    # Get trip IDs where user is a participant
    participants_result = supabase.table("trip_participants").select(
        "trip_id"
    ).eq("user_id", user_id).execute()

    if not participants_result.data:
        return []

    trip_ids = [p["trip_id"] for p in participants_result.data]

    # Get trip details
    trips_result = supabase.table("trips").select("*").in_(
        "id", trip_ids
    ).order("created_at", desc=True).execute()

    return trips_result.data


async def get_participant_count(trip_id: int) -> int:
    """Get number of participants in a trip."""
    supabase = get_supabase_client()

    result = supabase.table("trip_participants").select(
        "id", count="exact"
    ).eq("trip_id", trip_id).execute()

    return result.count or 0


async def is_participant(trip_id: int, user_id: str) -> bool:
    """Check if user is a participant in the trip."""
    supabase = get_supabase_client()

    result = supabase.table("trip_participants").select("id").eq(
        "trip_id", trip_id
    ).eq("user_id", user_id).execute()

    return len(result.data) > 0


async def add_participant(trip_id: int, user_id: str, role: str = "member") -> dict:
    """Add a user as participant to a trip."""
    supabase = get_supabase_client()

    # Check if already a participant
    existing = supabase.table("trip_participants").select("id").eq(
        "trip_id", trip_id
    ).eq("user_id", user_id).execute()

    if existing.data:
        return existing.data[0]

    result = supabase.table("trip_participants").insert({
        "trip_id": trip_id,
        "user_id": user_id,
        "role": role
    }).execute()

    return result.data[0]


async def delete_trip(trip_id: int) -> bool:
    """Delete a trip (cascades to participants, etc.)."""
    supabase = get_supabase_client()

    result = supabase.table("trips").delete().eq("id", trip_id).execute()

    return len(result.data) > 0


async def update_trip(trip_id: int, **updates) -> Optional[dict]:
    """Update trip fields."""
    supabase = get_supabase_client()

    # Filter out None values
    updates = {k: v for k, v in updates.items() if v is not None}

    if not updates:
        return await get_trip_by_id(trip_id)

    result = supabase.table("trips").update(updates).eq("id", trip_id).execute()

    if result.data:
        return result.data[0]
    return None
