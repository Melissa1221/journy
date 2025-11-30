# Journi Backend

Real-time AI-powered group expense tracking backend built with FastAPI and LangGraph.

## Features

- **Multi-user WebSocket Chat** - Multiple users connect to same session, all see messages instantly
- **AI Agent with 12 Tools** - Expense tracking, payments, photos, milestones
- **Natural Language Processing** - "Pagué 50 por el taxi" → expense registered
- **Persistent State** - PostgreSQL via AsyncPostgresSaver
- **Photo Uploads** - Supabase Storage for trip memories
- **Multimodal** - GPT-4o vision for receipt scanning
- **Model Fallback** - GPT-4o → gpt-4o-mini → Claude → Gemini

## Quick Start

```bash
# Create virtual environment
uv venv
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run server
python main.py
# Server starts at http://localhost:8000
```

## Test It

Open http://localhost:8000/test in multiple browser windows to simulate multi-user chat.

## API Endpoints

### WebSocket: `/ws/{thread_id}/{user_id}`

Real-time chat connection.

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/viaje-cusco/juan');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle: user_message, bot_chunk, bot_complete, user_joined, user_left
};

ws.send(JSON.stringify({ content: "Pagué 50 por el taxi" }));
```

### HTTP: `POST /api/chat`

Vercel AI SDK compatible endpoint.

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hola"}], "id": "session-1"}'
```

### GET: `/api/sessions/{thread_id}`

Get session state (expenses, balances, participants).

## Project Structure

```
backend/
├── main.py             # FastAPI server, WebSocket, HTTP endpoints
├── graph.py            # LangGraph agent, 12 tools, state management
├── room_manager.py     # WebSocket room broadcasting
├── services/
│   └── supabase_storage.py  # Photo uploads
├── tests/
│   └── test_graph.py   # Agent tests
├── requirements.txt
├── pytest.ini
├── railway.json        # Railway deployment config
└── .env.example
```

## Environment Variables

```bash
# LLM APIs (at least one required)
OPENAI_API_KEY=
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_DB_URL=postgresql://...

# Optional
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=journi
```

## AI Agent Tools

### Expense Management
| Tool | Description |
|------|-------------|
| `register_expense` | Add new expense |
| `edit_expense` | Modify existing expense |
| `delete_expense` | Remove expense |
| `register_payment` | Record payment between users |
| `get_balance` | Check who owes what |
| `get_debts` | Calculate optimized settlements |
| `list_expenses` | View all expenses |

### Trip Photos
| Tool | Description |
|------|-------------|
| `create_milestone` | Create trip milestone |
| `register_photo` | Add photo to milestone |
| `list_milestones` | View milestones |
| `list_photos` | View photos |
| `view_photos` | Photo details |

## Example Messages

```
"Pagué 50 por el taxi"              → Register 50 expense by current user
"Juan pagó 100 del almuerzo"        → Register expense by Juan
"¿Cuánto debo?"                     → Show user's balance
"¿Quién debe a quién?"              → Calculate debts
"Le pagué 30 a Pedro"               → Record payment
"Edita el gasto del taxi a 60"      → Modify expense
```

## Deployment (Railway)

1. Create new project in Railway
2. Connect to this repo, select `/backend` directory
3. Add environment variables from `.env.example`
4. Deploy

The `railway.json` configures:
- Build: Nixpacks
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Healthcheck: `/`

## Development

```bash
# Run with auto-reload
uv run uvicorn main:app --reload --port 8000

# Run tests
pytest -v

# Specific test
pytest tests/test_graph.py::test_name -v
```

## Architecture

```
Users ──► WebSocket ──► Room Manager ──► Broadcast to all
                             │
                             ▼
                      LangGraph Agent
                             │
                    ┌────────┴────────┐
                    │  12 AI Tools    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        PostgreSQL     Supabase       LLM APIs
        (State)        Storage        (GPT/Claude)
```

## License

Private - Journi Team
