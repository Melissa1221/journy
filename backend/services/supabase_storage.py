"""Supabase Storage service for image uploads."""
import os
import base64
import uuid
import httpx
from typing import Optional
from dataclasses import dataclass

# Singleton instance
_storage_instance: Optional["SupabaseStorage"] = None


@dataclass
class UploadResult:
    """Result of an image upload operation."""
    success: bool
    url: Optional[str] = None
    path: Optional[str] = None
    error: Optional[str] = None


@dataclass
class DeleteResult:
    """Result of an image deletion."""
    success: bool
    error: Optional[str] = None


class SupabaseStorage:
    """Supabase Storage service for uploading and managing images."""

    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_ANON_KEY")
        self.bucket = "trip-photos"

        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")

        self.storage_url = f"{self.url}/storage/v1"
        self.headers = {
            "Authorization": f"Bearer {self.key}",
            "apikey": self.key,
        }

    async def upload(self, base64_data: str, session_id: str, filename: Optional[str] = None) -> UploadResult:
        """
        Upload a base64 encoded image to Supabase Storage.

        Args:
            base64_data: Base64 encoded image (with or without data URL prefix)
            session_id: Session/thread ID for organizing files
            filename: Optional filename, auto-generated if not provided

        Returns:
            UploadResult with url and path on success
        """
        try:
            # Remove data URL prefix if present
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]

            # Decode base64 to bytes
            image_bytes = base64.b64decode(base64_data)

            # Generate unique filename
            if not filename:
                filename = f"{uuid.uuid4()}.jpg"

            # Full path in bucket: session_id/filename
            path = f"{session_id}/{filename}"

            # Upload to Supabase Storage
            upload_url = f"{self.storage_url}/object/{self.bucket}/{path}"

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    upload_url,
                    content=image_bytes,
                    headers={
                        **self.headers,
                        "Content-Type": "image/jpeg",
                    },
                    timeout=30.0
                )

                if response.status_code in (200, 201):
                    # Get public URL
                    public_url = f"{self.storage_url}/object/public/{self.bucket}/{path}"
                    return UploadResult(success=True, url=public_url, path=path)
                else:
                    return UploadResult(
                        success=False,
                        error=f"Upload failed: {response.status_code} - {response.text}"
                    )

        except Exception as e:
            return UploadResult(success=False, error=str(e))

    async def delete(self, path: str) -> DeleteResult:
        """
        Delete an image from Supabase Storage.

        Args:
            path: Full path in bucket (e.g., "session_id/filename.jpg")

        Returns:
            DeleteResult indicating success or failure
        """
        try:
            delete_url = f"{self.storage_url}/object/{self.bucket}/{path}"

            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    delete_url,
                    headers=self.headers,
                    timeout=10.0
                )

                if response.status_code in (200, 204):
                    return DeleteResult(success=True)
                else:
                    return DeleteResult(
                        success=False,
                        error=f"Delete failed: {response.status_code}"
                    )

        except Exception as e:
            return DeleteResult(success=False, error=str(e))

    async def download_as_base64(self, path: str) -> Optional[str]:
        """
        Download an image and return as base64 for LLM viewing.

        Args:
            path: Full path in bucket or public URL

        Returns:
            Base64 encoded image string or None on failure
        """
        try:
            # Handle both path and full URL
            if path.startswith("http"):
                url = path
            else:
                url = f"{self.storage_url}/object/public/{self.bucket}/{path}"

            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=30.0)

                if response.status_code == 200:
                    return base64.b64encode(response.content).decode("utf-8")

        except Exception as e:
            print(f"Error downloading image: {e}")

        return None

    def get_public_url(self, path: str) -> str:
        """Get the public URL for an image path."""
        return f"{self.storage_url}/object/public/{self.bucket}/{path}"


def get_storage() -> SupabaseStorage:
    """Get or create the singleton storage instance."""
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = SupabaseStorage()
    return _storage_instance
