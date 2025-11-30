"""
Room Manager for Multi-User WebSocket Sessions

Handles multiple users connecting to the same session/thread,
broadcasting messages to all participants in real-time.
"""

from typing import Dict, Set, List
import asyncio
from fastapi import WebSocket
from datetime import datetime


class RoomManager:
    """Manages WebSocket connections for multi-user chat rooms."""

    def __init__(self):
        # thread_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # thread_id -> list of message history
        self.room_history: Dict[str, List[dict]] = {}
        # thread_id -> set of participant names
        self.participants: Dict[str, Set[str]] = {}
        # Lock for thread-safe operations
        self.lock = asyncio.Lock()

    async def connect(
        self,
        thread_id: str,
        user_id: str,
        websocket: WebSocket
    ) -> List[dict]:
        """
        Add a client to a room and return message history.

        Args:
            thread_id: The session/room identifier
            user_id: The user's identifier
            websocket: The WebSocket connection

        Returns:
            List of previous messages in the room
        """
        await websocket.accept()

        async with self.lock:
            # Initialize room if it doesn't exist
            if thread_id not in self.active_connections:
                self.active_connections[thread_id] = set()
                self.room_history[thread_id] = []
                self.participants[thread_id] = set()

            self.active_connections[thread_id].add(websocket)
            self.participants[thread_id].add(user_id)

            # Return history for the new client
            return list(self.room_history[thread_id])

    async def disconnect(
        self,
        thread_id: str,
        user_id: str,
        websocket: WebSocket
    ):
        """Remove a client from a room."""
        async with self.lock:
            if thread_id in self.active_connections:
                self.active_connections[thread_id].discard(websocket)
                # Note: We don't remove user_id from participants
                # because they might reconnect

                # Clean up empty rooms (optional)
                if not self.active_connections[thread_id]:
                    # Keep history for potential reconnections
                    pass

    async def broadcast(self, thread_id: str, message: dict):
        """
        Send a message to ALL clients connected to a room.

        Args:
            thread_id: The room to broadcast to
            message: The message dict to send
        """
        if thread_id not in self.active_connections:
            return

        # Add timestamp if not present
        if "timestamp" not in message:
            message["timestamp"] = datetime.utcnow().isoformat()

        async with self.lock:
            # Store in history (except for stream chunks)
            if message.get("type") not in ["bot_chunk"]:
                self.room_history[thread_id].append(message)

            # Get connections snapshot
            connections = list(self.active_connections[thread_id])

        # Send to all connections (without holding lock)
        disconnected = []
        for conn in connections:
            try:
                await conn.send_json(message)
            except Exception:
                disconnected.append(conn)

        # Clean up disconnected clients
        if disconnected:
            async with self.lock:
                for conn in disconnected:
                    self.active_connections[thread_id].discard(conn)

    async def send_to_one(self, websocket: WebSocket, message: dict):
        """Send a message to a specific client."""
        try:
            await websocket.send_json(message)
        except Exception:
            pass

    def get_participants(self, thread_id: str) -> List[str]:
        """Get list of participants in a room."""
        return list(self.participants.get(thread_id, set()))

    def get_connection_count(self, thread_id: str) -> int:
        """Get number of active connections in a room."""
        return len(self.active_connections.get(thread_id, set()))

    def get_history(self, thread_id: str) -> List[dict]:
        """Get message history for a room."""
        return list(self.room_history.get(thread_id, []))


# Global instance
room_manager = RoomManager()
