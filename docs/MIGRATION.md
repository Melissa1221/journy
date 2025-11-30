# Journi - Migration & Implementation Guide

**Migrated from:** ChanchitaAI PoC
**Date:** November 29, 2025
**Status:** Backend migrated, frontend integration pending

---

## 1. What We Built

**Journi** is a real-time group expense tracking and travel diary app with an AI chatbot that understands natural language.

### Core Features (Implemented)

| Feature | Status | Description |
|---------|--------|-------------|
| Multi-user WebSocket chat | ✅ Done | Multiple users connect to same session, all see messages in real-time |
| LangGraph AI Agent | ✅ Done | 12 tools for expense/photo management |
| AsyncPostgresSaver | ✅ Done | Persistent state across server restarts |
| Supabase Storage | ✅ Done | Photo uploads for trip memories |
| Multimodal support | ✅ Done | GPT-4o vision for receipts/photos |
| LLM Fallback Chain | ✅ Done | GPT-4o → gpt-4o-mini → Claude → Gemini |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE                                 │
│                                                                      │
│   ┌──────────────┐                                                  │
│   │  Usuario A   │──┐                                               │
│   └──────────────┘  │     ┌─────────────────┐     ┌──────────────┐  │
│   ┌──────────────┐  │     │   WebSocket     │     │  LangGraph   │  │
│   │  Usuario B   │──┼────▶│   Server        │────▶│  Agent       │  │
│   └──────────────┘  │     │   (FastAPI)     │     │  (12 tools)  │  │
│   ┌──────────────┐  │     │                 │     └──────┬───────┘  │
│   │  Usuario C   │──┘     └────────┬────────┘            │          │
│   └──────────────┘                 │                     │          │
│                                    │                     ▼          │
│         Todos ven los              │          ┌──────────────────┐  │
│         mismos mensajes            │          │ AsyncPostgres    │  │
│         en tiempo real             │          │ Saver            │  │
│                           ┌────────┴────────┐ │ (LangGraph state)│  │
│                           │  Room Manager   │ └────────┬─────────┘  │
│                           │  (Broadcast)    │          │            │
│                           └─────────────────┘          ▼            │
│                                             ┌──────────────────────┐│
│                                             │   Supabase           ││
│                                             │   - PostgreSQL       ││
│                                             │   - Storage (photos) ││
│                                             └──────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Structure

```
journy/
├── src/                    # Next.js Frontend (existing)
├── backend/
│   ├── main.py             # FastAPI server (~1800 lines)
│   │                       # - WebSocket endpoint /ws/{thread_id}/{user_id}
│   │                       # - HTTP endpoint POST /api/chat (Vercel AI SDK compatible)
│   │                       # - GET /api/sessions/{thread_id}
│   │                       # - Browser test UI at /test
│   │
│   ├── graph.py            # LangGraph agent (~1400 lines)
│   │                       # - JourniState (messages, expenses, balances, milestones, photos)
│   │                       # - 12 tools bound to LLM
│   │                       # - Model fallback chain
│   │
│   ├── room_manager.py     # WebSocket room management (~120 lines)
│   │                       # - Per-room connection tracking
│   │                       # - Broadcast to all users in room
│   │                       # - Message history for new joiners
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── supabase_storage.py  # Photo upload to Supabase Storage
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_graph.py   # Agent tests
│   │
│   ├── requirements.txt    # Python dependencies
│   ├── pytest.ini          # Test config
│   ├── railway.json        # Railway deployment config
│   └── .env.example        # Environment variables template
└── .gitignore              # Updated for Python
```

---

## 4. LangGraph Agent Tools

### Expense Tools (7)

| Tool | Description |
|------|-------------|
| `register_expense` | Register new expense with amount, description, payer, split |
| `edit_expense` | Modify existing expense |
| `delete_expense` | Remove an expense |
| `register_payment` | Record a payment between participants |
| `get_balance` | Get balance for one or all participants |
| `get_debts` | Calculate optimized debt settlements |
| `list_expenses` | List all expenses in session |

### Photo/Milestone Tools (5)

| Tool | Description |
|------|-------------|
| `create_milestone` | Create a trip milestone (e.g., "Day 1 - Arrival") |
| `register_photo` | Register a photo to a milestone |
| `list_milestones` | List all milestones |
| `list_photos` | List photos in a milestone |
| `view_photos` | View photo details |

---

## 5. State Model (JourniState)

```python
class JourniState(TypedDict):
    messages: Annotated[list, add_messages]  # Chat history
    expenses: list          # [{id, amount, description, paid_by, split_among, date}]
    payments: list          # [{id, from, to, amount, date}]
    participants: list      # ["Juan", "María", "Pedro"]
    balances: dict          # {"Juan": 25.0, "María": -25.0}
    session_name: str       # "Viaje Cusco 2025"
    milestones: list        # [{id, name, date, description}]
    photos: list            # [{id, milestone_id, url, caption}]
```

State is persisted to PostgreSQL via `AsyncPostgresSaver` and isolated per `thread_id`.

---

## 6. API Endpoints

### WebSocket: `/ws/{thread_id}/{user_id}`

Real-time multi-user chat with image support.

**Send message:**
```json
{"content": "Pagué 50 por el taxi"}
```

**With image:**
```json
{
  "content": "Este es el recibo",
  "image": "data:image/jpeg;base64,..."
}
```

**Receive messages:**
```json
{"type": "user_message", "user_id": "juan", "content": "...", "timestamp": "..."}
{"type": "bot_chunk", "content": "..."}
{"type": "bot_complete", "content": "...", "expenses": [...], "balances": {...}}
{"type": "user_joined", "user_id": "...", "participants": [...]}
{"type": "user_left", "user_id": "...", "participants": [...]}
```

### HTTP: `POST /api/chat`

Vercel AI SDK compatible with Data Stream Protocol (SSE).

```json
{
  "messages": [{"role": "user", "content": "Pagué 50 por el taxi"}],
  "id": "session-123"
}
```

### GET: `/api/sessions/{thread_id}`

Get session state.

```json
{
  "thread_id": "session-123",
  "participants": ["Juan", "María"],
  "expenses": [...],
  "balances": {"Juan": 25.0, "María": -25.0},
  "message_count": 10
}
```

---

## 7. Environment Variables

### Backend (.env)

```bash
# LLM APIs (at least one required)
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (required for persistence)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_DB_URL=postgresql://postgres.xxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# LangSmith (optional - for tracing)
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=journi
```

### Frontend (Vercel)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://journy-backend.up.railway.app
```

---

## 8. Development Commands

```bash
# Setup
cd backend
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
cp .env.example .env  # Edit with your keys

# Run server
python main.py  # http://localhost:8000

# With auto-reload
uv run uvicorn main:app --reload --port 8000

# Run tests
pytest -v

# Test UI
# Open http://localhost:8000/test in multiple browser windows
```

---

## 9. Debt Calculation Algorithm

Optimized to minimize number of transactions:

```python
def calculate_debts(balances):
    debtors = [(p, -b) for p, b in balances.items() if b < 0]
    creditors = [(p, b) for p, b in balances.items() if b > 0]

    transactions = []
    while debtors and creditors:
        debtor, debt = debtors[0]
        creditor, credit = creditors[0]
        amount = min(debt, credit)

        transactions.append({
            'from': debtor,
            'to': creditor,
            'amount': amount
        })

        if debt == amount:
            debtors.pop(0)
        else:
            debtors[0] = (debtor, debt - amount)
        if credit == amount:
            creditors.pop(0)
        else:
            creditors[0] = (creditor, credit - amount)

    return transactions
```

---

## 10. NLP Capabilities

The bot understands natural language in Spanish:

| Message | Action |
|---------|--------|
| "Pagué 50 por el taxi" | Register expense of 50 by current user |
| "Juan pagó 100 del almuerzo" | Register expense paid by Juan |
| "María pagó 200 del hotel, dividir entre Juan y Pedro" | Expense with specific split |
| "¿Cuánto debo?" | Show user's balance |
| "¿Quién debe a quién?" | Calculate optimized debts |
| "Le pagué 30 a Pedro" | Register payment |
| "Edita el gasto del taxi a 60" | Edit existing expense |
| "Borra el último gasto" | Delete expense |

---

## 11. What's Left To Do

### Immediate (Frontend Integration)

- [ ] **Connect frontend to backend WebSocket** - Replace mock data with real API
- [ ] **Configure CORS** - Update `main.py` with Vercel production domain
- [ ] **Add NEXT_PUBLIC_API_URL** - Point frontend to Railway backend

### Railway Deployment

- [ ] **Create Railway project** - Link to journy repo, select `/backend` directory
- [ ] **Add environment variables** - All from `.env.example`
- [ ] **Deploy** - Should auto-deploy on push

### Production Hardening

- [ ] **Rate limiting** - Prevent abuse
- [ ] **Input validation** - Sanitize user messages
- [ ] **Error monitoring** - Sentry or similar
- [ ] **Logging** - Structured logs for debugging

### Frontend Features (Not Started)

- [ ] **Create/Join Session UI** - Currently only mock
- [ ] **Chat component** - Connect to WebSocket
- [ ] **Expense list** - Real-time updates from state
- [ ] **Balance summary** - Show who owes whom
- [ ] **Photo gallery** - Display trip photos by milestone
- [ ] **Session summary** - Final debt calculation view

---

## 12. Key Technical Concepts

### Thread ID

Each session has a unique `thread_id`. All state (messages, expenses, balances) is isolated per thread. Multiple users connect to the same thread to share the session.

### Checkpointer

`AsyncPostgresSaver` persists LangGraph state to PostgreSQL. State survives server restarts. Each `invoke()` or `astream()` call with a `thread_id` loads previous state automatically.

### Room Manager

Manages WebSocket connections per room (`thread_id`). When any user sends a message, it's broadcast to all connected users. Maintains message history so new joiners see previous messages.

### Model Fallback

If primary model fails (rate limit, error), automatically tries next:
1. GPT-4o (primary - best for vision)
2. gpt-4o-mini (fast, cheap)
3. Claude via OpenRouter
4. Gemini Flash (last resort)

---

## 13. Database Schema (Supabase)

The LangGraph checkpointer creates its own tables automatically. For app-level data:

```sql
-- Users (registered only)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Participants
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  guest_name TEXT,
  joined_at TIMESTAMP DEFAULT NOW()
);
```

---

## 14. Useful Resources

- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [FastAPI WebSocket](https://fastapi.tiangolo.com/advanced/websockets/)
- [Vercel AI SDK](https://ai-sdk.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Railway Docs](https://docs.railway.app/)

---

*Migrated from ChanchitaAI PoC - November 2025*
