"""
Authentication Middleware

FastAPI dependencies for route protection.
"""

from fastapi import Request, HTTPException, Depends
from typing import Optional

from services.auth_service import AuthUser, verify_jwt, get_user_from_token
from services import session_service


async def get_optional_user(request: Request) -> Optional[AuthUser]:
    """
    Extract user from Authorization header if present.

    Use this for routes that work with or without authentication.
    """
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None

    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    return await verify_jwt(token)


async def require_auth(request: Request) -> AuthUser:
    """
    Require valid authentication.

    Use this for protected routes that need a logged-in user.
    """
    user = await get_optional_user(request)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user


async def require_trip_access(
    trip_id: int,
    user: AuthUser = Depends(require_auth)
) -> dict:
    """
    Verify user has access to a specific trip.

    Returns the trip if user is a participant.
    """
    trip = await session_service.get_trip_by_id(trip_id)

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip["status"] != "active":
        raise HTTPException(status_code=410, detail="Trip is no longer active")

    is_participant = await session_service.is_participant(trip_id, user.id)

    if not is_participant:
        raise HTTPException(
            status_code=403,
            detail="You are not a participant of this trip"
        )

    return trip


async def require_trip_owner(
    trip_id: int,
    user: AuthUser = Depends(require_auth)
) -> dict:
    """
    Require user to be the trip creator/owner.

    Use this for operations like deleting a trip.
    """
    trip = await session_service.get_trip_by_id(trip_id)

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip["creator_id"] != user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the trip creator can perform this action"
        )

    return trip
