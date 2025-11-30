"""
Supabase Database operations for photos and milestones.

This service handles database persistence for the photo/milestone feature,
separate from the LangGraph state management.
"""
import os
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
import asyncio
from datetime import datetime


@dataclass
class MilestoneRecord:
    """Database record for a milestone."""
    id: int
    trip_id: int
    name: str
    description: Optional[str]
    location: Optional[str]
    tags: List[str]
    created_at: str
    created_by_user_id: Optional[str]
    photo_count: int
    cover_photo_id: Optional[int]


@dataclass
class PhotoRecord:
    """Database record for a photo."""
    id: int
    trip_id: int
    milestone_id: Optional[int]
    uploaded_by_user_id: Optional[str]
    photo_url: str
    thumbnail_url: Optional[str]
    storage_path: Optional[str]
    description: Optional[str]
    tags: List[str]
    detected_people: List[str]
    location_name: Optional[str]
    order_index: int
    created_at: str


class SupabaseDB:
    """
    Database service for photo/milestone operations.

    Uses Supabase Python client for direct database access.
    Requires SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.
    """

    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.service_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

        if not self.url or not self.service_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

        # Lazy import to avoid requiring supabase-py if not used
        try:
            from supabase import create_client, Client
            self.client: Client = create_client(self.url, self.service_key)
        except ImportError:
            print("⚠️ supabase-py not installed. Install with: pip install supabase")
            self.client = None

    async def insert_milestone(
        self,
        trip_id: int,
        name: str,
        description: Optional[str] = None,
        location: Optional[str] = None,
        tags: Optional[List[str]] = None,
        created_by_user_id: Optional[str] = None
    ) -> Optional[MilestoneRecord]:
        """
        Insert a new milestone and return the created record.

        Args:
            trip_id: ID of the trip this milestone belongs to
            name: Name of the milestone (e.g., "Sky Costanera")
            description: Optional description
            location: Optional location name
            tags: Optional list of tags
            created_by_user_id: Optional user ID (can be None for anonymous)

        Returns:
            MilestoneRecord if successful, None if failed
        """
        if not self.client:
            print("⚠️ Supabase client not initialized")
            return None

        try:
            data = {
                "trip_id": trip_id,
                "name": name,
                "description": description,
                "location": location,
                "tags": tags or [],
                "created_by_user_id": created_by_user_id,
                "photo_count": 0
            }

            # Run in thread pool since Supabase client is sync
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.client.table("milestones").insert(data).execute()
            )

            if result.data and len(result.data) > 0:
                record = result.data[0]
                return MilestoneRecord(
                    id=record["id"],
                    trip_id=record["trip_id"],
                    name=record["name"],
                    description=record.get("description"),
                    location=record.get("location"),
                    tags=record.get("tags", []),
                    created_at=record["created_at"],
                    created_by_user_id=record.get("created_by_user_id"),
                    photo_count=record.get("photo_count", 0),
                    cover_photo_id=record.get("cover_photo_id")
                )

            return None

        except Exception as e:
            print(f"❌ Failed to insert milestone: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def insert_photo(
        self,
        trip_id: int,
        milestone_id: Optional[int],
        photo_url: str,
        storage_path: str,
        uploaded_by_user_id: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        detected_people: Optional[List[str]] = None,
        location_name: Optional[str] = None,
        order_index: int = 0
    ) -> Optional[PhotoRecord]:
        """
        Insert a new photo and return the created record.

        Args:
            trip_id: ID of the trip this photo belongs to
            milestone_id: Optional milestone ID to group this photo
            photo_url: Public URL of the photo
            storage_path: Storage path in Supabase bucket
            uploaded_by_user_id: Optional user ID
            description: AI-generated description
            tags: AI-detected tags
            detected_people: Names detected in photo
            location_name: Optional location
            order_index: Display order within milestone

        Returns:
            PhotoRecord if successful, None if failed
        """
        if not self.client:
            print("⚠️ Supabase client not initialized")
            return None

        try:
            data = {
                "trip_id": trip_id,
                "milestone_id": milestone_id,
                "uploaded_by_user_id": uploaded_by_user_id,
                "photo_url": photo_url,
                "storage_path": storage_path,
                "description": description,
                "tags": tags or [],
                "detected_people": detected_people or [],
                "location_name": location_name,
                "order_index": order_index
            }

            # Run in thread pool
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.client.table("photos").insert(data).execute()
            )

            if result.data and len(result.data) > 0:
                record = result.data[0]
                return PhotoRecord(
                    id=record["id"],
                    trip_id=record["trip_id"],
                    milestone_id=record.get("milestone_id"),
                    uploaded_by_user_id=record.get("uploaded_by_user_id"),
                    photo_url=record["photo_url"],
                    thumbnail_url=record.get("thumbnail_url"),
                    storage_path=record.get("storage_path"),
                    description=record.get("description"),
                    tags=record.get("tags", []),
                    detected_people=record.get("detected_people", []),
                    location_name=record.get("location_name"),
                    order_index=record.get("order_index", 0),
                    created_at=record["created_at"]
                )

            return None

        except Exception as e:
            print(f"❌ Failed to insert photo: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def get_trip_milestones(self, trip_id: int) -> List[Dict[str, Any]]:
        """Get all milestones for a trip, ordered by creation date."""
        if not self.client:
            return []

        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.client.table("milestones")
                    .select("*")
                    .eq("trip_id", trip_id)
                    .order("created_at", desc=True)
                    .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"❌ Failed to fetch milestones: {e}")
            return []

    async def get_milestone_photos(self, milestone_id: int) -> List[Dict[str, Any]]:
        """Get all photos in a milestone, ordered by order_index."""
        if not self.client:
            return []

        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.client.table("photos")
                    .select("*")
                    .eq("milestone_id", milestone_id)
                    .order("order_index")
                    .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"❌ Failed to fetch milestone photos: {e}")
            return []

    async def get_trip_photos(self, trip_id: int) -> List[Dict[str, Any]]:
        """Get all photos for a trip across all milestones."""
        if not self.client:
            return []

        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.client.table("photos")
                    .select("*")
                    .eq("trip_id", trip_id)
                    .order("created_at", desc=True)
                    .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"❌ Failed to fetch trip photos: {e}")
            return []

    def get_trip_id_from_session_code(self, session_code: str) -> Optional[int]:
        """
        Lookup trip_id from session_code.

        This is a sync method since it's called from WebSocket handler.
        """
        if not self.client:
            return None

        try:
            result = self.client.table("trips")\
                .select("id")\
                .eq("session_code", session_code)\
                .execute()

            if result.data and len(result.data) > 0:
                return result.data[0]["id"]

            return None
        except Exception as e:
            print(f"❌ Failed to lookup trip by session code: {e}")
            return None


# Singleton instance
_db_instance: Optional[SupabaseDB] = None


def get_db() -> SupabaseDB:
    """Get or create the singleton database instance."""
    global _db_instance
    if _db_instance is None:
        _db_instance = SupabaseDB()
    return _db_instance
