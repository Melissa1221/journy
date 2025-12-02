# Bilio AI - Implementation Plan
## Test-Driven Development Approach

**Date:** December 2, 2025
**Approach:** Automatic mode with TDD (Test → Execute → Fix)

---

## Folder Structure

```
bilio/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app + WebSocket
│   │   ├── graph.py                   # LangGraph agent
│   │   ├── state.py                   # BilioState definition
│   │   │
│   │   ├── tools/
│   │   │   ├── __init__.py
│   │   │   ├── transactions.py        # 5 transaction tools
│   │   │   ├── accounts.py            # 5 account tools
│   │   │   ├── categories.py          # 4 category tools (with emoji)
│   │   │   ├── budgets.py             # 5 budget tools
│   │   │   ├── analytics.py           # 4 analytics tools
│   │   │   └── streaks.py             # 2 streak tools
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── account_service.py     # Account CRUD operations
│   │   │   ├── category_service.py    # Category CRUD operations
│   │   │   ├── transaction_service.py # Transaction CRUD operations
│   │   │   ├── budget_service.py      # Budget CRUD operations
│   │   │   ├── streak_service.py      # Streak tracking
│   │   │   ├── analytics_service.py   # Analytics queries
│   │   │   └── supabase_client.py     # Supabase connection
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── account.py             # Account Pydantic models
│   │   │   ├── category.py            # Category Pydantic models
│   │   │   ├── transaction.py         # Transaction Pydantic models
│   │   │   ├── budget.py              # Budget Pydantic models
│   │   │   └── streak.py              # Streak Pydantic models
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── prompts.py             # System prompts (with personal tone)
│   │       └── helpers.py             # Utility functions
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                # Pytest fixtures
│   │   ├── test_tools_transactions.py
│   │   ├── test_tools_accounts.py
│   │   ├── test_tools_categories.py
│   │   ├── test_tools_budgets.py
│   │   ├── test_tools_analytics.py
│   │   ├── test_tools_streaks.py
│   │   ├── test_services.py
│   │   ├── test_graph.py              # Agent flow tests
│   │   └── test_conversations.py      # E2E conversation tests
│   │
│   ├── supabase/
│   │   └── migrations/
│   │       ├── 001_bilio_schema.sql   # Core tables
│   │       ├── 002_bilio_rls.sql      # Row-level security
│   │       └── 003_bilio_seed.sql     # System categories with emojis
│   │
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Landing/login
│   │   │   └── chat/
│   │   │       └── page.tsx           # Main chat interface
│   │   │
│   │   ├── components/
│   │   │   ├── ChatConversation.tsx   # Message display
│   │   │   ├── ChatInput.tsx          # Text/voice/photo input
│   │   │   ├── ChatMessage.tsx        # Individual message
│   │   │   └── BalanceDisplay.tsx     # Account balances
│   │   │
│   │   ├── hooks/
│   │   │   └── useBilioChat.ts        # WebSocket chat hook
│   │   │
│   │   └── lib/
│   │       └── supabase.ts            # Supabase client
│   │
│   ├── public/
│   ├── package.json
│   └── next.config.js
│
└── docs/
    ├── API.md                          # API documentation
    ├── DEPLOYMENT.md                   # Deployment guide
    └── TESTING.md                      # Testing guide
```

---

## Implementation Phases (TDD Approach)

### Phase 1: Database & Infrastructure (Days 1-2)

**Goal:** Set up database schema and basic infrastructure

**Tasks:**
1. Create Supabase migrations
2. Create Pydantic models
3. Create service layer with Supabase client
4. Write tests for service layer
5. Execute tests and fix issues

**Test Strategy:**
- Unit tests for each service method
- Integration tests with real Supabase (test project)
- Test data fixtures

---

### Phase 2: AI Tools - Transactions (Day 3)

**Goal:** Implement and test transaction tools

**Tasks:**
1. Write tests for `register_transaction` tool
2. Implement `register_transaction` tool
3. Execute tests, fix issues
4. Repeat for: `edit_transaction`, `delete_transaction`, `list_transactions`, `get_transaction_summary`

**Test Cases:**
```python
def test_register_expense():
    """Test registering an expense with category inference"""
    result = register_transaction(
        amount=20.0,
        description="almuerzo",
        transaction_type="expense",
        category="food",  # AI-inferred
        currency="PEN"
    )
    assert result["action"] == "register_transaction"
    assert result["data"]["amount"] == 20.0

def test_register_income():
    """Test registering income"""
    result = register_transaction(
        amount=5000.0,
        description="freelance payment",
        transaction_type="income",
        category="freelance",
        currency="PEN"
    )
    assert result["data"]["transaction_type"] == "income"

def test_register_with_account():
    """Test registering transaction to specific account"""
    result = register_transaction(
        amount=200.0,
        description="hosting",
        transaction_type="expense",
        account="business",
        currency="USD"
    )
    assert result["data"]["account"] == "business"
```

---

### Phase 3: AI Tools - Accounts (Day 4)

**Goal:** Implement and test account tools

**Tasks:**
1. Write tests for `create_account` tool
2. Implement `create_account` tool
3. Execute tests, fix issues
4. Repeat for: `edit_account`, `delete_account`, `list_accounts`, `set_default_account`

**Test Cases:**
```python
def test_create_account():
    """Test creating a new account"""
    result = create_account(
        name="Negocio",
        account_type="business",
        currency="PEN"
    )
    assert result["data"]["name"] == "Negocio"
    assert result["data"]["type"] == "business"

def test_set_default_account():
    """Test changing default account"""
    result = set_default_account(account_name="Negocio")
    assert result["data"]["is_default"] == True

def test_list_accounts():
    """Test listing all accounts with balances"""
    result = list_accounts()
    assert len(result["data"]["accounts"]) > 0
    assert "balance" in result["data"]["accounts"][0]
```

---

### Phase 4: AI Tools - Categories (Day 5)

**Goal:** Implement and test category tools with emoji parameter

**Tasks:**
1. Write tests for `create_category` with emoji
2. Implement `create_category` tool
3. Execute tests, fix issues
4. Repeat for: `edit_category`, `delete_category`, `list_categories`

**Test Cases:**
```python
def test_create_category_with_emoji():
    """Test creating category with emoji parameter"""
    result = create_category(
        name="Matilda",
        emoji="🐶",
        category_type="expense"
    )
    assert result["data"]["name"] == "Matilda"
    assert result["data"]["emoji"] == "🐶"
    assert result["data"]["type"] == "expense"

def test_create_category_validates_emoji():
    """Test that emoji is required"""
    with pytest.raises(ValidationError):
        create_category(
            name="Test",
            emoji="",  # Empty emoji should fail
            category_type="expense"
        )

def test_list_categories_shows_emojis():
    """Test listing categories includes emojis"""
    result = list_categories()
    for category in result["data"]["categories"]:
        assert "emoji" in category
        assert category["emoji"] != ""
```

---

### Phase 5: AI Tools - Budgets (Day 6)

**Goal:** Implement and test budget tools

**Tasks:**
1. Write tests for `create_budget` tool
2. Implement `create_budget` tool
3. Execute tests, fix issues
4. Repeat for: `edit_budget`, `delete_budget`, `list_budgets`, `get_budget_status`

**Test Cases:**
```python
def test_create_budget():
    """Test creating a budget"""
    result = create_budget(
        category="food",
        amount=500.0,
        currency="PEN",
        period="monthly"
    )
    assert result["data"]["amount"] == 500.0
    assert result["data"]["period"] == "monthly"

def test_budget_status_calculation():
    """Test budget status shows correct percentage"""
    # Create budget
    create_budget(category="food", amount=500, period="monthly")
    # Add some expenses
    register_transaction(amount=400, category="food", transaction_type="expense")
    # Check status
    result = get_budget_status(category="food")
    assert result["data"]["spent"] == 400.0
    assert result["data"]["remaining"] == 100.0
    assert result["data"]["percentage_used"] == 80.0
    assert result["data"]["alert"] == True  # 80% threshold

def test_budget_alert_threshold():
    """Test budget alerts at custom threshold"""
    result = create_budget(
        category="transport",
        amount=200,
        alert_threshold=90.0  # Alert at 90%
    )
    # Spend 85% - no alert
    register_transaction(amount=170, category="transport", transaction_type="expense")
    status = get_budget_status(category="transport")
    assert status["data"]["alert"] == False
    # Spend 95% - alert
    register_transaction(amount=20, category="transport", transaction_type="expense")
    status = get_budget_status(category="transport")
    assert status["data"]["alert"] == True
```

---

### Phase 6: AI Tools - Analytics & Streaks (Day 7)

**Goal:** Implement analytics and streak tools

**Tasks:**
1. Write tests for analytics tools
2. Implement `get_spending_analysis`, `get_income_analysis`, `get_category_breakdown`, `get_financial_advice`
3. Write tests for streak tools
4. Implement `get_streak_status`, `update_streak`
5. Execute tests, fix issues

**Test Cases:**
```python
def test_spending_analysis():
    """Test spending analysis by period"""
    result = get_spending_analysis(period="month")
    assert "total_spent" in result["data"]
    assert "by_category" in result["data"]
    assert "by_day" in result["data"]

def test_financial_advice():
    """Test AI provides personalized advice"""
    result = get_financial_advice()
    assert "advice" in result["data"]
    assert len(result["data"]["advice"]) > 0

def test_streak_tracking():
    """Test streak increments on daily transaction"""
    # Day 1
    register_transaction(amount=10, description="test", transaction_type="expense")
    streak1 = get_streak_status()
    assert streak1["data"]["current_streak"] == 1

    # Day 2 (simulate next day)
    register_transaction(amount=10, description="test", transaction_type="expense")
    streak2 = get_streak_status()
    assert streak2["data"]["current_streak"] == 2

def test_streak_breaks():
    """Test streak resets if day is missed"""
    # Simulate missing a day
    streak = get_streak_status()
    assert streak["data"]["current_streak"] == 0
```

---

### Phase 7: LangGraph Agent (Days 8-9)

**Goal:** Build the conversational agent with streaming

**Tasks:**
1. Define `BilioState` TypedDict
2. Create system prompt with personal tone
3. Build LangGraph with tool execution nodes
4. Add streaming support
5. Write conversation flow tests
6. Execute tests, fix issues

**Test Cases:**
```python
def test_agent_registers_expense_from_text():
    """Test agent understands natural language expense"""
    messages = [{"role": "user", "content": "Gasté 20 soles en almuerzo"}]
    result = await graph.ainvoke({"messages": messages, "user_id": "test_user"})

    # Check tool was called
    assert any("register_transaction" in str(msg) for msg in result["messages"])
    # Check response has personal tone
    response = result["messages"][-1].content
    assert any(word in response.lower() for word in ["dale", "perfecto", "genial"])

def test_agent_creates_category_with_emoji():
    """Test agent creates category with emoji from conversation"""
    messages = [{"role": "user", "content": "Crea categoría para los gastos de mi perrita Matilda"}]
    result = await graph.ainvoke({"messages": messages, "user_id": "test_user"})

    # Verify create_category was called with emoji
    tool_calls = [msg for msg in result["messages"] if hasattr(msg, 'tool_calls')]
    assert len(tool_calls) > 0
    category_tool = tool_calls[0].tool_calls[0]
    assert category_tool["name"] == "create_category"
    assert category_tool["args"]["name"] == "Matilda"
    assert category_tool["args"]["emoji"] == "🐶"

def test_agent_personal_tone():
    """Test agent uses personal, conversational tone"""
    messages = [{"role": "user", "content": "Me pagaron 5000 de freelance"}]
    result = await graph.ainvoke({"messages": messages, "user_id": "test_user"})

    response = result["messages"][-1].content.lower()
    # Check for personal expressions
    personal_words = ["dale", "perfecto", "genial", "vamos", "sigue así"]
    assert any(word in response for word in personal_words)

def test_streaming_response():
    """Test agent streams responses"""
    messages = [{"role": "user", "content": "¿Cómo voy con mi presupuesto?"}]
    chunks = []

    async for chunk in graph.astream({"messages": messages, "user_id": "test_user"}):
        chunks.append(chunk)

    assert len(chunks) > 1  # Should stream multiple chunks
```

---

### Phase 8: FastAPI Backend (Days 10-11)

**Goal:** Create REST API and WebSocket endpoints

**Tasks:**
1. Create FastAPI app with CORS
2. Add authentication middleware
3. Create WebSocket endpoint for chat
4. Create HTTP endpoints for WhatsApp
5. Add file upload endpoint (receipts)
6. Write API tests
7. Execute tests, fix issues

**Test Cases:**
```python
@pytest.mark.asyncio
async def test_websocket_chat(client):
    """Test WebSocket chat connection and streaming"""
    async with client.websocket_connect(f"/ws/test_thread/test_user") as ws:
        # Send message
        await ws.send_json({
            "type": "message",
            "content": "Gasté 20 soles en almuerzo"
        })

        # Receive streaming response
        chunks = []
        while True:
            data = await ws.receive_json()
            chunks.append(data)
            if data.get("type") == "end":
                break

        assert len(chunks) > 0
        assert any("dale" in chunk.get("content", "").lower() for chunk in chunks)

def test_whatsapp_webhook(client):
    """Test WhatsApp webhook endpoint"""
    response = client.post("/webhook/whatsapp", json={
        "From": "whatsapp:+51999999999",
        "Body": "Gasté 30 soles en taxi"
    })
    assert response.status_code == 200
    assert "TwiML" in response.text or "message" in response.json()

def test_receipt_upload(client):
    """Test receipt photo upload and OCR"""
    files = {"file": ("receipt.jpg", b"fake_image_data", "image/jpeg")}
    response = client.post("/api/receipts/upload", files=files)

    assert response.status_code == 200
    data = response.json()
    assert "amount" in data
    assert "merchant" in data
    assert "category" in data
```

---

### Phase 9: Frontend - Basic Chat UI (Days 12-13)

**Goal:** Create simple chat interface like JOURNI

**Tasks:**
1. Set up Next.js project
2. Create chat page with WebSocket
3. Add message display component
4. Add input component (text/voice/photo)
5. Add balance display
6. Write UI tests
7. Execute tests, fix issues

**Test Cases:**
```typescript
describe('BilioChat', () => {
  it('connects to WebSocket and sends message', async () => {
    render(<ChatPage />);

    const input = screen.getByPlaceholderText(/escribe un mensaje/i);
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    fireEvent.change(input, { target: { value: 'Gasté 20 soles en almuerzo' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/dale/i)).toBeInTheDocument();
    });
  });

  it('displays streamed response in real-time', async () => {
    render(<ChatPage />);

    // Send message
    const input = screen.getByPlaceholderText(/escribe un mensaje/i);
    fireEvent.change(input, { target: { value: '¿Cómo voy?' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    // Should show streaming indicator
    expect(screen.getByText(/escribiendo/i)).toBeInTheDocument();

    // Should eventually show full response
    await waitFor(() => {
      expect(screen.getByText(/balance/i)).toBeInTheDocument();
    });
  });

  it('shows account balances', () => {
    render(<BalanceDisplay accounts={mockAccounts} />);

    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('1,230 PEN')).toBeInTheDocument();
  });
});
```

---

### Phase 10: Integration Testing (Day 14)

**Goal:** End-to-end testing with all components

**Tasks:**
1. Write E2E tests for full user flows
2. Test all example conversations from requirements
3. Test multi-account flows
4. Test budget alerts
5. Test streak tracking
6. Execute tests, fix issues

**Test Cases:**
```python
@pytest.mark.e2e
async def test_full_user_journey():
    """Test complete user journey from signup to budgeting"""
    # 1. User signs up
    user = await create_test_user()

    # 2. First transaction
    response = await send_message(user.id, "Gasté 20 soles en almuerzo")
    assert "Dale!" in response
    assert "🍔" in response

    # 3. Create custom category
    response = await send_message(user.id, "Crea categoría para gastos de mi perrita Matilda")
    assert "Matilda" in response
    assert "🐶" in response
    assert "presupuesto" in response.lower()

    # 4. Set budget
    response = await send_message(user.id, "100 soles")
    assert "Perfecto" in response
    assert "100 PEN/mes para Matilda" in response

    # 5. Add expense to custom category
    response = await send_message(user.id, "Compré comida para Matilda 45 soles")
    assert "Matilda" in response

    # 6. Check budget status
    response = await send_message(user.id, "¿Cómo voy con el presupuesto de Matilda?")
    assert "45/100" in response
    assert "45%" in response

@pytest.mark.e2e
async def test_personal_tone_consistency():
    """Test agent maintains personal tone throughout conversation"""
    responses = []

    # Multiple interactions
    messages = [
        "Gasté 20 soles",
        "Me pagaron 5000",
        "Crea cuenta para negocio",
        "¿Cómo voy?",
    ]

    for msg in messages:
        response = await send_message("test_user", msg)
        responses.append(response)

    # Check all responses use personal tone
    personal_indicators = ["dale", "perfecto", "genial", "vamos", "sigue"]
    for response in responses:
        assert any(word in response.lower() for word in personal_indicators)
```

---

## Testing Strategy

### Test Pyramid

```
                  /\
                 /  \
                /    \
               /  E2E \          ~ 10% (Full user flows)
              /________\
             /          \
            /Integration \       ~ 30% (Service + DB, API)
           /______________\
          /                \
         /   Unit Tests     \    ~ 60% (Tools, Services, Utils)
        /____________________\
```

### Test Coverage Goals

- **Unit Tests:** 90%+ coverage
  - All AI tools
  - All service methods
  - Utility functions

- **Integration Tests:** 80%+ coverage
  - Service layer with real Supabase
  - API endpoints
  - Agent graph execution

- **E2E Tests:** Critical paths
  - Example conversations from requirements
  - Multi-account flows
  - Budget tracking
  - Streak maintenance

### Test Execution Plan

**For Each Module:**
1. ✅ Write tests FIRST (TDD)
2. ✅ Run tests (expect failures)
3. ✅ Implement code
4. ✅ Run tests again
5. ✅ Fix issues until all tests pass
6. ✅ Refactor if needed
7. ✅ Move to next module

---

## Database Schema (Supabase)

### Migration 001: Core Tables

```sql
-- accounts
CREATE TABLE accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('personal', 'business', 'family', 'custom')),
  currency TEXT NOT NULL DEFAULT 'PEN',
  color TEXT,
  icon TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- categories
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,  -- REQUIRED
  category_type TEXT NOT NULL CHECK (category_type IN ('expense', 'income', 'both')),
  parent_category_id BIGINT REFERENCES categories(id),
  color TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- transactions
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  description TEXT NOT NULL,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- budgets
CREATE TABLE budgets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id BIGINT REFERENCES accounts(id),
  category_id BIGINT NOT NULL REFERENCES categories(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly', 'custom')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  alert_threshold DECIMAL(5, 2) DEFAULT 80.0,
  rollover BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- streaks
CREATE TABLE streaks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  streak_type TEXT NOT NULL DEFAULT 'daily_tracking',
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_settings
CREATE TABLE user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  default_account_id BIGINT REFERENCES accounts(id),
  default_currency TEXT DEFAULT 'PEN',
  language TEXT DEFAULT 'es',
  avatar_config JSONB DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 002: RLS Policies

```sql
-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for accounts
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- Policies for categories
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id OR is_system = true);
CREATE POLICY "Users can create own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Policies for transactions (similar pattern)
-- Policies for budgets (similar pattern)
-- Policies for streaks (similar pattern)
-- Policies for user_settings (similar pattern)
```

### Migration 003: Seed Data

```sql
-- System categories with emojis
INSERT INTO categories (user_id, name, emoji, category_type, is_system) VALUES
  (NULL, 'Food', '🍔', 'expense', TRUE),
  (NULL, 'Transport', '🚗', 'expense', TRUE),
  (NULL, 'Housing', '🏠', 'expense', TRUE),
  (NULL, 'Shopping', '🛍️', 'expense', TRUE),
  (NULL, 'Entertainment', '🎬', 'expense', TRUE),
  (NULL, 'Health', '💊', 'expense', TRUE),
  (NULL, 'Education', '📚', 'expense', TRUE),
  (NULL, 'Personal Care', '💄', 'expense', TRUE),
  (NULL, 'Subscriptions', '📱', 'expense', TRUE),
  (NULL, 'Pets', '🐕', 'expense', TRUE),
  (NULL, 'Travel', '✈️', 'expense', TRUE),
  (NULL, 'Other', '📊', 'expense', TRUE),
  (NULL, 'Salary', '💰', 'income', TRUE),
  (NULL, 'Freelance', '💼', 'income', TRUE),
  (NULL, 'Side Hustle', '🎯', 'income', TRUE),
  (NULL, 'Investments', '💹', 'income', TRUE),
  (NULL, 'Gifts', '🎁', 'income', TRUE),
  (NULL, 'Other Income', '📈', 'income', TRUE);
```

---

## Development Workflow

### Daily Cycle

**Morning:**
1. Review todo list
2. Pick next module
3. Write tests for module
4. Run tests (expect red)

**Afternoon:**
5. Implement code
6. Run tests (fix until green)
7. Refactor if needed
8. Update todo list

**Evening:**
9. Commit code
10. Update progress in markdown
11. Plan next day

### Git Workflow

```bash
# Feature branch per module
git checkout -b feature/transaction-tools
# Commit tests first
git add tests/test_tools_transactions.py
git commit -m "test: add transaction tool tests"
# Commit implementation
git add app/tools/transactions.py
git commit -m "feat: implement transaction tools"
# Merge when all tests pass
git checkout main
git merge feature/transaction-tools
```

---

## Success Criteria

**Definition of Done for Each Module:**
- ✅ All tests written and passing
- ✅ Code coverage > 90%
- ✅ Type hints on all functions
- ✅ Docstrings on all public functions
- ✅ No linting errors
- ✅ Manual testing completed

**Final Acceptance Criteria:**
- ✅ All 25 AI tools implemented and tested
- ✅ Agent responds with personal tone
- ✅ Emoji parameter works in category creation
- ✅ Streaming responses work
- ✅ WhatsApp integration ready
- ✅ All example conversations from requirements pass
- ✅ Basic UI functional

---

**Status:** Ready to start Phase 1
**Next Task:** Set up backend folder structure and database migrations
