# Bilio - Product Requirements
## Personal Finance Management with AI

**Version:** 1.0
**Date:** December 2, 2025

---

## 1. Product Overview

**Bilio** is a personal finance management app that makes tracking money effortless through conversational AI. Users manage income and expenses across multiple accounts using natural language (text, voice, or photos), stay motivated with streak tracking, and make better financial decisions with AI-powered insights.

---

## 2. Platform Architecture

### 2.1 Applications

**Mobile App** (iOS & Android)
- Native or React Native
- Primary user interface
- Home screen widgets

**Web App**
- Progressive Web App (PWA)
- Desktop and mobile browser access
- Same features as mobile

**Backend API**
- Single unified backend serves both mobile and web
- FastAPI (Python) or Express.js (Node.js)
- PostgreSQL database (Supabase)
- Supabase Authentication & Storage

### 2.2 AI Infrastructure

**AI Agent with Streaming**
- LangGraph-based conversational agent
- OpenAI GPT-4o (primary model)
- **Streaming responses** for mobile and web interfaces
- WebSocket for real-time chat
- State persistence via PostgreSQL

**WhatsApp Integration Support**
- Backend architecture supports WhatsApp channel
- **No streaming** for WhatsApp (platform limitation)
- Same AI agent, adapted for WhatsApp constraints
- Send/receive messages via Twilio or WhatsApp Business API

---

## 3. Core Features

### 3.1 Transaction Management

**Register Income and Expenses**
- Amount, description, category, account, currency, date
- Support both income and expenses
- Multi-currency: PEN, USD, EUR, CLP, ARS, BRL, COP

**Operations:**
- Create transaction
- Edit transaction
- Delete transaction
- List transactions (filter by account, category, date range)

---

### 3.2 Multi-Account System

**Account Types:**
1. **Personal** - Created automatically on signup (default)
2. **Business** - Dynamically created by user/AI
3. **Family** - Dynamically created by user/AI
4. **Custom** - Any user-defined account name

**Account Features:**
- Create accounts dynamically via AI ("create a business account")
- Set default account for quick operations
- Each account has independent balance and budgets
- Archive/delete accounts

**Account Properties:**
- Name, type, default currency, color, icon
- Is default flag
- Balance (calculated from transactions)

---

### 3.3 Category System

**System Categories (Pre-loaded):**

**Expenses:** 🍔 Food, 🚗 Transport, 🏠 Housing, 🛍️ Shopping, 🎬 Entertainment, 💊 Health, 📚 Education, 💄 Personal Care, 📱 Subscriptions, 🐕 Pets, ✈️ Travel, 📊 Other

**Income:** 💰 Salary, 💼 Freelance, 🎯 Side Hustle, 💹 Investments, 🎁 Gifts, 📈 Other

**Custom Categories:**
- Users create custom categories dynamically
- **Emoji is required** as separate parameter in creation
- Examples: name="Matilda" emoji="🐶", name="Moto" emoji="🏍️", name="Boda" emoji="💍"
- AI suggests emoji when creating category

**Category Properties:**
- Name (text only, e.g., "Matilda")
- Emoji (separate field, e.g., "🐶")
- Type (expense/income/both)
- Parent category (optional)
- Color (optional)

**Features:**
- AI auto-suggests category from description
- Optional subcategories (parent/child)
- Edit/delete custom categories

---

### 3.4 Budget System

**Budget Properties:**
- Category (which category to limit)
- Amount (spending limit)
- Currency
- Period (weekly, monthly, yearly, custom date range)
- Account (optional: apply to specific account)
- Alert threshold (default 80%)
- Rollover option (carry unused budget to next period)

**Budget Features:**
- Set multiple budgets per category/account
- Real-time tracking: spent / limit
- Alerts when approaching or exceeding budget
- Visual progress indicators

---

### 3.5 AI Chat Interface

**Input Methods:**

**1. Text Input**
- Natural language in Spanish or English
- "Gasté 20 soles en almuerzo" → registers expense
- "Me pagaron 5000" → registers income
- "¿Cuánto gasté en comida?" → shows analysis

**2. Audio Input**
- Voice commands via microphone
- Whisper API for speech-to-text transcription
- Spanish and English support

**3. Photo Input (Receipt Scanning)**
- GPT-4o Vision for OCR
- Extract: amount, merchant, date, items
- Auto-suggest category
- Store receipt image

**AI Capabilities:**
- Context-aware (remembers default currency, account)
- Smart inference (infers category from description)
- Proactive alerts (budget warnings, streak reminders)
- Financial advice (spending patterns, recommendations)
- **Personal & conversational tone** (uses "Dale", "Perfecto", "Genial", "¡Vamos!", "le ponemos")
- Acknowledges user's specific names and context (e.g., pet names, account names)

**Streaming Responses:**
- AI responses stream in real-time (mobile & web)
- Start displaying text as it's generated
- Better UX for long responses

---

### 3.6 Visualization & Analytics

**Dashboard:**
- Total balance across accounts
- Income vs expenses (current month)
- Budget status indicators
- Recent transactions
- Streak counter

**Spending Patterns:**
- Category breakdown (pie charts)
- Spending over time (line/bar charts)
- Top expense categories
- Month-over-month trends

**Budget Tracking:**
- Progress bars per category
- Percentage used
- Remaining amount and days
- Over-budget alerts

**Insights:**
- "You spend 40% on food"
- "Transport costs up 20% this month"
- "You're saving 15% of income"
- Personalized recommendations

---

### 3.7 Gamification

**Streak System:**
- Daily tracking streak (register ≥1 transaction per day)
- Shows: Current streak, Longest streak
- Visual: Fire emoji 🔥 like Duolingo
- Breaks if user misses a day
- Always visible on dashboard

**Avatar Customization:**
- Bilio character base avatar
- Unlock clothes, accessories, colors
- Customize through achievements or tracking consistency

---

### 3.8 Widgets (Mobile)

**iOS/Android Home Screen Widgets:**

1. **Streak Widget** - Shows current streak with fire emoji
2. **Quick Audio Input** - Tap mic to register transaction
3. **Quick Text Input** - Small text field for fast entry
4. **Today's Summary** - Today's spending total
5. **Budget Progress** - Top budgets with progress bars

---

### 3.9 Profile & Settings

**User Profile:**
- Name, email, avatar configuration

**Preferences:**
- Default account
- Default currency
- Language (Spanish/English)

**Notifications:**
- Budget alerts
- Daily tracking reminders
- Streak reminders
- Weekly/monthly summaries

**Data Management:**
- Export transactions (CSV)
- Backup data
- Delete account

---

## 4. Technical Requirements

### 4.1 Backend

**Technology:**
- FastAPI (Python) or Express.js (Node.js)
- PostgreSQL via Supabase
- Supabase Auth (email, Google, Apple)
- Supabase Storage (receipt images)

**Real-time Communication:**
- **WebSocket** for mobile and web chat (with streaming)
- **HTTP webhooks** for WhatsApp integration (no streaming)

**AI Agent:**
- LangGraph state machine
- OpenAI GPT-4o for NLP and vision
- Whisper API for audio transcription
- Streaming support via Server-Sent Events (SSE) or WebSocket

**API Endpoints:**
- Authentication
- Transactions CRUD
- Accounts CRUD
- Categories CRUD
- Budgets CRUD
- Analytics queries
- Chat endpoint (WebSocket + HTTP)
- File upload (receipts)
- Audio transcription

### 4.2 Database Schema

**Tables:**

1. **users** - User profiles (extends Supabase Auth)
2. **accounts** - User's financial accounts
3. **categories** - Transaction categories (system + custom)
4. **transactions** - All income and expenses
5. **budgets** - Budget limits per category
6. **streaks** - Tracking consistency
7. **user_settings** - Preferences

**Key Relationships:**
- User → Accounts (1:N)
- User → Categories (1:N)
- User → Transactions (1:N)
- Account → Transactions (1:N)
- Category → Transactions (1:N)
- Account + Category → Budget (N:M through budgets table)

### 4.3 AI Tools (CRUD Operations)

**25 AI Tools for Agent:**

**Transactions (5):**
1. register_transaction
2. edit_transaction
3. delete_transaction
4. list_transactions
5. get_transaction_summary

**Accounts (5):**
6. create_account
7. edit_account
8. delete_account
9. list_accounts
10. set_default_account

**Categories (4):**
11. create_category(name: str, emoji: str, type: expense|income|both)
12. edit_category(name, new_name?, new_emoji?, new_type?)
13. delete_category(name)
14. list_categories(type?)

**Budgets (5):**
15. create_budget
16. edit_budget
17. delete_budget
18. list_budgets
19. get_budget_status

**Analytics (4):**
20. get_spending_analysis
21. get_income_analysis
22. get_category_breakdown
23. get_financial_advice

**Streaks (2):**
24. get_streak_status
25. update_streak

### 4.4 WhatsApp Integration Architecture

**Communication Flow:**
```
User → WhatsApp → Twilio/WhatsApp Business API → Backend Webhook → AI Agent
AI Agent → Backend → Twilio API → WhatsApp → User
```

**Constraints:**
- No streaming responses (WhatsApp limitation)
- Complete response sent at once
- Same AI agent logic, different delivery method
- Store conversation state in database
- Support text and image inputs
- Audio messages transcribed server-side

**Implementation:**
- Webhook endpoint: `/webhook/whatsapp`
- Parse incoming messages
- Pass to same LangGraph agent
- Wait for complete response
- Send via Twilio API

### 4.5 Security

**Authentication:**
- JWT tokens, OAuth 2.0
- Row-Level Security (RLS) on all tables
- Users only access own data

**Privacy:**
- Encryption at rest and in transit
- Private storage for receipts
- GDPR compliant
- No data sharing between users

**Rate Limiting:**
- API: 100 requests/minute per user
- AI chat: 30 messages/minute
- File uploads: 10 MB max

---

## 5. User Experience

### 5.1 Key User Flows

**Register Expense:**
1. Open app or use widget
2. Type/speak: "Gasté 20 soles en almuerzo"
3. AI responds: "Dale! 🍔 Registré 20 PEN en comida. Te quedan 1,230 PEN"
4. Streak updates if daily transaction registered

**Create Account:**
1. Chat: "Quiero una cuenta para el negocio"
2. AI: "Dale! Creé la cuenta 'Negocio' 💼. ¿Quieres que sea tu cuenta por defecto?"
3. User chooses, then uses: "Pagué 200 dólares en el negocio"

**Set Budget:**
1. Chat: "Ponme 500 soles mensuales para comida"
2. AI: "Perfecto! ✅ 500 PEN/mes para comida. Te aviso cuando llegues al 80%"
3. Track automatically with each food transaction

**Check Status:**
1. Chat: "¿Cómo voy?"
2. AI shows: Balances, budget status, streak, insights with personal tone

---

## 6. Example Conversations

### Text Input
```
User: "Gasté 20 soles en almuerzo"
Bilio: Dale! 🍔 Registré 20 PEN en comida
       Te quedan 1,230 PEN
       Vas en 280/500 del presupuesto (56%)
       ¡Racha de 15 días! 🔥
```

### Voice Input
```
User: [Taps mic] "Me pagaron cinco mil de freelance"
Bilio: Genial! 💰 Ingreso de 5,000 PEN registrado
       Ya tienes 6,230 PEN en total
       ¡Sigue así! 🎉
```

### Photo Input
```
User: [Uploads receipt photo]
Bilio: Ya lo vi! 📸
       • Total: 85.50 PEN
       • Lugar: Tottus
       • Categoría: Compras 🛍️
       ¿Lo registro así?
User: "Sí"
Bilio: Perfecto! ✅ Guardado y archivado
```

### Budget Check
```
User: "¿Cómo voy con comida?"
Bilio: 📊 Comida: 420/500 PEN (84%)
       Te quedan 80 soles, todavía hay 8 días
       ¡Vas súper bien! ✅
```

### Create Category (Personal)
```
User: "Crea categoría para los gastos de mi perrita Matilda"
Bilio: [AI calls: create_category(name="Matilda", emoji="🐶", type="expense")]
       Dale! Creé la categoría 'Matilda' 🐶
       ¿Cuánto presupuesto le ponemos mensual?
User: "100 soles"
Bilio: [AI calls: create_budget(category="Matilda", amount=100, currency="PEN", period="monthly")]
       Perfecto! ✅ 100 PEN/mes para Matilda 🐶
       Te aviso cuando llegues al 80%
```

### Create Account
```
User: "Quiero una cuenta para el negocio"
Bilio: Dale! Creé la cuenta 'Negocio' 💼
       ¿Quieres que sea tu cuenta por defecto?
User: "No, la personal"
Bilio: Perfecto! 'Personal' sigue siendo tu cuenta principal
       Cuando quieras usar Negocio, solo dime
```

### Multi-currency
```
User: "Pagué 200 dólares de hosting en el negocio"
Bilio: Perfecto! 💳 Registrado en cuenta Negocio
       200 USD - Hosting (Subscriptions)
       Balance Negocio: 3,400 PEN, 800 USD
```

