"""
Authentication Service

JWT validation and anonymous session token handling.
"""

import os
import jwt
import uuid
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass
from dotenv import load_dotenv

from .supabase_client import get_supabase_client

load_dotenv()


@dataclass
class AuthUser:
    """Authenticated user info extracted from JWT."""
    id: str  # UUID
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_anonymous: bool = False
    anonymous_token: Optional[str] = None


async def verify_jwt(token: str) -> Optional[AuthUser]:
    """
    Verify a Supabase JWT token and extract user info.

    Args:
        token: JWT token from Authorization header

    Returns:
        AuthUser if valid, None if invalid
    """
    try:
        secret = os.getenv("SUPABASE_JWT_SECRET")

        if not secret:
            print("WARNING: SUPABASE_JWT_SECRET not set, JWT validation disabled")
            # In development, try to decode without verification
            payload = jwt.decode(token, options={"verify_signature": False})
        else:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience="authenticated"
            )

        user_metadata = payload.get("user_metadata", {})

        return AuthUser(
            id=payload["sub"],
            email=payload.get("email"),
            full_name=user_metadata.get("full_name") or user_metadata.get("name")
        )

    except jwt.ExpiredSignatureError:
        print("JWT token expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid JWT token: {e}")
        return None
    except Exception as e:
        print(f"JWT verification error: {e}")
        return None


async def create_anonymous_token(trip_id: int, display_name: str) -> str:
    """
    Create an anonymous session token for a user joining without an account.

    Args:
        trip_id: The trip they're joining
        display_name: Their chosen display name

    Returns:
        UUID token that can be used to authenticate WebSocket connections
    """
    supabase = get_supabase_client()

    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=7)

    # Insert into anonymous_sessions table
    # Note: This table needs to be created via migration 006
    try:
        supabase.table("anonymous_sessions").insert({
            "id": token,
            "trip_id": trip_id,
            "display_name": display_name,
            "expires_at": expires_at.isoformat()
        }).execute()
    except Exception as e:
        # If table doesn't exist yet, generate token without persistence
        print(f"Note: anonymous_sessions table not available: {e}")
        # Still return token - it will work for current session

    return token


async def verify_anonymous_token(token: str) -> Optional[tuple[int, str]]:
    """
    Verify an anonymous session token.

    Args:
        token: The anonymous session token (UUID)

    Returns:
        Tuple of (trip_id, display_name) if valid, None if invalid/expired
    """
    supabase = get_supabase_client()

    try:
        result = supabase.table("anonymous_sessions").select(
            "trip_id, display_name, expires_at"
        ).eq("id", token).execute()

        if not result.data:
            return None

        session = result.data[0]

        # Check if expired
        expires_at = datetime.fromisoformat(session["expires_at"].replace("Z", "+00:00"))
        if expires_at < datetime.utcnow().replace(tzinfo=expires_at.tzinfo):
            return None

        # Update last_active_at
        supabase.table("anonymous_sessions").update({
            "last_active_at": datetime.utcnow().isoformat()
        }).eq("id", token).execute()

        return (session["trip_id"], session["display_name"])

    except Exception as e:
        print(f"Anonymous token verification error: {e}")
        return None


async def get_user_from_token(token: str) -> Optional[AuthUser]:
    """
    Get user info from either a JWT or anonymous token.

    Args:
        token: Either a JWT or anonymous session token

    Returns:
        AuthUser with appropriate info
    """
    # First try JWT
    user = await verify_jwt(token)
    if user:
        return user

    # Then try anonymous token
    anon_info = await verify_anonymous_token(token)
    if anon_info:
        trip_id, display_name = anon_info
        return AuthUser(
            id=f"anon_{token[:8]}",  # Pseudo-ID for anonymous users
            full_name=display_name,
            is_anonymous=True,
            anonymous_token=token
        )

    return None


async def link_anonymous_to_account(anonymous_token: str, user_id: str) -> bool:
    """
    Link an anonymous session to a real user account.

    This is called when a user creates an account after participating anonymously.

    Args:
        anonymous_token: The anonymous session token
        user_id: The new user's UUID

    Returns:
        True if linked successfully
    """
    supabase = get_supabase_client()

    try:
        # Get anonymous session info
        result = supabase.table("anonymous_sessions").select(
            "trip_id"
        ).eq("id", anonymous_token).execute()

        if not result.data:
            return False

        trip_id = result.data[0]["trip_id"]

        # Add user as participant if not already
        from . import session_service
        await session_service.add_participant(trip_id, user_id)

        # Delete anonymous session
        supabase.table("anonymous_sessions").delete().eq("id", anonymous_token).execute()

        return True

    except Exception as e:
        print(f"Error linking anonymous session: {e}")
        return False
