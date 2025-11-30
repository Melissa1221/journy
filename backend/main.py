"""
Journi Backend - FastAPI Server

Multi-user real-time expense tracking with:
- WebSocket endpoint for multi-user chat rooms
- HTTP endpoint for Vercel AI SDK compatibility
- LangGraph agent for expense processing
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Union
import json
import uuid
import asyncio
from datetime import datetime
import os
from dotenv import load_dotenv

from room_manager import room_manager
from graph import graph, get_initial_state, normalize_name, get_graph
from services import get_storage, session_service, auth_service
from services.auth_service import AuthUser
from langchain_core.messages import SystemMessage
from typing import List

load_dotenv()

# ============== FASTAPI APP ==============

app = FastAPI(
    title="Journi API",
    description="Multi-user expense tracking with AI",
    version="0.1.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize async graph with PostgreSQL checkpointer on startup."""
    print("🚀 Initializing async graph with PostgreSQL...")
    await get_graph()
    print("✅ Graph initialized successfully")


# ============== MODELS ==============

class ChatMessage(BaseModel):
    content: str
    user_id: Optional[str] = None
    image: Optional[str] = None  # Base64 encoded image


class ImageData(BaseModel):
    """Image data for multimodal messages."""
    data: str  # Base64 encoded image data
    media_type: str = "image/jpeg"  # MIME type


def extract_text_content(content) -> str:
    """Extract text from LangChain message content (handles Anthropic's content blocks)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        # Handle Anthropic's content block format: [{"type": "text", "text": "..."}]
        texts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                texts.append(block.get("text", ""))
            elif isinstance(block, str):
                texts.append(block)
        return "".join(texts)
    return str(content)


def filter_json_from_response(text: str, strip: bool = False) -> str:
    """Remove JSON tool outputs from response text that might leak through.

    Args:
        text: The text to filter
        strip: Whether to strip whitespace (False for streaming chunks to preserve spaces)
    """
    import re
    # Filter out JSON-like patterns that look like tool outputs
    # Match {"action": ...} patterns
    text = re.sub(r'\{["\']action["\']:\s*["\'][^"\']+["\'][^}]*\}', '', text)
    # Clean up any double spaces or newlines left behind (but NOT single spaces)
    text = re.sub(r'\n\s*\n', '\n', text)
    text = re.sub(r'  +', ' ', text)
    return text.strip() if strip else text


def is_tool_related_content(content: str) -> bool:
    """Check if content appears to be tool/JSON output that shouldn't be shown."""
    if not content:
        return False
    content = content.strip()
    # Check if it looks like JSON tool output
    if content.startswith('{') and '"action"' in content:
        return True
    # Check for tool result patterns
    if content.startswith('Gasto registrado:') or content.startswith('Balance'):
        return False  # These are valid responses
    return False


def calculate_debts(balances: dict) -> dict:
    """
    Calculate optimized debts from multi-currency balances.

    Args:
        balances: Dict of {person: {currency: amount}}

    Returns:
        Dict of {currency: [{"from": "Juan", "to": "María", "amount": 15.0}, ...]}
    """
    if not balances:
        return {}

    # Collect all currencies
    all_currencies = set()
    for person_bals in balances.values():
        if isinstance(person_bals, dict):
            all_currencies.update(person_bals.keys())

    # If old format (single value per person), treat as PEN
    if not all_currencies:
        # Legacy format compatibility
        debtors = [(p, -b) for p, b in balances.items() if isinstance(b, (int, float)) and b < -0.01]
        creditors = [(p, b) for p, b in balances.items() if isinstance(b, (int, float)) and b > 0.01]
        debtors.sort(key=lambda x: x[1], reverse=True)
        creditors.sort(key=lambda x: x[1], reverse=True)
        debts = []
        i, j = 0, 0
        while i < len(debtors) and j < len(creditors):
            debtor, debt = debtors[i]
            creditor, credit = creditors[j]
            amount = min(debt, credit)
            if amount > 0.01:
                debts.append({"from": debtor, "to": creditor, "amount": round(amount, 2), "currency": "PEN"})
            if abs(debt - amount) < 0.01:
                i += 1
            else:
                debtors[i] = (debtor, debt - amount)
            if abs(credit - amount) < 0.01:
                j += 1
            else:
                creditors[j] = (creditor, credit - amount)
        return {"PEN": debts} if debts else {}

    # Multi-currency format
    result = {}
    for currency in sorted(all_currencies):
        # Get balances for this currency
        currency_balances = {p: bals.get(currency, 0) for p, bals in balances.items() if isinstance(bals, dict)}

        debtors = [(p, -b) for p, b in currency_balances.items() if b < -0.01]
        creditors = [(p, b) for p, b in currency_balances.items() if b > 0.01]

        debtors.sort(key=lambda x: x[1], reverse=True)
        creditors.sort(key=lambda x: x[1], reverse=True)

        debts = []
        i, j = 0, 0
        while i < len(debtors) and j < len(creditors):
            debtor, debt = debtors[i]
            creditor, credit = creditors[j]
            amount = min(debt, credit)

            if amount > 0.01:
                debts.append({
                    "from": debtor,
                    "to": creditor,
                    "amount": round(amount, 2),
                    "currency": currency
                })

            if abs(debt - amount) < 0.01:
                i += 1
            else:
                debtors[i] = (debtor, debt - amount)

            if abs(credit - amount) < 0.01:
                j += 1
            else:
                creditors[j] = (creditor, credit - amount)

        if debts:
            result[currency] = debts

    return result


def extract_structured_data(state_values: dict) -> dict:
    """Extract structured data from state for rich UI rendering."""
    balances = state_values.get("balances", {})
    return {
        "expenses": state_values.get("expenses", []),
        "payments": state_values.get("payments", []),
        "balances": balances,
        "participants": state_values.get("participants", []),
        "debts": calculate_debts(balances),
        "last_action": None  # Will be populated by tool execution
    }


def detect_action_from_expenses(old_expenses: list, new_expenses: list,
                                 old_payments: list, new_payments: list) -> Optional[dict]:
    """Detect what action was performed by comparing states."""
    # Check for new expense
    if len(new_expenses) > len(old_expenses):
        new_exp = new_expenses[-1]
        return {
            "type": "expense_added",
            "data": new_exp
        }

    # Check for deleted expense
    if len(new_expenses) < len(old_expenses):
        # Find which was deleted
        new_ids = {e["id"] for e in new_expenses}
        for exp in old_expenses:
            if exp["id"] not in new_ids:
                return {
                    "type": "expense_deleted",
                    "data": exp
                }

    # Check for edited expense
    if len(new_expenses) == len(old_expenses) and old_expenses:
        for old, new in zip(old_expenses, new_expenses):
            if old != new:
                return {
                    "type": "expense_edited",
                    "data": new,
                    "old_data": old
                }

    # Check for new payment
    if len(new_payments) > len(old_payments):
        new_pay = new_payments[-1]
        return {
            "type": "payment_added",
            "data": new_pay
        }

    return None


def build_multimodal_content(text: str, image_base64: Optional[str] = None,
                              image_type: str = "image/jpeg") -> Union[list, str]:
    """Build multimodal content for LangChain messages.

    Args:
        text: The text content of the message
        image_base64: Optional base64-encoded image data
        image_type: MIME type of the image (default: image/jpeg)

    Returns:
        Either a string (text only) or a list of content blocks (multimodal)
    """
    if not image_base64:
        return text

    # Clean up base64 string if it has a data URL prefix
    if image_base64.startswith('data:'):
        # Extract media type and data from data URL
        # Format: data:image/jpeg;base64,/9j/4AAQ...
        parts = image_base64.split(',', 1)
        if len(parts) == 2:
            # Extract media type from the first part
            media_part = parts[0]
            if 'image/' in media_part:
                image_type = media_part.split(';')[0].replace('data:', '')
            image_base64 = parts[1]

    # Build multimodal content in OpenAI-compatible format (used by OpenRouter)
    return [
        {
            "type": "text",
            "text": text
        },
        {
            "type": "image_url",
            "image_url": {
                "url": f"data:{image_type};base64,{image_base64}"
            }
        }
    ]


class ChatRequest(BaseModel):
    messages: list[dict]
    id: Optional[str] = None  # thread_id


# ============== HTTP ENDPOINTS ==============

@app.get("/")
async def root():
    """Health check and info."""
    return {
        "service": "Journi",
        "status": "running",
        "endpoints": {
            "websocket": "/ws/{thread_id}/{user_id}",
            "http_chat": "/api/chat",
            "sessions": "/api/sessions"
        }
    }


@app.post("/api/chat")
async def chat_http(request: ChatRequest):
    """
    HTTP endpoint for chat (compatible with Vercel AI SDK useChat).

    Streams response using Server-Sent Events in the Data Stream Protocol format.
    """
    thread_id = request.id or str(uuid.uuid4())
    messages = request.messages
    graph = await get_graph()

    async def generate_stream():
        """Generate SSE stream compatible with Vercel AI SDK."""
        message_id = f"msg_{uuid.uuid4().hex[:16]}"

        # 1. Start event
        yield f'data: {json.dumps({"type": "start", "messageId": message_id})}\n\n'

        # 2. Text start
        yield f'data: {json.dumps({"type": "text-start", "id": message_id})}\n\n'

        try:
            # Prepare input for graph
            last_user_message = None
            for msg in reversed(messages):
                if msg.get("role") == "user":
                    last_user_message = msg.get("content", "")
                    break

            if not last_user_message:
                yield f'data: {json.dumps({"type": "text-delta", "id": message_id, "delta": "No entendí tu mensaje."})}\n\n'
            else:
                config = {"configurable": {"thread_id": thread_id}}

                # Stream from LangGraph
                full_response = ""
                async for event in graph.astream(
                    {"messages": [{"role": "user", "content": last_user_message}]},
                    config=config,
                    stream_mode="messages"
                ):
                    # Extract content from the event
                    if event and len(event) > 0:
                        msg = event[0]
                        if hasattr(msg, 'content') and msg.content:
                            # Only stream AI responses, not tool messages
                            if hasattr(msg, 'type') and msg.type in ("ai", "AIMessageChunk"):
                                chunk = extract_text_content(msg.content)
                                full_response += chunk
                                yield f'data: {json.dumps({"type": "text-delta", "id": message_id, "delta": chunk})}\n\n'
                                await asyncio.sleep(0)  # Yield control

                # If no response was streamed, get the final state
                if not full_response:
                    state = await graph.aget_state(config)
                    if state.values.get("messages"):
                        last_msg = state.values["messages"][-1]
                        if hasattr(last_msg, 'content'):
                            yield f'data: {json.dumps({"type": "text-delta", "id": message_id, "delta": extract_text_content(last_msg.content)})}\n\n'

        except Exception as e:
            error_msg = f"Error: {str(e)}"
            yield f'data: {json.dumps({"type": "text-delta", "id": message_id, "delta": error_msg})}\n\n'

        # 3. Text end
        yield f'data: {json.dumps({"type": "text-end", "id": message_id})}\n\n'

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Vercel-AI-Data-Stream": "v1"
        }
    )


@app.get("/api/sessions/{thread_id}")
async def get_session(thread_id: str):
    """Get session state including expenses and balances."""
    graph = await get_graph()
    config = {"configurable": {"thread_id": thread_id}}

    try:
        state = await graph.aget_state(config)
        return {
            "thread_id": thread_id,
            "participants": state.values.get("participants", []),
            "expenses": state.values.get("expenses", []),
            "balances": state.values.get("balances", {}),
            "message_count": len(state.values.get("messages", []))
        }
    except Exception:
        return {
            "thread_id": thread_id,
            "participants": [],
            "expenses": [],
            "balances": {},
            "message_count": 0
        }


@app.get("/api/sessions/{thread_id}/history")
async def get_session_history(thread_id: str):
    """
    Get chat history for a session.

    Returns messages in a format ready for the frontend:
    - user messages with user_id
    - bot messages with content
    - Filters out system messages and tool messages
    """
    graph = await get_graph()
    config = {"configurable": {"thread_id": thread_id}}

    try:
        state = await graph.aget_state(config)
        raw_messages = state.values.get("messages", [])

        # Convert LangGraph messages to frontend format
        history = []
        for msg in raw_messages:
            msg_type = getattr(msg, 'type', None)

            # Skip tool messages and system messages
            if msg_type in ('tool', 'system'):
                continue

            content = extract_text_content(getattr(msg, 'content', ''))

            # Filter out empty or JSON-only content
            if not content or is_tool_related_content(content):
                continue

            filtered_content = filter_json_from_response(content, strip=True)
            if not filtered_content:
                continue

            if msg_type == 'human':
                # Parse user_id from message format "[user_id]: content"
                user_id = "Usuario"
                actual_content = filtered_content
                if filtered_content.startswith('[') and ']: ' in filtered_content:
                    parts = filtered_content.split(']: ', 1)
                    user_id = parts[0][1:]  # Remove leading [
                    actual_content = parts[1] if len(parts) > 1 else filtered_content

                history.append({
                    "type": "user",
                    "user_id": user_id,
                    "content": actual_content,
                    "timestamp": datetime.now().isoformat()  # LangGraph doesn't store timestamps
                })
            elif msg_type in ('ai', 'AIMessageChunk'):
                history.append({
                    "type": "bot",
                    "content": filtered_content,
                    "timestamp": datetime.now().isoformat()
                })

        # Also return current state for UI
        balances = state.values.get("balances", {})
        return {
            "thread_id": thread_id,
            "messages": history,
            "state": {
                "expenses": state.values.get("expenses", []),
                "payments": state.values.get("payments", []),
                "balances": balances,
                "participants": state.values.get("participants", []),
                "debts": calculate_debts(balances),
                "milestones": state.values.get("milestones", []),
                "photos": state.values.get("photos", [])
            }
        }
    except Exception as e:
        print(f"Error getting history for {thread_id}: {e}")
        return {
            "thread_id": thread_id,
            "messages": [],
            "state": {
                "expenses": [],
                "payments": [],
                "balances": {},
                "participants": [],
                "debts": {},
                "milestones": [],
                "photos": []
            }
        }


# ============== TRIP API ENDPOINTS ==============

# Auth helper function
async def get_auth_user(request: Request) -> Optional[AuthUser]:
    """Extract authenticated user from request headers."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    return await auth_service.verify_jwt(token)


async def require_auth_user(request: Request) -> AuthUser:
    """Require authenticated user."""
    user = await get_auth_user(request)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user


@app.post("/api/trips")
async def create_trip(request: Request):
    """
    Create a new trip. Requires authentication.

    Returns the created trip with generated session_code.
    """
    user = await require_auth_user(request)

    body = await request.json()

    # Validate required fields
    name = body.get("name")
    start_date = body.get("start_date")
    end_date = body.get("end_date")

    if not name or not start_date or not end_date:
        raise HTTPException(
            status_code=400,
            detail="name, start_date, and end_date are required"
        )

    # Parse dates
    from datetime import date
    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD"
        )

    if end < start:
        raise HTTPException(
            status_code=400,
            detail="end_date must be after start_date"
        )

    # Create trip
    trip = await session_service.create_trip(
        creator_id=user.id,
        name=name,
        start_date=start,
        end_date=end,
        location=body.get("location")
    )

    return trip


@app.get("/api/trips")
async def list_trips(request: Request):
    """List all trips for the authenticated user."""
    user = await require_auth_user(request)

    trips = await session_service.get_user_trips(user.id)

    return {"trips": trips, "total": len(trips)}


@app.get("/api/trips/{trip_id}")
async def get_trip(trip_id: int, request: Request):
    """Get trip details. Requires participant access."""
    user = await require_auth_user(request)

    trip = await session_service.get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_participant = await session_service.is_participant(trip_id, user.id)
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not a participant of this trip")

    return trip


@app.get("/api/trips/code/{code}")
async def get_trip_by_code(code: str):
    """
    Public endpoint to lookup trip by session code.
    Used by join page to display trip info before joining.
    """
    trip = await session_service.get_trip_by_code(code.upper())

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip["status"] != "active":
        raise HTTPException(status_code=410, detail="Trip is no longer active")

    participant_count = await session_service.get_participant_count(trip["id"])

    # Return limited public info
    return {
        "id": trip["id"],
        "name": trip["name"],
        "start_date": trip["start_date"],
        "end_date": trip["end_date"],
        "location": trip.get("location"),
        "participant_count": participant_count,
        "status": trip["status"]
    }


@app.post("/api/trips/{trip_id}/join")
async def join_trip(trip_id: int, request: Request):
    """
    Join a trip.
    - Authenticated users: linked via user_id
    - Anonymous users: get temporary token with display_name
    """
    trip = await session_service.get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip["status"] != "active":
        raise HTTPException(status_code=410, detail="Trip is no longer active")

    # Check if authenticated
    user = await get_auth_user(request)
    body = await request.json()

    if user:
        # Authenticated user
        await session_service.add_participant(trip_id, user.id)
        return {
            "status": "joined",
            "user_id": user.id,
            "trip_id": trip_id,
            "session_code": trip["session_code"]
        }
    else:
        # Anonymous user - needs display_name
        display_name = body.get("display_name")
        if not display_name:
            raise HTTPException(
                status_code=400,
                detail="display_name required for anonymous users"
            )

        # Create anonymous token
        token = await auth_service.create_anonymous_token(trip_id, display_name)

        return {
            "status": "joined",
            "anonymous_token": token,
            "display_name": display_name,
            "trip_id": trip_id,
            "session_code": trip["session_code"]
        }


@app.delete("/api/trips/{trip_id}")
async def delete_trip(trip_id: int, request: Request):
    """Delete a trip. Creator only."""
    user = await require_auth_user(request)

    trip = await session_service.get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip["creator_id"] != user.id:
        raise HTTPException(status_code=403, detail="Only the trip creator can delete")

    await session_service.delete_trip(trip_id)

    return {"status": "deleted", "trip_id": trip_id}


@app.post("/api/trips/{trip_id}/finalize")
async def finalize_trip(trip_id: int, request: Request):
    """
    Finalize a trip - marks it as completed and returns final summary.

    Only the trip creator can finalize the trip.
    Returns the final summary with total spent and all debts.
    """
    user = await require_auth_user(request)

    trip = await session_service.get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Only creator can finalize
    if trip["creator_id"] != user.id:
        raise HTTPException(status_code=403, detail="Only the trip creator can finalize")

    if trip["status"] == "completed":
        raise HTTPException(status_code=400, detail="Trip already finalized")

    # Get the session state from LangGraph
    graph = await get_graph()
    session_code = trip["session_code"]
    config = {"configurable": {"thread_id": session_code}}

    try:
        state = await graph.aget_state(config)
        expenses = state.values.get("expenses", [])
        balances = state.values.get("balances", {})
        participants = state.values.get("participants", [])
        debts = calculate_debts(balances)
    except Exception as e:
        print(f"Error getting state for finalize: {e}")
        expenses = []
        balances = {}
        participants = []
        debts = {}

    # Calculate totals
    total_spent = sum(exp.get("amount", 0) for exp in expenses)

    # Flatten debts for response
    all_debts = []
    for currency, debt_list in debts.items():
        for debt in debt_list:
            all_debts.append({
                "from": debt["from"],
                "to": debt["to"],
                "amount": debt["amount"],
                "currency": currency
            })

    # Update trip status to completed
    await session_service.update_trip_status(trip_id, "completed")

    return {
        "status": "finalized",
        "trip": {
            "id": trip_id,
            "name": trip["name"],
            "start_date": trip.get("start_date"),
            "end_date": trip.get("end_date"),
            "location": trip.get("location"),
        },
        "summary": {
            "total_spent": total_spent,
            "expense_count": len(expenses),
            "participant_count": len(participants),
            "participants": participants,
            "debts": all_debts,
            "expenses": expenses,
            "balances": balances
        }
    }


@app.get("/api/sessions/{session_code}/summary")
async def get_session_summary(session_code: str):
    """
    Get current session summary (without finalizing).
    Used to display the finalize confirmation modal.
    """
    graph = await get_graph()
    config = {"configurable": {"thread_id": session_code}}

    try:
        state = await graph.aget_state(config)
        expenses = state.values.get("expenses", [])
        balances = state.values.get("balances", {})
        participants = state.values.get("participants", [])
        debts = calculate_debts(balances)
    except Exception:
        expenses = []
        balances = {}
        participants = []
        debts = {}

    total_spent = sum(exp.get("amount", 0) for exp in expenses)

    # Flatten debts
    all_debts = []
    for currency, debt_list in debts.items():
        for debt in debt_list:
            all_debts.append({
                "from": debt["from"],
                "to": debt["to"],
                "amount": debt["amount"],
                "currency": currency
            })

    return {
        "session_code": session_code,
        "total_spent": total_spent,
        "expense_count": len(expenses),
        "participant_count": len(participants),
        "participants": participants,
        "debts": all_debts,
        "expenses": expenses
    }


# ============== AUDIO TRANSCRIPTION ==============

@app.post("/api/transcribe")
async def transcribe_audio(request: Request):
    """
    Transcribe audio using OpenAI Whisper API.
    Accepts audio file via multipart form data.
    """
    import httpx
    import tempfile

    form = await request.form()
    audio_file = form.get("audio")

    if not audio_file:
        raise HTTPException(status_code=400, detail="No audio file provided")

    # Read the audio content
    audio_content = await audio_file.read()

    # Save to temp file (Whisper API needs a file)
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_content)
        tmp_path = tmp.name

    try:
        # Call OpenAI Whisper API
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")

        async with httpx.AsyncClient() as client:
            with open(tmp_path, "rb") as f:
                response = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {openai_key}"},
                    files={"file": ("audio.webm", f, "audio/webm")},
                    data={"model": "whisper-1", "language": "es"},
                    timeout=30.0
                )

            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Whisper API error: {response.text}")

            result = response.json()
            return {"text": result.get("text", "")}

    finally:
        # Clean up temp file
        import os as os_module
        try:
            os_module.unlink(tmp_path)
        except Exception:
            pass


# ============== WEBSOCKET ENDPOINT ==============

@app.websocket("/ws/{thread_id}/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    thread_id: str,
    user_id: str
):
    """
    WebSocket endpoint for real-time multi-user chat.

    Multiple users can connect to the same thread_id and all will
    see each other's messages and the bot's responses in real-time.

    Message types sent to clients:
    - user_message: Message from a user
    - bot_chunk: Streaming chunk from bot
    - bot_complete: Bot finished responding
    - user_joined: Someone joined the room
    - user_left: Someone left the room
    - system: System notifications
    - expense_update: New expense registered
    - balance_update: Balances changed
    """
    # Get async graph (already initialized in startup)
    graph = await get_graph()

    # Normalize user_id to avoid case duplicates
    user_id = normalize_name(user_id)

    # Connect to room
    history = await room_manager.connect(thread_id, user_id, websocket)

    # Send history to the new client
    for msg in history:
        await room_manager.send_to_one(websocket, msg)

    # Notify room of new user
    await room_manager.broadcast(thread_id, {
        "type": "user_joined",
        "user_id": user_id,
        "participants": room_manager.get_participants(thread_id),
        "connection_count": room_manager.get_connection_count(thread_id)
    })

    # Add user to graph state participants (persistent)
    config = {"configurable": {"thread_id": thread_id}}
    try:
        state = await graph.aget_state(config)
        participants = list(state.values.get("participants", []))
        if user_id not in participants:
            participants.append(user_id)
            # Update participants AND add system message so LLM knows about new user
            messages = list(state.values.get("messages", []))
            system_msg = SystemMessage(
                content=f"[SISTEMA] {user_id} se ha unido al grupo. "
                f"Los participantes actuales son: {', '.join(participants)}. "
                f"A partir de ahora, incluye a {user_id} en los gastos cuando corresponda."
            )
            messages.append(system_msg)
            await graph.aupdate_state(config, {"participants": participants, "messages": messages})
            print(f"👤 [{thread_id}] New participant {user_id} added. Total: {participants}")
    except Exception as e:
        # If no state exists yet, it will be created on first message
        print(f"Note: Could not update participants for new user {user_id}: {e}")

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                content = message.get("content", "")
                image_data = message.get("image")  # Optional base64 image

                if not content.strip() and not image_data:
                    continue

                # Broadcast user message to all (with image indicator if present)
                broadcast_msg = {
                    "type": "user_message",
                    "user_id": user_id,
                    "content": content
                }
                if image_data:
                    broadcast_msg["has_image"] = True
                    # Optionally include a thumbnail or indicator
                await room_manager.broadcast(thread_id, broadcast_msg)

                # Process with LangGraph
                config = {"configurable": {"thread_id": thread_id}}

                # Indicate bot is typing
                await room_manager.broadcast(thread_id, {
                    "type": "bot_typing",
                    "active": True
                })

                try:
                    print(f"🔄 [{thread_id}] Processing message from {user_id}: {content[:50]}...")

                    # Include user_id in the message so AI knows who is speaking
                    message_with_user = f"[{user_id}]: {content}"

                    # Build session context for AI awareness
                    # Get trip_id from session_code (thread_id)
                    trip_id = None
                    try:
                        from services import get_db
                        trip_id = get_db().get_trip_id_from_session_code(thread_id)
                        if trip_id:
                            print(f"✅ [{thread_id}] Resolved trip_id: {trip_id}")
                        else:
                            print(f"⚠️ [{thread_id}] No trip found for session_code")
                    except Exception as e:
                        print(f"⚠️ [{thread_id}] Error resolving trip_id: {e}")

                    session_context = {
                        "current_user": user_id,
                        "trip_id": trip_id,  # Add trip_id for database persistence
                        "pending_uploads": []  # Will be populated if images are uploaded
                    }

                    # Upload image to Supabase Storage if present
                    if image_data:
                        message_with_user += " [El usuario adjuntó una imagen - analízala para extraer información del gasto/recibo o para registrar un momento del viaje]"
                        try:
                            storage = get_storage()
                            upload_result = await storage.upload(image_data, thread_id)
                            if upload_result.success:
                                session_context["pending_uploads"].append({
                                    "url": upload_result.url,
                                    "path": upload_result.path
                                })
                                print(f"📷 Image uploaded: {upload_result.path}")
                        except Exception as upload_err:
                            print(f"⚠️ Image upload error (continuing without persistence): {upload_err}")

                    # Capture state before processing for action detection
                    try:
                        old_state = await graph.aget_state(config)
                        old_expenses = list(old_state.values.get("expenses", []))
                        old_payments = list(old_state.values.get("payments", []))
                    except Exception:
                        old_expenses = []
                        old_payments = []

                    # Build message content (multimodal if image present)
                    message_content = build_multimodal_content(message_with_user, image_data)

                    # Track tool calls for Chain of Thought
                    tool_calls_made = []

                    # Stream response
                    full_response = ""
                    async for event in graph.astream(
                        {
                            "messages": [{"role": "user", "content": message_content}],
                            "session_context": session_context
                        },
                        config=config,
                        stream_mode="messages"
                    ):
                        if event and len(event) > 0:
                            msg = event[0]

                            # Detect and broadcast tool calls (Chain of Thought)
                            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                                for tool_call in msg.tool_calls:
                                    tool_info = {
                                        "name": tool_call.get("name", "unknown"),
                                        "args": tool_call.get("args", {})
                                    }
                                    tool_calls_made.append(tool_info)
                                    print(f"🔧 [{thread_id}] Tool call: {tool_info['name']}({tool_info['args']})")

                                    # Send Chain of Thought event
                                    await room_manager.broadcast(thread_id, {
                                        "type": "thinking_step",
                                        "step": "tool_call",
                                        "tool_name": tool_info["name"],
                                        "tool_args": tool_info["args"],
                                        "status": "active"
                                    })

                            # Detect tool results
                            if hasattr(msg, 'type') and msg.type == "tool":
                                tool_result = extract_text_content(msg.content) if hasattr(msg, 'content') else ""
                                print(f"✅ [{thread_id}] Tool result: {tool_result[:100]}...")

                                # Send tool result as Chain of Thought
                                await room_manager.broadcast(thread_id, {
                                    "type": "thinking_step",
                                    "step": "tool_result",
                                    "result": tool_result[:200],
                                    "status": "complete"
                                })

                            if hasattr(msg, 'content') and msg.content:
                                # Accept both AIMessage (type="ai") and AIMessageChunk (type="AIMessageChunk")
                                if hasattr(msg, 'type') and msg.type in ("ai", "AIMessageChunk"):
                                    chunk = extract_text_content(msg.content)
                                    # Filter out any JSON tool outputs that might leak
                                    if not is_tool_related_content(chunk):
                                        filtered_chunk = filter_json_from_response(chunk)
                                        if filtered_chunk:
                                            full_response += filtered_chunk
                                            await room_manager.broadcast(thread_id, {
                                                "type": "bot_chunk",
                                                "content": filtered_chunk
                                            })

                    print(f"📝 [{thread_id}] Stream finished. Response length: {len(full_response)}")

                    # Get final state for expense/balance updates
                    final_state = await graph.aget_state(config)
                    new_expenses = final_state.values.get("expenses", [])
                    new_payments = final_state.values.get("payments", [])

                    # Detect what action was performed
                    last_action = detect_action_from_expenses(
                        old_expenses, new_expenses,
                        old_payments, new_payments
                    )

                    # If no streaming happened, get response from state
                    if not full_response:
                        print(f"⚠️ [{thread_id}] No streaming response, extracting from state...")
                        messages = final_state.values.get("messages", [])
                        for msg in reversed(messages):
                            if hasattr(msg, 'type') and msg.type in ("ai", "AIMessageChunk") and hasattr(msg, 'content'):
                                raw_response = extract_text_content(msg.content)
                                full_response = filter_json_from_response(raw_response, strip=True)
                                if full_response:
                                    print(f"📝 [{thread_id}] Extracted response: {full_response[:100]}...")
                                    await room_manager.broadcast(thread_id, {
                                        "type": "bot_chunk",
                                        "content": full_response
                                    })
                                break

                    # Build structured data for rich UI
                    balances = final_state.values.get("balances", {})
                    debts = calculate_debts(balances)
                    milestones = final_state.values.get("milestones", [])
                    photos = final_state.values.get("photos", [])
                    structured_data = {
                        "expenses": new_expenses,
                        "payments": new_payments,
                        "balances": balances,
                        "participants": final_state.values.get("participants", []),
                        "debts": debts,
                        "last_action": last_action,
                        "milestones": milestones,
                        "photos": photos,
                        "tool_calls": tool_calls_made
                    }

                    print(f"✅ [{thread_id}] Sending bot_complete. Expenses: {len(new_expenses)}, Balances: {len(balances)}")

                    # Send completion with structured data
                    await room_manager.broadcast(thread_id, {
                        "type": "bot_complete",
                        "content": full_response or "(El agente procesó la solicitud pero no generó respuesta de texto)",
                        "structured_data": structured_data,
                        # Keep these for backwards compatibility
                        "expenses": new_expenses,
                        "balances": balances,
                        "participants": structured_data["participants"],
                        "debts": debts,
                        "milestones": milestones,
                        "photos": photos,
                        "tool_calls": tool_calls_made
                    })

                except Exception as e:
                    import traceback
                    error_trace = traceback.format_exc()
                    print(f"❌ [{thread_id}] Error: {e}\n{error_trace}")

                    # Still try to get and send current state even on error
                    try:
                        error_state = await graph.aget_state(config)
                        error_balances = error_state.values.get("balances", {})
                        error_expenses = error_state.values.get("expenses", [])
                        error_debts = calculate_debts(error_balances)

                        await room_manager.broadcast(thread_id, {
                            "type": "bot_complete",
                            "content": f"Hubo un error procesando tu mensaje. Los datos actuales se muestran abajo.",
                            "error": True,
                            "error_details": str(e),
                            "expenses": error_expenses,
                            "balances": error_balances,
                            "participants": error_state.values.get("participants", []),
                            "debts": error_debts
                        })
                    except Exception as state_err:
                        print(f"❌ [{thread_id}] Could not get state on error: {state_err}")
                        await room_manager.broadcast(thread_id, {
                            "type": "bot_complete",
                            "content": f"Error procesando mensaje: {str(e)}",
                            "error": True
                        })

                finally:
                    await room_manager.broadcast(thread_id, {
                        "type": "bot_typing",
                        "active": False
                    })

            except json.JSONDecodeError:
                await room_manager.send_to_one(websocket, {
                    "type": "error",
                    "content": "Formato de mensaje inválido"
                })

    except WebSocketDisconnect:
        # Notify room of user leaving
        await room_manager.broadcast(thread_id, {
            "type": "user_left",
            "user_id": user_id,
            "participants": room_manager.get_participants(thread_id),
            "connection_count": room_manager.get_connection_count(thread_id) - 1
        })
        await room_manager.disconnect(thread_id, user_id, websocket)

    except Exception as e:
        print(f"WebSocket error: {e}")
        await room_manager.disconnect(thread_id, user_id, websocket)


# ============== PHOTO/MILESTONE REST API ==============

@app.get("/api/trips/{trip_id}/milestones")
async def get_trip_milestones(trip_id: int):
    """
    Get all milestones for a trip.

    Returns:
        {
            "milestones": [
                {
                    "id": 1,
                    "trip_id": 1,
                    "name": "Sky Costanera",
                    "description": "...",
                    "location": "Santiago",
                    "photo_count": 5,
                    ...
                }
            ]
        }
    """
    from services import get_db

    try:
        db = get_db()
        milestones = await db.get_trip_milestones(trip_id)
        return {"milestones": milestones}
    except Exception as e:
        print(f"Error fetching milestones: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/milestones/{milestone_id}/photos")
async def get_milestone_photos(milestone_id: int):
    """
    Get all photos in a specific milestone.

    Returns:
        {
            "photos": [
                {
                    "id": 1,
                    "milestone_id": 1,
                    "photo_url": "https://...",
                    "description": "Vista increíble...",
                    "tags": ["paisaje", "grupo"],
                    ...
                }
            ]
        }
    """
    from services import get_db

    try:
        db = get_db()
        photos = await db.get_milestone_photos(milestone_id)
        return {"photos": photos}
    except Exception as e:
        print(f"Error fetching milestone photos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trips/{trip_id}/photos")
async def get_trip_photos(trip_id: int):
    """
    Get all photos for a trip (across all milestones).

    Returns:
        {
            "photos": [
                {
                    "id": 1,
                    "trip_id": 1,
                    "milestone_id": 1,
                    "photo_url": "https://...",
                    "description": "...",
                    "tags": [...],
                    "detected_people": [...],
                    ...
                }
            ]
        }
    """
    from services import get_db

    try:
        db = get_db()
        photos = await db.get_trip_photos(trip_id)
        return {"photos": photos}
    except Exception as e:
        print(f"Error fetching trip photos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/trips/{trip_id}/photos")
async def upload_photos(trip_id: int, request: Request):
    """
    Upload one or more photos to a trip.

    Accepts multipart/form-data with:
    - photos: one or more image files
    - milestone_id (optional): milestone to associate photos with
    - description (optional): description for all photos

    Returns:
        {
            "success": true,
            "photos": [...]
        }
    """
    from services import get_db

    # Get trip first
    trip = await session_service.get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Check if user has access to this trip
    user = await get_auth_user(request)
    if user:
        # Allow if user is creator or participant
        is_creator = trip["creator_id"] == user.id
        is_participant = await session_service.is_participant(trip_id, user.id)

        if not is_creator and not is_participant:
            raise HTTPException(status_code=403, detail="Not authorized to upload photos to this trip")

        user_id = user.id
    else:
        # For now, allow anonymous uploads (could add token check later)
        user_id = None

    try:
        form = await request.form()

        # Get optional parameters
        milestone_id = form.get("milestone_id")
        if milestone_id:
            milestone_id = int(milestone_id)

        description = form.get("description")

        # Get all uploaded files (supporting multiple)
        uploaded_photos = []
        photo_files = form.getlist("photos")  # Get list of files

        if not photo_files or len(photo_files) == 0:
            # Fallback to single file field
            single_photo = form.get("photo")
            if single_photo:
                photo_files = [single_photo]

        if not photo_files or len(photo_files) == 0:
            raise HTTPException(status_code=400, detail="No photos provided")

        storage = get_storage()
        db = get_db()

        session_code = trip["session_code"]

        for idx, photo_file in enumerate(photo_files):
            # Read file content
            photo_content = await photo_file.read()

            # Convert to base64
            import base64
            photo_base64 = base64.b64encode(photo_content).decode('utf-8')

            # Detect mime type
            mime_type = photo_file.content_type or "image/jpeg"
            photo_data_url = f"data:{mime_type};base64,{photo_base64}"

            # Upload to storage
            upload_result = await storage.upload(photo_data_url, session_code)

            if not upload_result.success:
                print(f"⚠️ Failed to upload photo {idx + 1}: {upload_result.error}")
                continue

            # Insert into database
            photo_record = await db.insert_photo(
                trip_id=trip_id,
                milestone_id=milestone_id,
                photo_url=upload_result.url,
                storage_path=upload_result.path,
                uploaded_by_user_id=user_id,
                description=description,
                order_index=idx
            )

            if photo_record:
                uploaded_photos.append({
                    "id": photo_record.id,
                    "trip_id": photo_record.trip_id,
                    "milestone_id": photo_record.milestone_id,
                    "photo_url": photo_record.photo_url,
                    "description": photo_record.description,
                    "created_at": photo_record.created_at
                })

        if len(uploaded_photos) == 0:
            raise HTTPException(status_code=500, detail="Failed to upload any photos")

        return {
            "success": True,
            "photos": uploaded_photos,
            "count": len(uploaded_photos)
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error uploading photos: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============== TEST HTML PAGE ==============

@app.get("/test", response_class=HTMLResponse)
async def test_page():
    """Simple HTML page to test the WebSocket chat."""
    return """
<!DOCTYPE html>
<html>
<head>
    <title>Journi - Test</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #DDEFC4;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #FFF7F0;
            border-radius: 24px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        h1 {
            color: #2F2F3A;
            margin-bottom: 20px;
            font-size: 24px;
        }
        .config {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .config input {
            padding: 12px 16px;
            border: 1px solid #ECECF2;
            border-radius: 12px;
            font-size: 14px;
            flex: 1;
            min-width: 150px;
        }
        .config button {
            padding: 12px 24px;
            background: #FF8750;
            color: white;
            border: none;
            border-radius: 999px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s;
        }
        .config button:hover { background: #F5693C; }
        .config button:disabled { background: #B4B4C2; cursor: not-allowed; }
        .status {
            padding: 8px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
        }
        .status.connected { background: #B9E88A; color: #2F2F3A; }
        .status.disconnected { background: #FFE3CC; color: #2F2F3A; }
        #messages {
            height: 400px;
            overflow-y: auto;
            border: 1px solid #ECECF2;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 16px;
            background: white;
        }
        .message {
            margin-bottom: 12px;
            padding: 12px 16px;
            border-radius: 16px;
            max-width: 80%;
            line-height: 1.4;
        }
        .message.user {
            background: #BEE5FF;
            margin-left: auto;
        }
        .message.bot {
            background: #F3E5F5;
            white-space: pre-wrap;
        }
        .message.system {
            background: #FFF3CF;
            text-align: center;
            max-width: 100%;
            font-size: 13px;
            color: #7D7D8A;
        }
        .message .sender {
            font-size: 12px;
            color: #7D7D8A;
            margin-bottom: 4px;
        }
        .input-area {
            display: flex;
            gap: 12px;
        }
        .input-area input {
            flex: 1;
            padding: 16px;
            border: 1px solid #ECECF2;
            border-radius: 999px;
            font-size: 14px;
        }
        .input-area input:focus {
            outline: none;
            border-color: #FF8750;
        }
        .input-area button {
            padding: 16px 32px;
            background: #FF8750;
            color: white;
            border: none;
            border-radius: 999px;
            cursor: pointer;
            font-weight: 500;
        }
        .input-area button:hover { background: #F5693C; }
        .input-area button:disabled { background: #B4B4C2; }
        .sidebar {
            margin-top: 20px;
            padding: 16px;
            background: white;
            border-radius: 16px;
            border: 1px solid #ECECF2;
        }
        .sidebar h3 {
            font-size: 14px;
            color: #7D7D8A;
            margin-bottom: 12px;
        }
        .participants { font-size: 14px; }
        .balances { font-size: 14px; margin-top: 12px; }
        .expense { font-size: 13px; padding: 8px; background: #F9F9F9; border-radius: 8px; margin-top: 4px; }
        /* Participant bubbles */
        .participant-bubbles {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }
        .participant-bubble {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        .participant-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 16px;
            position: relative;
        }
        .participant-avatar.offline {
            opacity: 0.5;
        }
        .online-indicator {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 12px;
            height: 12px;
            background: #6EBF4E;
            border-radius: 50%;
            border: 2px solid white;
        }
        .participant-name {
            font-size: 11px;
            color: #7D7D8A;
            max-width: 50px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        /* Disconnection messages */
        .message.disconnect {
            background: transparent;
            text-align: center;
            max-width: 100%;
            font-size: 12px;
            color: #B4B4C2;
            padding: 4px 12px;
        }
        /* Media buttons */
        .media-btn {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 1px solid #ECECF2;
            background: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .media-btn:hover { background: #F9F9F9; border-color: #FF8750; }
        .media-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .media-btn.recording {
            background: #FFE3CC;
            border-color: #FF8750;
            animation: pulse 1s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .media-btn svg { width: 20px; height: 20px; color: #7D7D8A; }
        .media-btn:hover svg { color: #FF8750; }
        .media-btn.recording svg { color: #FF8750; }
        /* Image preview */
        .image-preview {
            display: none;
            margin-bottom: 12px;
            padding: 8px;
            background: #F9F9F9;
            border-radius: 12px;
            position: relative;
        }
        .image-preview.active { display: flex; align-items: center; gap: 12px; }
        .image-preview img {
            max-width: 80px;
            max-height: 80px;
            border-radius: 8px;
            object-fit: cover;
        }
        .image-preview .remove-btn {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #F5693C;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 14px;
        }
        .image-preview .file-name {
            font-size: 13px;
            color: #7D7D8A;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        /* Recording indicator */
        .recording-indicator {
            display: none;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: #FFE3CC;
            border-radius: 20px;
            font-size: 13px;
            color: #F5693C;
        }
        .recording-indicator.active { display: flex; }
        .recording-indicator .dot {
            width: 8px;
            height: 8px;
            background: #F5693C;
            border-radius: 50%;
            animation: blink 1s infinite;
        }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        /* Chain of Thought styles */
        .thinking-container {
            margin-bottom: 12px;
            padding: 12px;
            background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
            border-radius: 12px;
            border: 1px solid #ddd6fe;
            font-size: 13px;
        }
        .thinking-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            user-select: none;
            color: #6b21a8;
            font-weight: 500;
        }
        .thinking-header:hover { color: #9333ea; }
        .thinking-toggle {
            transition: transform 0.2s;
        }
        .thinking-toggle.open { transform: rotate(90deg); }
        .thinking-steps {
            margin-top: 8px;
            padding-left: 16px;
            border-left: 2px solid #c4b5fd;
            display: none;
        }
        .thinking-steps.open { display: block; }
        .thinking-step {
            padding: 8px 0;
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }
        .thinking-step-icon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            flex-shrink: 0;
        }
        .thinking-step-icon.tool { background: #fef3c7; }
        .thinking-step-icon.result { background: #d1fae5; }
        .thinking-step-icon.active {
            background: #ddd6fe;
            animation: pulse 1s infinite;
        }
        .thinking-step-content {
            flex: 1;
            min-width: 0;
            display: inline;
        }
        .thinking-step-label {
            font-weight: 500;
            color: #374151;
        }
        .thinking-step-result {
            font-size: 12px;
            color: #6b7280;
            margin-left: 6px;
        }
        .thinking-step-result::before {
            content: "— ";
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Journi Test</h1>

        <div class="config">
            <input type="text" id="threadId" placeholder="Session ID" value="test-session">
            <input type="text" id="userId" placeholder="Your name" value="">
            <button id="connectBtn" onclick="connect()">Connect</button>
            <button id="disconnectBtn" onclick="disconnect()" disabled>Disconnect</button>
        </div>

        <div id="status" class="status disconnected">Disconnected</div>

        <div id="participantBubbles" class="participant-bubbles"></div>

        <div id="messages"></div>

        <!-- Image preview -->
        <div id="imagePreview" class="image-preview">
            <img id="previewImg" src="" alt="Preview">
            <span class="file-name" id="fileName"></span>
            <button class="remove-btn" onclick="removeImage()">×</button>
        </div>

        <!-- Recording indicator -->
        <div id="recordingIndicator" class="recording-indicator">
            <span class="dot"></span>
            <span id="recordingTime">Grabando... 0:00</span>
        </div>

        <div class="input-area">
            <!-- Hidden file input -->
            <input type="file" id="imageInput" accept="image/*" style="display:none" onchange="handleImageSelect(event)">

            <!-- Image button -->
            <button class="media-btn" id="imageBtn" onclick="document.getElementById('imageInput').click()" disabled title="Adjuntar imagen">
                📎
            </button>

            <!-- Audio button -->
            <button class="media-btn" id="audioBtn" onclick="toggleRecording()" disabled title="Grabar audio">
                🎤
            </button>

            <input type="text" id="messageInput" placeholder="Escribe un mensaje... (ej: Pagué 50 por el taxi)"
                   onkeypress="if(event.key==='Enter')sendMessage()" disabled>
            <button onclick="sendMessage()" id="sendBtn" disabled>Enviar</button>
        </div>

        <div class="sidebar">
            <h3>Participantes</h3>
            <div id="participants" class="participants">-</div>

            <h3 style="margin-top:16px">Balances</h3>
            <div id="balances" class="balances">-</div>

            <h3 style="margin-top:16px">Gastos</h3>
            <div id="expenses" class="expenses">-</div>

            <h3 style="margin-top:16px">Resumen de Deudas</h3>
            <div id="debts" class="debts">-</div>
        </div>
    </div>

    <script>
        let ws = null;
        let streamingContent = '';
        let onlineUsers = new Set();  // Track who's online
        let allParticipants = new Set();  // Track all trip participants

        function connect() {
            const threadId = document.getElementById('threadId').value || 'test-session';
            let userId = document.getElementById('userId').value;
            if (!userId) {
                userId = 'user_' + Math.random().toString(36).slice(2, 6);
                document.getElementById('userId').value = userId;
            }

            ws = new WebSocket(`ws://${location.host}/ws/${threadId}/${userId}`);

            ws.onopen = () => {
                document.getElementById('status').textContent = `Connected to ${threadId} as ${userId}`;
                document.getElementById('status').className = 'status connected';
                document.getElementById('connectBtn').disabled = true;
                document.getElementById('disconnectBtn').disabled = false;
                document.getElementById('messageInput').disabled = false;
                document.getElementById('sendBtn').disabled = false;
                document.getElementById('imageBtn').disabled = false;
                document.getElementById('audioBtn').disabled = false;
                // Add self to tracking
                onlineUsers.add(userId);
                allParticipants.add(userId);
                updateParticipantBubbles();
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleMessage(data);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                addMessage('system', 'Error de conexión');
            };

            ws.onclose = () => {
                document.getElementById('status').textContent = 'Disconnected';
                document.getElementById('status').className = 'status disconnected';
                document.getElementById('connectBtn').disabled = false;
                document.getElementById('disconnectBtn').disabled = true;
                document.getElementById('messageInput').disabled = true;
                document.getElementById('sendBtn').disabled = true;
                document.getElementById('imageBtn').disabled = true;
                document.getElementById('audioBtn').disabled = true;
            };
        }

        function disconnect() {
            if (ws) {
                ws.close();
                ws = null;
            }
            onlineUsers.clear();
            allParticipants.clear();
            updateParticipantBubbles();
        }

        let selectedImage = null;  // Store selected image base64

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const content = input.value.trim();
            if ((!content && !selectedImage) || !ws) return;

            const message = { content: content || '(imagen adjunta)' };
            if (selectedImage) {
                message.image = selectedImage;
            }

            ws.send(JSON.stringify(message));
            input.value = '';
            removeImage();  // Clear image after sending
        }

        // ============== IMAGE HANDLING ==============
        function handleImageSelect(event) {
            const file = event.target.files[0];
            if (!file) return;

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen es muy grande. Máximo 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                selectedImage = e.target.result;  // base64 with data: prefix
                document.getElementById('previewImg').src = selectedImage;
                document.getElementById('fileName').textContent = file.name;
                document.getElementById('imagePreview').classList.add('active');
            };
            reader.readAsDataURL(file);
        }

        function removeImage() {
            selectedImage = null;
            document.getElementById('imagePreview').classList.remove('active');
            document.getElementById('imageInput').value = '';
        }

        // ============== AUDIO RECORDING ==============
        let mediaRecorder = null;
        let audioChunks = [];
        let recordingStartTime = null;
        let recordingTimer = null;

        async function toggleRecording() {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                stopRecording();
            } else {
                startRecording();
            }
        }

        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    stream.getTracks().forEach(track => track.stop());
                    await transcribeAudio(audioBlob);
                };

                mediaRecorder.start();
                recordingStartTime = Date.now();

                // Update UI
                document.getElementById('audioBtn').classList.add('recording');
                document.getElementById('recordingIndicator').classList.add('active');

                // Start timer
                recordingTimer = setInterval(updateRecordingTime, 1000);

            } catch (err) {
                console.error('Error accessing microphone:', err);
                alert('No se pudo acceder al micrófono. Asegúrate de dar permiso.');
            }
        }

        function stopRecording() {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
            clearInterval(recordingTimer);
            document.getElementById('audioBtn').classList.remove('recording');
            document.getElementById('recordingIndicator').classList.remove('active');
        }

        function updateRecordingTime() {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            document.getElementById('recordingTime').textContent = `Grabando... ${mins}:${secs.toString().padStart(2, '0')}`;
        }

        async function transcribeAudio(audioBlob) {
            try {
                document.getElementById('recordingIndicator').classList.add('active');
                document.getElementById('recordingTime').textContent = 'Transcribiendo...';

                const formData = new FormData();
                formData.append('audio', audioBlob, 'audio.webm');

                const response = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Transcription failed');

                const data = await response.json();
                if (data.text) {
                    // Put transcribed text in input
                    document.getElementById('messageInput').value = data.text;
                    document.getElementById('messageInput').focus();
                }
            } catch (err) {
                console.error('Transcription error:', err);
                alert('Error al transcribir el audio');
            } finally {
                document.getElementById('recordingIndicator').classList.remove('active');
            }
        }

        // Chain of Thought state
        let thinkingSteps = [];

        function handleMessage(data) {
            switch (data.type) {
                case 'user_message':
                    addMessage('user', data.content, data.user_id);
                    // Clear thinking steps for new conversation turn
                    thinkingSteps = [];
                    break;
                case 'thinking_step':
                    addThinkingStep(data);
                    break;
                case 'bot_chunk':
                    streamingContent += data.content;
                    updateStreamingMessage(streamingContent);
                    break;
                case 'bot_complete':
                    // Finalize thinking container before the response
                    finalizeThinkingContainer();
                    finalizeStreamingMessage(data.content);
                    streamingContent = '';
                    if (data.participants) {
                        data.participants.forEach(p => allParticipants.add(p));
                        updateParticipants(data.participants);
                        updateParticipantBubbles();
                    }
                    if (data.balances) updateBalances(data.balances);
                    if (data.expenses) updateExpenses(data.expenses);
                    if (data.debts) updateDebts(data.debts);
                    break;
                case 'user_joined':
                    addMessage('system', `${data.user_id} se unió`);
                    onlineUsers.add(data.user_id);
                    allParticipants.add(data.user_id);
                    if (data.participants) {
                        data.participants.forEach(p => onlineUsers.add(p));
                        updateParticipants(data.participants);
                    }
                    updateParticipantBubbles();
                    break;
                case 'user_left':
                    addMessage('disconnect', `${data.user_id} se desconectó`);
                    onlineUsers.delete(data.user_id);
                    // Keep in allParticipants - they're still in the trip
                    if (data.participants) updateParticipants(data.participants);
                    updateParticipantBubbles();
                    break;
                case 'bot_typing':
                    // Could show typing indicator
                    break;
            }
        }

        // ============== CHAIN OF THOUGHT ==============
        function addThinkingStep(data) {
            thinkingSteps.push(data);

            const messages = document.getElementById('messages');
            let container = document.getElementById('thinking-container');

            // Create container if it doesn't exist
            if (!container) {
                container = document.createElement('div');
                container.id = 'thinking-container';
                container.className = 'thinking-container';
                container.innerHTML = `
                    <div class="thinking-header" onclick="toggleThinking()">
                        <span class="thinking-toggle" id="thinking-toggle">▶</span>
                        <span>🧠 Pensando...</span>
                    </div>
                    <div class="thinking-steps" id="thinking-steps"></div>
                `;
                messages.appendChild(container);
            }

            // Add step to list
            const stepsContainer = document.getElementById('thinking-steps');
            const stepEl = document.createElement('div');
            stepEl.className = 'thinking-step';

            if (data.step === 'tool_call') {
                const toolName = formatToolName(data.tool_name);
                stepEl.innerHTML = `
                    <div class="thinking-step-icon tool active">🔧</div>
                    <div class="thinking-step-content">
                        <span class="thinking-step-label">${toolName}</span>
                    </div>
                `;
                stepsContainer.appendChild(stepEl);
            } else if (data.step === 'tool_result') {
                // Update the last tool call step to show completed with result
                const allSteps = stepsContainer.querySelectorAll('.thinking-step');
                const lastStep = allSteps[allSteps.length - 1];
                if (lastStep) {
                    const icon = lastStep.querySelector('.thinking-step-icon');
                    if (icon) {
                        icon.classList.remove('active');
                        icon.textContent = '✅';
                    }
                    const content = lastStep.querySelector('.thinking-step-content');
                    if (content) {
                        content.innerHTML += `<span class="thinking-step-result">${escapeHtml(data.result)}</span>`;
                    }
                }
                return; // Don't add new element
            }
            messages.scrollTop = messages.scrollHeight;
        }

        function finalizeThinkingContainer() {
            const container = document.getElementById('thinking-container');
            if (container && thinkingSteps.length > 0) {
                const header = container.querySelector('.thinking-header span:nth-child(2)');
                if (header) {
                    header.textContent = '🧠 Razonamiento completado';
                }
                // Remove active animations
                container.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
            }
            // Remove the temp ID so next message creates a new container
            if (container) {
                container.removeAttribute('id');
            }
        }

        function toggleThinking() {
            const toggle = document.getElementById('thinking-toggle');
            const steps = document.getElementById('thinking-steps');
            if (toggle && steps) {
                toggle.classList.toggle('open');
                steps.classList.toggle('open');
            }
        }

        function formatToolName(name) {
            const names = {
                'register_expense': '📝 Registrar gasto',
                'edit_expense': '✏️ Editar gasto',
                'delete_expense': '🗑️ Eliminar gasto',
                'get_balance': '💰 Consultar balance',
                'get_debts': '📊 Calcular deudas',
                'list_expenses': '📋 Listar gastos',
                'register_payment': '💸 Registrar pago',
                'create_milestone': '📍 Crear momento',
                'register_photo': '📸 Registrar foto'
            };
            return names[name] || name;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function addMessage(type, content, sender = null) {
            const messages = document.getElementById('messages');
            const div = document.createElement('div');
            div.className = `message ${type}`;

            if (sender) {
                div.innerHTML = `<div class="sender">${sender}</div>${content}`;
            } else {
                div.textContent = content;
            }

            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }

        function updateStreamingMessage(content) {
            const messages = document.getElementById('messages');
            let streamDiv = document.getElementById('streaming-msg');

            if (!streamDiv) {
                streamDiv = document.createElement('div');
                streamDiv.id = 'streaming-msg';
                streamDiv.className = 'message bot';
                streamDiv.innerHTML = '<div class="sender">Journi</div><span class="content"></span>';
                messages.appendChild(streamDiv);
            }

            streamDiv.querySelector('.content').textContent = content;
            messages.scrollTop = messages.scrollHeight;
        }

        function finalizeStreamingMessage(content) {
            const streamDiv = document.getElementById('streaming-msg');
            if (streamDiv) {
                streamDiv.querySelector('.content').textContent = content;
                streamDiv.removeAttribute('id');
            } else {
                addMessage('bot', content, 'Journi');
            }
        }

        function updateParticipantBubbles() {
            const container = document.getElementById('participantBubbles');
            const colors = ['#FF8750', '#6EBF4E', '#BEE5FF', '#F3E5F5', '#FFE3CC', '#B9E88A'];
            const getColor = (name) => colors[name.charCodeAt(0) % colors.length];
            const getInitial = (name) => name.charAt(0).toUpperCase();

            // Combine all participants
            const participants = Array.from(allParticipants);
            if (participants.length === 0) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = participants.map(name => {
                const isOnline = onlineUsers.has(name);
                return `
                    <div class="participant-bubble">
                        <div class="participant-avatar ${isOnline ? '' : 'offline'}" style="background: ${getColor(name)}">
                            ${getInitial(name)}
                            ${isOnline ? '<div class="online-indicator"></div>' : ''}
                        </div>
                        <span class="participant-name">${name}</span>
                    </div>
                `;
            }).join('');
        }

        function updateParticipants(participants) {
            document.getElementById('participants').textContent =
                participants.length ? participants.join(', ') : '-';
        }

        function updateBalances(balances) {
            const el = document.getElementById('balances');
            if (Object.keys(balances).length === 0) {
                el.textContent = '-';
                return;
            }
            // Handle multi-currency format: {person: {currency: amount}}
            el.innerHTML = Object.entries(balances)
                .map(([name, personBals]) => {
                    // personBals is now {currency: amount}
                    if (typeof personBals === 'object') {
                        const balanceStrs = Object.entries(personBals)
                            .filter(([_, amt]) => Math.abs(amt) > 0.01)
                            .map(([curr, amt]) => {
                                const sign = amt >= 0 ? '+' : '';
                                const color = amt >= 0 ? '#6EBF4E' : '#F5693C';
                                return `<span style="color:${color}">${sign}${amt.toFixed(2)} ${curr}</span>`;
                            });
                        return balanceStrs.length ? `<div>${name}: ${balanceStrs.join(', ')}</div>` : null;
                    }
                    // Legacy format fallback
                    const sign = personBals >= 0 ? '+' : '';
                    const color = personBals >= 0 ? '#6EBF4E' : '#F5693C';
                    return `<div style="color:${color}">${name}: ${sign}S/${personBals.toFixed(2)}</div>`;
                }).filter(Boolean).join('');
            if (!el.innerHTML) el.textContent = '-';
        }

        function updateExpenses(expenses) {
            const el = document.getElementById('expenses');
            if (expenses.length === 0) {
                el.textContent = '-';
                return;
            }
            el.innerHTML = expenses.map(exp => {
                const currency = exp.currency || 'PEN';
                return `<div class="expense">${exp.amount.toFixed(2)} ${currency} - ${exp.description} (${exp.paid_by})</div>`;
            }).join('');
        }

        function updateDebts(debts) {
            const el = document.getElementById('debts');
            // Handle new format: {currency: [debts]} or old format: [debts]
            let allDebts = [];
            if (debts && typeof debts === 'object' && !Array.isArray(debts)) {
                // New multi-currency format: {currency: [debts]}
                for (const [currency, debtList] of Object.entries(debts)) {
                    if (Array.isArray(debtList)) {
                        debtList.forEach(d => allDebts.push({...d, currency: d.currency || currency}));
                    }
                }
            } else if (Array.isArray(debts)) {
                // Old format: [debts]
                allDebts = debts;
            }

            if (allDebts.length === 0) {
                el.innerHTML = '<div style="color:#6EBF4E;text-align:center;">¡Están a mano!</div>';
                return;
            }

            // Color palette for avatars
            const colors = ['#FF8750', '#6EBF4E', '#BEE5FF', '#F3E5F5', '#FFE3CC', '#B9E88A'];
            const getColor = (name) => colors[name.charCodeAt(0) % colors.length];
            const getInitial = (name) => name.charAt(0).toUpperCase();

            el.innerHTML = allDebts.map(debt => {
                const currency = debt.currency || 'PEN';
                return `
                <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#F9F9F9;border-radius:12px;margin-bottom:8px;">
                    <div style="width:32px;height:32px;border-radius:50%;background:${getColor(debt.from)};display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:14px;">
                        ${getInitial(debt.from)}
                    </div>
                    <span style="font-size:13px;">${debt.from}</span>
                    <span style="color:#7D7D8A;">→</span>
                    <div style="width:32px;height:32px;border-radius:50%;background:${getColor(debt.to)};display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:14px;">
                        ${getInitial(debt.to)}
                    </div>
                    <span style="font-size:13px;">${debt.to}</span>
                    <span style="margin-left:auto;background:#FF8750;color:white;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:500;">
                        ${debt.amount.toFixed(2)} ${currency}
                    </span>
                </div>
            `}).join('');
        }

        // Generate random user ID on load
        document.getElementById('userId').value = 'user_' + Math.random().toString(36).slice(2, 6);
    </script>
</body>
</html>
    """


# ============== MAIN ==============

if __name__ == "__main__":
    import uvicorn

    print("Starting Journi Backend...")
    print("Test page: http://localhost:8000/test")
    print("WebSocket: ws://localhost:8000/ws/{thread_id}/{user_id}")
    print("HTTP Chat: POST http://localhost:8000/api/chat")

    uvicorn.run(app, host="0.0.0.0", port=8000)
