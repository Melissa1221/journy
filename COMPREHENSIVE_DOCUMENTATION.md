# JOURNI - Comprehensive Project Documentation

**Version:** 1.0
**Last Updated:** November 29, 2024
**Project Type:** Full-stack AI-powered Group Travel Expense Tracking Platform

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Features & Functionality](#features--functionality)
5. [Project Structure](#project-structure)
6. [Frontend Documentation](#frontend-documentation)
7. [Backend Documentation](#backend-documentation)
8. [Database Schema](#database-schema)
9. [Pages & Routes](#pages--routes)
10. [Components Library](#components-library)
11. [AI Features](#ai-features)
12. [Integration & APIs](#integration--apis)
13. [Design System](#design-system)
14. [Deployment](#deployment)

---

## Project Overview

### What is Journi?

**Journi** is an AI-powered group travel expense tracking and memory management platform designed to eliminate the common pain points of group travel:

- **No more Excel hell** - Automatic expense tracking with natural language
- **No more confusion** - Real-time balance calculations and debt optimization
- **No more scattered photos** - Centralized photo album with memory timeline
- **100% transparent** - Everyone sees the same information in real-time

### Core Value Proposition

- **Gastos claros** (Clear expenses) - Automatic balance calculation
- **Recuerdos para siempre** (Memories forever) - Shared photo album with map visualization
- **Todo en un solo lugar** (All in one place) - Unified experience

### Target Users

- Friends traveling together in groups
- Family vacations
- Digital nomad groups
- Any group that needs to split expenses and share memories

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.5 | React framework with App Router |
| **React** | 19.2.0 | UI library |
| **TypeScript** | 5.x | Type-safe development |
| **Tailwind CSS** | 3.4.17 | Utility-first styling |
| **Framer Motion** | 12.23.24 | Animations and transitions |
| **Radix UI** | Various | Accessible component primitives |
| **React Query** | 5.83.0 | Server state management |
| **Supabase Client** | 2.86.0 | Database and auth client |
| **Recharts** | 2.15.4 | Data visualization |
| **Lucide React** | Latest | Icon system |
| **Zod** | 3.25.76 | Schema validation |
| **React Hook Form** | 7.61.1 | Form management |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Backend language |
| **FastAPI** | Latest | Web framework |
| **LangGraph** | Latest | AI agent orchestration |
| **LangChain** | Latest | LLM integration |
| **OpenAI API** | Latest | GPT-4o / GPT-4o-mini |
| **Anthropic API** | Latest | Claude fallback |
| **Uvicorn** | Latest | ASGI server |
| **PostgreSQL** | Latest | Persistent state storage |

### Database & Infrastructure

| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL database, Auth, Storage |
| **Railway** | Backend deployment |
| **Vercel** | Frontend deployment (assumed) |

### AI & ML

- **GPT-4o** - Primary model for expense understanding and multimodal vision
- **GPT-4o-mini** - Fallback for faster responses
- **Claude** - Secondary fallback
- **Gemini** - Tertiary fallback
- **LangGraph** - Agent workflow orchestration with 12 specialized tools

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  Landing     │  │  Dashboard   │  │  Session (Chat)    │   │
│  │  Auth Pages  │  │  Trip Views  │  │  Real-time Chat    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│         │                  │                     │              │
│         └──────────────────┴─────────────────────┘              │
│                            │                                     │
│                            │ WebSocket + HTTP                    │
│                            ▼                                     │
└────────────────────────────────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     BACKEND (FastAPI + Python)                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              WebSocket Room Manager                    │    │
│  │  - Multi-user chat rooms                              │    │
│  │  - Real-time broadcasting                             │    │
│  │  - User presence tracking                             │    │
│  └─────────────────────┬──────────────────────────────────┘    │
│                        │                                        │
│  ┌─────────────────────▼──────────────────────────────────┐    │
│  │          LangGraph AI Agent (12 Tools)                 │    │
│  │  - Expense registration & editing                      │    │
│  │  - Balance calculation                                 │    │
│  │  - Debt optimization                                   │    │
│  │  - Payment recording                                   │    │
│  │  - Photo management                                    │    │
│  │  - Milestone creation                                  │    │
│  └─────────────────────┬──────────────────────────────────┘    │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌────────────────┐ ┌──────────┐ ┌──────────────┐
│   PostgreSQL   │ │ Supabase │ │  LLM APIs    │
│   (LangGraph   │ │ Storage  │ │ GPT/Claude/  │
│   Checkpointer)│ │ (Photos) │ │   Gemini     │
└────────────────┘ └──────────┘ └──────────────┘
```

### Data Flow

1. **User sends message** → WebSocket connection
2. **Room Manager** → Broadcasts to all participants in session
3. **LangGraph Agent** → Processes with AI tools
4. **State Update** → Persisted to PostgreSQL
5. **Response** → Streamed back to all users in real-time

---

## Features & Functionality

### 1. User Authentication & Onboarding

#### Features:
- **Email authentication** via Supabase Auth
- **Magic link login** (passwordless)
- **Anonymous joining** - Users can join sessions without account
- **User profiles** with avatar and name
- **Email verification** flow

#### Pages:
- `/auth` - Login/signup page
- `/auth/verified` - Post-verification landing
- `/auth/callback` - OAuth callback handler

---

### 2. Trip/Session Management

#### Features:
- **Create trip** with name, dates, location, cover image
- **Session code generation** (6-character unique code)
- **Invite participants** via code sharing
- **Multiple trips** per user
- **Active vs past trips** distinction
- **Trip dashboard** with quick stats

#### Trip Attributes:
```typescript
{
  id: number
  name: string
  subtitle: string
  location: string
  startDate: string
  endDate: string
  coverImage: string
  sessionCode: string (6 chars)
  participants: User[]
  status: 'active' | 'completed' | 'cancelled'
}
```

---

### 3. Expense Tracking (AI-Powered)

#### Natural Language Processing
Users can type in plain language:
- "Pagué 50 por el taxi"
- "Juan pagó 100 del almuerzo"
- "Edita el gasto del taxi a 60"
- "Borra el último gasto"

#### AI Tools (12 total):

##### Expense Management:
1. **`register_expense`** - Add new expense
   - Detects currency from context (PEN for Peru, CLP for Chile)
   - Auto-splits among participants
   - Natural language description parsing

2. **`edit_expense`** - Modify existing expense
   - Update amount, description, split

3. **`delete_expense`** - Remove expense

4. **`list_expenses`** - View all expenses

##### Balance & Payments:
5. **`get_balance`** - Check individual or all balances
   - Multi-currency support (PEN, CLP, USD, EUR, ARS, BRL, COP)

6. **`get_debts`** - Calculate optimized debt settlements
   - Minimizes number of transactions
   - Per-currency calculation

7. **`register_payment`** - Record payment between users
   - "Le pagué 30 a Pedro"

##### Photo & Memory Management:
8. **`create_milestone`** - Create trip moment/milestone
9. **`register_photo`** - Upload photo to milestone
10. **`list_milestones`** - View all milestones
11. **`list_photos`** - View photos in milestone
12. **`view_photos`** - Get photo details with vision analysis

#### Expense Attributes:
```typescript
{
  id: string
  amount: number
  currency: string (ISO code)
  description: string
  paid_by: string
  split_among: string[]
  timestamp: string
}
```

---

### 4. Real-time Chat System

#### Features:
- **Multi-user WebSocket rooms**
- **Real-time message broadcasting**
- **User presence tracking** (online/offline indicators)
- **AI assistant integration** (bot messages)
- **Image support** (base64 upload for receipts)
- **Typing indicators**
- **Streaming responses** from AI

#### Message Types:
- `user_message` - User-sent message
- `bot_chunk` - AI streaming response chunk
- `bot_complete` - AI response finished
- `user_joined` - User connected to session
- `user_left` - User disconnected

#### WebSocket Endpoint:
```
ws://backend-url/ws/{thread_id}/{user_id}
```

---

### 5. Balance & Debt Optimization

#### Features:
- **Multi-currency balance tracking**
- **Automatic debt calculation**
- **Optimized settlement** (minimum transactions)
- **Per-person spending breakdown**
- **Visual charts** with percentages
- **Real-time updates** as expenses are added

#### Balance Calculation:
```
Balance = Total paid - Fair share
- Negative balance = owes money
- Positive balance = owed money
```

#### Debt Optimization Algorithm:
- Separate calculation per currency
- Creditors (positive balance) vs Debtors (negative balance)
- Greedy matching to minimize transactions
- Result: Simplified payment plan

---

### 6. Photo Album & Memory Map

#### Features:
- **Shared photo album** per trip
- **Milestones/Moments** organization
- **Location tagging** (GPS coordinates)
- **Timeline view** (chronological)
- **Interactive memory map** with markers
- **Photo captions** and descriptions
- **Auto-detected people** in photos (future)
- **Supabase Storage** integration

#### Photo Schema:
```typescript
{
  id: string
  milestone_id: string
  storage_url: string
  thumbnail_url: string
  description: string
  tags: string[]
  location: string
  uploaded_by: string
  uploaded_at: string
}
```

#### Milestone Schema:
```typescript
{
  id: string
  name: string
  description: string
  location: string
  tags: string[]
  created_by: string
  photo_count: number
  cover_photo_id: string
}
```

---

### 7. Dashboard & Analytics

#### Features:
- **Active trip hero card** with progress bar
- **Quick stats cards:**
  - Total spent
  - Your balance (owe/owed)
  - Photos count
  - Places visited
- **Quick actions** for add expense, upload photo, view map
- **Past trips** grid with preview cards
- **Empty state** for first-time users

---

### 8. Share & Collaboration

#### Features:
- **Session code sharing** (6-character code)
- **Share dialog** with copy link
- **QR code** for mobile joining (future)
- **Participant avatars** with online status
- **Real-time participant list**
- **Anonymous guest joining** (no account required)

---

## Project Structure

```
my-app/
├── backend/                        # Python FastAPI backend
│   ├── main.py                    # FastAPI server, WebSocket, HTTP endpoints
│   ├── graph.py                   # LangGraph agent with 12 AI tools
│   ├── room_manager.py            # WebSocket room broadcasting
│   ├── services/
│   │   ├── __init__.py
│   │   ├── supabase_db.py        # PostgreSQL checkpointer
│   │   └── supabase_storage.py   # Photo upload service
│   ├── tests/
│   │   └── test_graph.py
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── railway.json              # Railway deployment config
│   ├── README.md
│   └── .env                      # Backend environment variables
│
├── src/                           # Next.js frontend source
│   ├── app/                       # App Router pages
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing page
│   │   ├── not-found.tsx
│   │   ├── globals.css
│   │   ├── auth/
│   │   │   ├── page.tsx          # Login/signup
│   │   │   ├── verified/
│   │   │   │   └── page.tsx      # Email verified success
│   │   │   └── callback/
│   │   │       └── route.ts      # OAuth callback
│   │   ├── dashboard/
│   │   │   └── page.tsx          # User dashboard
│   │   ├── create-session/
│   │   │   └── page.tsx          # Create new trip
│   │   ├── join/
│   │   │   └── [code]/
│   │   │       └── page.tsx      # Join trip by code
│   │   ├── session/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Trip chat/expenses view
│   │   └── trip/
│   │       └── [id]/
│   │           └── page.tsx      # Trip detail page
│   │
│   ├── components/                # Reusable components
│   │   ├── BackButton.tsx
│   │   ├── Header.tsx
│   │   ├── MobileNav.tsx
│   │   ├── NavLink.tsx
│   │   ├── ShareSessionDialog.tsx
│   │   ├── FloatingActionButton.tsx
│   │   ├── UserAvatar.tsx
│   │   ├── TravelCalculator.tsx
│   │   ├── TripExpenses.tsx
│   │   ├── TripMemoryMap.tsx
│   │   ├── TripMoments.tsx
│   │   ├── providers.tsx
│   │   ├── chat/
│   │   │   ├── index.ts
│   │   │   ├── ChatConversation.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   └── ChatThinking.tsx
│   │   └── ui/                   # Radix UI + shadcn components
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── scroll-area.tsx
│   │       ├── tabs.tsx
│   │       ├── toast.tsx
│   │       └── [30+ more UI components]
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx       # Supabase auth provider
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   └── useJourniChat.ts      # WebSocket chat hook
│   │
│   ├── lib/
│   │   ├── utils.ts              # Utility functions
│   │   └── supabase/
│   │       ├── client.ts         # Browser Supabase client
│   │       └── server.ts         # Server Supabase client
│   │
│   ├── assets/                    # Static images
│   │   ├── travelers-illustration.png
│   │   ├── hero-landscape.png
│   │   ├── map-background.png
│   │   ├── trip-chile.png
│   │   ├── trip-machu-picchu.png
│   │   └── trip-paracas.png
│   │
│   └── middleware.ts              # Auth middleware
│
├── public/                        # Public static files
│   └── assets/                    # Public images
│
├── supabase/                      # Database migrations
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_views_and_functions.sql
│       ├── 004_milestones_table.sql
│       └── 005_photos_milestone_link.sql
│
├── docs/                          # Documentation
│   ├── AUTH_SETUP.md
│   ├── DATABASE_SETUP_GUIDE.md
│   ├── DASHBOARD_DEMO_MODE.md
│   ├── MIGRATION_STATUS.md
│   ├── MIGRATION_STRATEGY.md
│   ├── PAGES_MIGRATION_CHECKLIST.md
│   └── README_DATABASE.md
│
├── .env.local                     # Frontend environment variables
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.ts
├── eslint.config.mjs
├── components.json                # shadcn config
├── brand.md                       # Design system & brand guide
└── README.md
```

---

## Frontend Documentation

### Pages & Routes

#### 1. Landing Page (`/`)

**File:** `src/app/page.tsx`

**Purpose:** Marketing landing page with value proposition

**Sections:**
1. **Hero Section**
   - Main headline: "Viaja libre. Disfruta cada momento."
   - Travelers illustration
   - CTA: "Comenzar ahora" → `/auth`
   - Quick join with session code

2. **The Pain Section**
   - Problem statement: "¿Te suena familiar?"
   - 3 pain points:
     - Excel chaos (📊)
     - Confusion sobre deudas (🤔)
     - Fotos perdidas (📸)
   - Stats:
     - 21-36% amistades perdidas por dinero
     - 32% del dinero prestado nunca se devuelve
     - 41% siente tensión al dividir gastos

3. **The Solution Section**
   - "Todo lo que necesitas en un solo lugar"
   - 3 main features:
     - 💰 Balance automático
     - 📸 Álbum compartido
     - 🗺️ Mapa de recuerdos
   - Transparency badge: "100% transparente, siempre"

4. **How It Works**
   - 3-step process:
     1. 👥 Crea tu viaje
     2. 💸 Registra mientras viajas
     3. ✅ Disfruta sin preocuparte

5. **Final CTA**
   - Epic section with globe emoji 🌎
   - "Tus aventuras merecen ser vividas sin drama"
   - CTA: "Comenzar mi aventura"
   - Trust badges: Gratis, sin tarjeta, 2 min setup

**Animations:**
- Parallax scrolling effects
- Framer Motion animations
- Hover states on cards
- Gradient backgrounds

---

#### 2. Auth Page (`/auth`)

**File:** `src/app/auth/page.tsx`

**Purpose:** Login and signup

**Features:**
- Email/password authentication
- Magic link option
- Supabase Auth integration
- Redirects to `/dashboard` on success

---

#### 3. Dashboard (`/dashboard`)

**File:** `src/app/dashboard/page.tsx`

**Purpose:** User's trip management hub

**Two States:**

##### A. Empty State (No Active Trip)
- Animated plane emoji ✈️
- Welcome message
- 2 action cards:
  1. **Create Trip** 🚀
     - → `/create-session`
  2. **Join Trip** 🎉
     - Prompt for code input

##### B. Active Trip State
- **Quick Stats Bar** (4 cards)
  1. Total gastado (Wallet icon, coral)
  2. Tu balance (TrendingUp/Down, red/green)
  3. Fotos (Camera, green)
  4. Lugares (Map, blue)

- **Active Trip Hero Card** (clickeable)
  - Cover image with gradient overlay
  - Trip name + subtitle
  - Location, dates, participant count
  - Progress bar (Día X de Y)
  - Participant avatars
  - Days remaining badge
  - → `/session/{id}`

- **Quick Actions** (3 cards)
  1. Agregar gasto (Wallet, coral)
  2. Subir foto (Camera, green)
  3. Ver mapa (MapPin, blue)

- **Past Trips Grid**
  - Cards with image, location, date, total
  - → `/session/{id}`
  - "Crear Nuevo Viaje" button

**Animations:**
- Staggered card entrance (spring physics)
- Hover scale effects
- Progress bar fill animation

---

#### 4. Create Session (`/create-session`)

**File:** `src/app/create-session/page.tsx`

**Purpose:** Create new trip

**Form Fields:**
- Trip name
- Dates (start/end)
- Location
- Cover image upload
- Participant emails (optional)

**Output:** Generates unique 6-character code

---

#### 5. Join Session (`/join/[code]`)

**File:** `src/app/join/[code]/page.tsx`

**Purpose:** Join existing trip via code

**Flow:**
1. Validate session code
2. If not logged in: create anonymous user profile
3. Add to trip participants
4. → `/session/{id}`

---

#### 6. Session Chat (`/session/[id]`)

**File:** `src/app/session/[id]/page.tsx`

**Purpose:** Main trip interaction page - chat, expenses, balances

**Layout:** 2-column (desktop), stacked (mobile)

##### Left Column - Chat Panel
- **Header:**
  - "Chat del Grupo"
  - Connection badge (Wifi icon, green/yellow/red)
  - "Conectado como {displayName}"

- **ChatConversation:**
  - Message list with auto-scroll
  - User messages (right-aligned)
  - Bot messages (left-aligned, with thinking steps)
  - Streaming support
  - Image support for receipts

- **ChatInput:**
  - Text input for messages
  - Image upload button
  - Send button
  - Disabled when not connected

##### Right Column - Expenses Panel
- **Expenses List Card:**
  - Scrollable list of all expenses
  - Each expense shows:
    - Avatar, name, description, date
    - Amount in large text
    - Split among X personas
  - Empty state with "No hay gastos"

- **Gasto por Persona Card:**
  - Per-person spending breakdown
  - Progress bars showing % of total
  - Total badge at top

- **Resumen de Deudas Card:**
  - Optimized debt settlements
  - From → To badges
  - Amount badges
  - "Marcar como liquidado" button
  - Empty state: "¡Están a mano!"

**Real-time Features:**
- WebSocket connection status
- Participant online indicators
- Live message updates
- Live expense updates

---

#### 7. Trip Detail (`/trip/[id]`)

**File:** `src/app/trip/[id]/page.tsx`

**Purpose:** View-only trip summary (future)

---

### Key Components

#### Chat Components

##### 1. ChatConversation (`src/components/chat/ChatConversation.tsx`)

**Props:**
```typescript
{
  messages: Message[]
  streamingContent: string
  isTyping: boolean
  thinkingSteps: string[]
  className?: string
}
```

**Features:**
- Auto-scroll to bottom
- Message grouping by sender
- Timestamp display
- Streaming message rendering
- Thinking steps visualization

---

##### 2. ChatInput (`src/components/chat/ChatInput.tsx`)

**Props:**
```typescript
{
  onSend: (content: string, image?: string) => void
  disabled: boolean
  isTyping: boolean
}
```

**Features:**
- Text input with Enter to send
- Image upload (base64)
- Loading state
- Disabled state

---

##### 3. ChatMessage (`src/components/chat/ChatMessage.tsx`)

**Props:**
```typescript
{
  message: Message
  isBot: boolean
}
```

**Features:**
- User avatar
- Message bubble styling
- Timestamp
- Image preview

---

#### UI Components

All UI components are built with **Radix UI** primitives and styled with **Tailwind CSS**. Located in `src/components/ui/`.

**Key Components:**
- Button (variants: default, outline, ghost, secondary, pill)
- Card (with shadow-card custom shadow)
- Badge (variants: default, secondary, outline)
- Avatar with AvatarFallback
- Dialog, Sheet, Drawer
- Tabs, Accordion, Collapsible
- ScrollArea
- Toast notifications
- And 30+ more...

---

### Custom Hooks

#### useJourniChat (`src/hooks/useJourniChat.ts`)

**Purpose:** Manages WebSocket connection and chat state

**Parameters:**
```typescript
{
  sessionId: string
  userId: string
  onError?: (error: Error) => void
}
```

**Returns:**
```typescript
{
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  connect: () => void
  disconnect: () => void
  sendMessage: (content: string, image?: string) => void
  messages: Message[]
  isTyping: boolean
  streamingContent: string
  thinkingSteps: string[]
  sessionState: {
    expenses: Expense[]
    payments: Payment[]
    balances: Record<string, Record<string, number>>
    debts: Record<string, Debt[]>
  }
  participants: string[]
  onlineUsers: string[]
}
```

**Features:**
- Auto-reconnect on disconnect
- Heartbeat ping/pong
- Message buffering
- State synchronization
- Participant tracking

---

### Contexts

#### AuthContext (`src/contexts/AuthContext.tsx`)

**Purpose:** Supabase authentication provider

**Provides:**
```typescript
{
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}
```

---

## Backend Documentation

### Main Server (`backend/main.py`)

**Framework:** FastAPI

**Key Endpoints:**

#### 1. WebSocket: `/ws/{thread_id}/{user_id}`

**Purpose:** Real-time chat connection

**Flow:**
1. Client connects with thread_id (session) and user_id (name)
2. Server adds to room via RoomManager
3. Broadcasts `user_joined` to all participants
4. Receives messages, processes with LangGraph agent
5. Streams AI responses as `bot_chunk` events
6. Sends `bot_complete` when done
7. On disconnect, broadcasts `user_left`

**Message Format (Client → Server):**
```json
{
  "content": "Pagué 50 por el taxi",
  "image": "base64..." // optional
}
```

**Event Types (Server → Client):**
```json
{
  "type": "user_message",
  "user_id": "Juan",
  "content": "Pagué 50 por el taxi",
  "timestamp": "2024-11-29T10:30:00Z"
}

{
  "type": "bot_chunk",
  "content": "Gasto registrado:",
  "thinking_step": "Registrando gasto de 50 PEN..."
}

{
  "type": "bot_complete",
  "full_response": "Gasto registrado: 50 PEN por taxi"
}

{
  "type": "user_joined",
  "user_id": "María"
}

{
  "type": "user_left",
  "user_id": "Pedro"
}

{
  "type": "state_update",
  "state": {
    "expenses": [...],
    "balances": {...},
    "debts": {...}
  }
}
```

---

#### 2. POST `/api/chat`

**Purpose:** Vercel AI SDK compatible endpoint

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "Hola"}
  ],
  "id": "session-1"
}
```

**Response:** Server-Sent Events (SSE) stream

---

#### 3. GET `/api/sessions/{thread_id}`

**Purpose:** Get session state snapshot

**Response:**
```json
{
  "expenses": [...],
  "balances": {...},
  "debts": {...},
  "participants": [...],
  "milestones": [...],
  "photos": [...]
}
```

---

### LangGraph Agent (`backend/graph.py`)

**Purpose:** AI agent for expense and photo management

**State Schema:**
```python
class JourniState(TypedDict):
    messages: list  # Chat history
    expenses: list[Expense]
    payments: list[Payment]
    participants: list[str]
    balances: dict[str, dict[str, float]]  # {person: {currency: amount}}
    session_name: str
    session_context: dict
    milestones: list[Milestone]
    photos: list[Photo]
```

**AI Tools:**

##### Expense Tools:
1. **register_expense**
   ```python
   def register_expense(
       amount: float,
       description: str,
       paid_by: str,
       currency: str = "PEN",
       split_among: Optional[list[str]] = None
   ) -> str
   ```

2. **edit_expense**
   ```python
   def edit_expense(
       expense_id: str,
       amount: Optional[float] = None,
       description: Optional[str] = None,
       split_among: Optional[list[str]] = None
   ) -> str
   ```

3. **delete_expense**
   ```python
   def delete_expense(expense_id: str) -> str
   ```

4. **list_expenses**
   ```python
   def list_expenses() -> str
   ```

##### Balance Tools:
5. **get_balance**
   ```python
   def get_balance(person: Optional[str] = None) -> str
   ```

6. **get_debts**
   ```python
   def get_debts() -> str
   ```

7. **register_payment**
   ```python
   def register_payment(
       from_user: str,
       to_user: str,
       amount: float,
       currency: str = "PEN"
   ) -> str
   ```

##### Photo Tools:
8. **create_milestone**
   ```python
   def create_milestone(
       name: str,
       description: Optional[str] = None,
       location: Optional[str] = None,
       tags: Optional[list[str]] = None
   ) -> str
   ```

9. **register_photo**
   ```python
   def register_photo(
       milestone_id: str,
       image_data: str,  # base64
       description: str,
       location: Optional[str] = None
   ) -> str
   ```

10. **list_milestones**
11. **list_photos**
12. **view_photos** (multimodal - vision API)

**Graph Flow:**
```
START → agent_node → execute_tools → agent_node → END
         ↑                               ↓
         └───────────────────────────────┘
              (loop until no tools)
```

---

### Room Manager (`backend/room_manager.py`)

**Purpose:** Manage WebSocket rooms for multi-user chat

**Key Methods:**
```python
class RoomManager:
    def join(self, room_id: str, user_id: str, websocket: WebSocket)
    def leave(self, room_id: str, user_id: str)
    async def broadcast(self, room_id: str, message: dict, exclude: Optional[str] = None)
    def get_participants(self, room_id: str) -> list[str]
    def get_online_users(self, room_id: str) -> list[str]
```

**Features:**
- Room-based organization (one room per session)
- Per-user WebSocket tracking
- Broadcast to all or exclude sender
- Participant list management

---

### Supabase Services (`backend/services/`)

#### supabase_db.py

**Purpose:** PostgreSQL checkpointer for LangGraph state persistence

**Key Functions:**
```python
async def get_async_postgres_saver() -> AsyncPostgresSaver
async def save_checkpoint(thread_id: str, state: dict)
async def load_checkpoint(thread_id: str) -> dict
```

---

#### supabase_storage.py

**Purpose:** Photo upload to Supabase Storage

**Key Functions:**
```python
async def upload_photo(
    file_data: bytes,
    file_name: str,
    bucket: str = "trip-photos"
) -> dict  # {url, path}

async def delete_photo(path: str)
async def get_public_url(path: str) -> str
```

---

## Database Schema

### Supabase PostgreSQL

**Migration Files:** `supabase/migrations/`

### Tables

#### 1. users
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** User profiles extending Supabase Auth

---

#### 2. trips
```sql
CREATE TABLE public.trips (
  id BIGSERIAL PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subtitle TEXT,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image_url TEXT,
  session_code TEXT UNIQUE NOT NULL,  -- 6-character code
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** Trip/session information

---

#### 3. trip_participants
```sql
CREATE TABLE public.trip_participants (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);
```

**Purpose:** Many-to-many relationship between users and trips

---

#### 4. expenses
```sql
CREATE TABLE public.expenses (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  paid_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'PEN' CHECK (currency IN ('PEN', 'USD', 'EUR', 'CLP', 'ARS', 'BRL', 'COP')),
  category TEXT,
  expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** Expenses registered in each trip

---

#### 5. expense_splits
```sql
CREATE TABLE public.expense_splits (
  id BIGSERIAL PRIMARY KEY,
  expense_id BIGINT NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  is_settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);
```

**Purpose:** How expenses are split among participants

---

#### 6. chat_messages
```sql
CREATE TABLE public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_bot_message BOOLEAN DEFAULT FALSE,
  related_expense_id BIGINT REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** Group chat messages including bot responses

---

#### 7. photos
```sql
CREATE TABLE public.photos (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  location_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** Photos uploaded to trip albums

---

#### 8. locations
```sql
CREATE TABLE public.locations (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  category TEXT,
  visited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** Places visited during trips

---

#### 9. milestones (Migration 004)
```sql
CREATE TABLE public.milestones (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** Trip milestones/moments containing photos

---

### Indexes

**14 indexes created for performance:**
- trips: creator_id, session_code, status, dates
- trip_participants: trip_id, user_id
- expenses: trip_id, paid_by_user_id, expense_date
- expense_splits: expense_id, user_id, is_settled
- chat_messages: trip_id, created_at
- photos: trip_id, uploaded_by_user_id
- locations: trip_id, coordinates

---

### Row Level Security (RLS)

**Migration:** `002_rls_policies.sql`

**Policies:**
- Users can only read/write their own profile
- Trip creators are admins
- Participants can read trip data
- Only admins can delete trips
- Participants can add expenses, photos, messages
- Public read for shared session codes

---

### Views & Functions

**Migration:** `003_views_and_functions.sql`

**Key Views:**
- `trip_summary` - Trip with participant count, total expenses
- `user_balance_by_trip` - Per-user balance calculation
- `expense_with_splits` - Expenses with split details

**Key Functions:**
- `calculate_trip_balance(trip_id)` - Calculate all balances
- `get_optimized_debts(trip_id)` - Debt settlement plan
- `get_participant_summary(trip_id, user_id)` - User stats

---

## AI Features

### Natural Language Understanding

The LangGraph agent understands Spanish and English natural language for:

**Expense Registration:**
- "Pagué 50 por el taxi"
- "Juan paid 100 for lunch"
- "Edita el gasto del taxi a 60"
- "Delete the last expense"

**Balance Queries:**
- "¿Cuánto debo?"
- "¿Quién debe a quién?"
- "What's my balance?"

**Payments:**
- "Le pagué 30 a Pedro"
- "Paid María back 50"

**Photos:**
- "Crea un milestone llamado 'Playa'"
- "Add this photo to the beach milestone"

### Multi-Currency Support

**Supported:** PEN, CLP, USD, EUR, ARS, BRL, COP

**Context Detection:**
- "Pagué 1000 en Chile" → Detects CLP
- "Paid 50 in Peru" → Detects PEN
- Manual override: "Pagué 100 USD"

**Balance Tracking:**
```json
{
  "Juan": {
    "PEN": 50.0,
    "CLP": -15000.0,
    "USD": 20.0
  }
}
```

**Debt Calculation:** Per-currency optimization

---

### Multimodal Vision (GPT-4o)

**Use Cases:**
1. **Receipt Scanning**
   - Upload photo of receipt
   - AI extracts: amount, items, date
   - Auto-registers expense

2. **Photo Understanding**
   - Detect people in photos
   - Extract location from context
   - Generate captions

**Implementation:**
```python
# In graph.py
@tool
def view_photos(milestone_id: str) -> str:
    """View and analyze photos with GPT-4o vision"""
    # Sends image to GPT-4o
    # Returns: people detected, location, description
```

---

### Model Fallback Chain

**Priority:**
1. **GPT-4o** (primary) - Best multimodal
2. **GPT-4o-mini** (fallback) - Faster, cheaper
3. **Claude** (secondary fallback) - via OpenRouter
4. **Gemini** (tertiary fallback)

**Configured in:** `backend/graph.py`

---

## Integration & APIs

### Supabase

**Services Used:**
1. **Auth** - Email authentication, magic links
2. **Database** - PostgreSQL with RLS
3. **Storage** - Photo uploads (trip-photos bucket)
4. **Realtime** - (future: real-time subscriptions)

**Environment Variables:**
```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Backend (.env)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_DB_URL=postgresql://postgres.xxx:xxx@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```

---

### LLM APIs

**OpenAI:**
```bash
OPENAI_API_KEY=sk-...
```

**Anthropic:**
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

**OpenRouter (for Claude/Gemini fallback):**
```bash
OPENROUTER_API_KEY=sk-or-...
```

---

### LangSmith (Optional Tracing)

```bash
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=ls-...
LANGSMITH_PROJECT=journi
```

---

## Design System

**Brand Guide:** `brand.md`

### Color Palette

#### Backgrounds
```css
--background: #DDEFC4        /* Verde pastel claro */
--card: #FFF7F0              /* Blanco cálido / crema */
--navbar: #FFFFFF            /* Blanco puro */
```

#### Primary (Orange/Coral)
```css
--primary: #FF8750           /* Naranja vibrante */
--coral: #F5693C             /* Naranja oscuro */
--coral-light: #FFC9A3       /* Naranja pastel */
--coral-pale: #FFE3CC        /* Naranja muy pálido */
```

#### Accent (Green)
```css
--greenNature: #B9E88A       /* Verde pastel */
--greenNature-medium: #6EBF4E /* Verde saturado */
--greenNature-gray: #7FB38A  /* Verde grisáceo */
```

#### Blue (Snow/Cold destinations)
```css
--blueSnow: #BEE5FF          /* Azul cielo claro */
--blueSnow-medium: #7FC4FF   /* Azul medio */
--blueSnow-deep: #4A98D6     /* Azul profundo */
```

#### Text
```css
--foreground: #2F2F3A        /* Gris muy oscuro (texto principal) */
--muted-foreground: #7D7D8A  /* Gris medio (secundario) */
--placeholder: #B4B4C2       /* Gris claro */
```

#### Borders
```css
--border: #ECECF2            /* Gris muy claro */
```

---

### Typography

**Font:** Geist (Vercel font), fallback to Poppins/Nunito style

**Hierarchy:**
- **H1:** 5xl-7xl, font-bold (56-72px)
- **H2:** 3xl-5xl, font-bold (36-48px)
- **H3:** xl-2xl, font-semibold (20-24px)
- **Body:** base-lg (16-18px)
- **Small:** sm-xs (12-14px)

---

### Spacing & Layout

**Borders:**
- Cards: `rounded-2xl` to `rounded-3xl` (16-24px)
- Buttons: `rounded-full` (pill shape)
- Badges: `rounded-full`

**Shadows:**
- Soft: `shadow-soft` (custom)
- Card: `shadow-card` (custom)
- Large: `shadow-2xl`

**Grid:**
- Container: `container mx-auto px-4`
- Max width: `max-w-6xl` or `max-w-7xl`
- Gap: `gap-4` to `gap-6` (16-24px)

---

### Animations

**Framer Motion Patterns:**
- **Card entrance:** Spring physics, staggered delays
- **Hover:** Scale 1.05, y: -8px
- **Tap:** Scale 0.97
- **Progress bars:** Width transition with spring
- **Parallax:** ScrollY transform

---

## Deployment

### Backend (Railway)

**File:** `backend/railway.json`

**Configuration:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/"
  }
}
```

**Steps:**
1. Create Railway project
2. Connect GitHub repo
3. Select `backend/` directory as root
4. Add environment variables from `.env.example`
5. Deploy

**Environment Variables:**
- All from `backend/.env.example`
- SUPABASE_DB_URL (Session Pooler, port 6543)

---

### Frontend (Vercel - Assumed)

**Framework:** Next.js 16

**Build Command:** `pnpm build`
**Output Directory:** `.next`

**Environment Variables:**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

---

### Database (Supabase)

**Migrations:**
1. Run migrations in order:
   ```bash
   supabase db push
   ```
2. Enable RLS policies
3. Configure storage buckets:
   - `trip-photos` (public read)

---

## Development Workflow

### Frontend

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev
# → http://localhost:3000

# Build for production
pnpm build

# Lint
pnpm lint
```

---

### Backend

```bash
# Create virtual environment
uv venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
uv pip install -r requirements.txt

# Run server
python main.py
# → http://localhost:8000

# Run tests
pytest -v

# Run specific test
pytest tests/test_graph.py::test_register_expense -v
```

---

### Testing Multi-User

**Option 1:** Multiple browser windows
- Open http://localhost:8000/test in 3-4 windows
- Each simulates a different user
- Messages broadcast to all

**Option 2:** Frontend + Backend
- Run backend on :8000
- Run frontend on :3000
- Create session, share code
- Join from multiple devices/browsers

---

## Summary

**Journi** is a comprehensive full-stack application combining:

- ✅ **AI-powered expense tracking** with natural language processing
- ✅ **Real-time multi-user collaboration** via WebSockets
- ✅ **Multi-currency support** with optimized debt settlement
- ✅ **Photo album & memory mapping** with GPS and timeline
- ✅ **Modern React frontend** with Next.js 16 and Framer Motion
- ✅ **Scalable Python backend** with FastAPI and LangGraph
- ✅ **PostgreSQL database** with Supabase (Auth, DB, Storage)
- ✅ **Production-ready** deployment configuration

**Key Technologies:**
- Frontend: Next.js 16, React 19, TypeScript, Tailwind, Radix UI
- Backend: FastAPI, LangGraph, LangChain, GPT-4o
- Database: Supabase (PostgreSQL + Auth + Storage)
- Deployment: Railway (backend) + Vercel (frontend)

**Core Features:**
1. AI chatbot for expense tracking (12 tools)
2. Multi-currency balance tracking
3. Optimized debt calculation
4. Real-time group chat
5. Photo album with milestones
6. Memory map visualization
7. Anonymous guest joining
8. Mobile-responsive design

---

**End of Comprehensive Documentation**
