# Bilio AI - Migration Plan from JOURNI
## Comprehensive Analysis & Architecture Design

**Date:** December 2, 2025
**From:** JOURNI (Group Travel Expense Tracker)
**To:** Bilio (Personal Finance Management)

---

## Executive Summary

This document provides a comprehensive migration plan from JOURNI (group travel expense tracking) to Bilio (personal finance management). While both systems share core expense tracking functionality, Bilio shifts focus from group collaboration to personal financial management with **multi-account architecture**, **category-based budgeting**, and **gamification features**.

**Key Changes:**
- Remove: Photo albums, milestones, locations, group trip features
- Keep: AI agent architecture, expense tracking core, multi-currency support
- Add: Accounts system, budgets, categories, income tracking, streak system

---

## 1. Current System Analysis: JOURNI

### 1.1 AI Agent Architecture

**Agent:** LangGraph-based conversational AI
**Model Hierarchy:** GPT-4o (primary) → GPT-4o-mini → Claude Sonnet → Gemini Flash
**State Management:** PostgreSQL checkpointer for conversation persistence

**12 AI Tools (Current):**

**Expense Management (7 tools):**
1. `register_expense` - Register new expense with split options
2. `edit_expense` - Modify existing expense
3. `delete_expense` - Remove expense
4. `list_expenses` - List all expenses
5. `get_balance` - Check balances (multi-currency)
6. `get_debts` - Calculate optimized debt settlements
7. `register_payment` - Log direct payments between users

**Photo/Memory Management (5 tools):**
8. `create_milestone` - Create trip moment/location
9. `edit_milestone` - Modify milestone
10. `delete_milestone` - Remove milestone
11. `register_photo` - Save analyzed photo with AI metadata
12. `view_photos` - Retrieve and view stored photos

### 1.2 Database Schema (8 Tables)

**Core Tables:**
1. `users` - User profiles (extends Supabase Auth)
2. `trips` - Trip sessions with unique codes
3. `trip_participants` - Many-to-many user-trip relationship
4. `expenses` - Expense records with multi-currency
5. `expense_splits` - How expenses are divided
6. `chat_messages` - Conversation history
7. `photos` - Photo metadata with AI analysis
8. `locations` - Visited places with coordinates
9. `milestones` - Trip moments for grouping photos

**Key Features:**
- Multi-currency: PEN, USD, EUR, CLP, ARS, BRL, COP
- Row-Level Security (RLS) policies
- Automatic timestamps and triggers
- Optimized debt calculation with greedy algorithm
- Support for equal AND unequal expense splits

### 1.3 Current State Structure

```python
class JourniState(TypedDict):
    messages: list                          # Chat history
    expenses: list[Expense]                 # All expenses
    payments: list[Payment]                 # Direct payments
    participants: list[str]                 # Trip members
    balances: dict[str, dict[str, float]]  # {person: {currency: amount}}
    session_name: str                       # Trip name
    session_context: dict                   # Runtime context
    milestones: list[Milestone]             # Trip moments
    photos: list[Photo]                     # Photo metadata
```

---

## 2. Bilio AI Requirements

### 2.1 Core Functionality

**Personal Finance Management:**
- Register **income** and **expenses** (not just expenses)
- Multi-account system (personal, business, family, custom)
- Dynamic account creation by AI
- Customizable categories with budgets
- Multi-currency per transaction
- Natural language processing (text + audio + image)

**Features from CEO Notes:**

**Transaction Management:**
- Amount, category, currency, description
- Support all transaction types: income, outcome

**Visualization:**
- Consumption patterns by category
- Time period analysis
- Budget tracking

**AI Chat Interface:**
- Text input: "gasté 20 soles en almuerzo"
- Audio input: Voice commands
- Image input: Receipt scanning with OCR
- Financial advice based on spending patterns

**Gamification:**
- Streak system (tracking consistency)
- Avatar customization (clothes, accessories)
- Progress visualization

**Widgets:**
- Streak display (Duolingo-style)
- Quick audio registration button
- Quick text registration input

### 2.2 Account System

**Multi-Account Architecture:**
- Each user has multiple accounts
- Default account for quick operations
- Account types: personal, business, family, custom
- AI can create accounts dynamically
- Each account has independent budgets

**Example Usage:**
- "Register 50 soles for lunch on Solace" → uses default account
- "Add business expense of $200 for software" → uses business account
- "Create family account for household expenses" → creates new account

### 2.3 Category & Budget System

**Categories:**
- User-defined categories (e.g., "dog expenses", "groceries", "rent")
- AI-suggested categories based on description
- Hierarchical categories (optional: parent → child)
- Each category can have budget limits

**Budgets:**
- Per category, per account
- Time-based: monthly, weekly, custom period
- Alert system when approaching/exceeding budget
- Budget rollover options

---

## 3. Migration Strategy

### 3.1 What to REMOVE

**Tables to Remove:**
- `trips` - No group travel concept
- `trip_participants` - No group members
- `photos` - No photo album feature
- `locations` - No location tracking
- `milestones` - No trip moments
- `chat_messages` - Replaced with personal conversation history

**AI Tools to Remove:**
- `create_milestone`
- `edit_milestone`
- `delete_milestone`
- `list_milestones`
- `register_photo`
- `edit_photo`
- `delete_photo`
- `list_photos`
- `view_photos`

**State Fields to Remove:**
- `milestones`
- `photos`
- `participants` (replaced with accounts)
- `session_name` (replaced with account context)

### 3.2 What to KEEP

**Core Infrastructure:**
- ✅ LangGraph agent architecture
- ✅ FastAPI backend with WebSocket
- ✅ Supabase authentication & database
- ✅ Multi-currency support
- ✅ Balance calculation logic
- ✅ Natural language processing
- ✅ Image analysis for receipts (GPT-4o vision)
- ✅ Streaming responses

**AI Tools to Adapt:**
- `register_expense` → Modify for income/expense + account selection
- `edit_expense` → Keep with account awareness
- `delete_expense` → Keep with account awareness
- `list_expenses` → Filter by account
- `get_balance` → Per account balance
- `get_debts` → Remove (no group debts in personal finance)
- `register_payment` → Remove (no inter-user payments)

### 3.3 What to ADD

**New Database Tables:**

1. **`accounts`** - User's financial accounts
```sql
- id (BIGSERIAL PRIMARY KEY)
- user_id (UUID FK to users)
- name (TEXT) - "Personal", "Business", "Family"
- account_type (TEXT) - "personal", "business", "family", "custom"
- currency (TEXT) - Default currency for account
- color (TEXT) - UI color code
- icon (TEXT) - UI icon name
- is_default (BOOLEAN)
- is_archived (BOOLEAN)
- created_at, updated_at
```

2. **`categories`** - Expense/income categories
```sql
- id (BIGSERIAL PRIMARY KEY)
- user_id (UUID FK to users)
- name (TEXT) - "Food", "Transport", "Matilda"
- emoji (TEXT) - "🍔", "🚗", "🐶" (REQUIRED)
- category_type (TEXT) - "expense", "income", "both"
- parent_category_id (BIGINT nullable FK to categories) - For subcategories
- color (TEXT)
- is_system (BOOLEAN) - System-provided vs user-created
- created_at, updated_at
```

3. **`transactions`** - All financial transactions
```sql
- id (BIGSERIAL PRIMARY KEY)
- user_id (UUID FK to users)
- account_id (BIGINT FK to accounts)
- category_id (BIGINT FK to categories)
- transaction_type (TEXT) - "income", "expense"
- amount (DECIMAL)
- currency (TEXT)
- description (TEXT)
- transaction_date (TIMESTAMP)
- receipt_url (TEXT nullable) - For receipt images
- notes (TEXT nullable)
- created_at, updated_at
```

4. **`budgets`** - Budget limits per category
```sql
- id (BIGSERIAL PRIMARY KEY)
- user_id (UUID FK to users)
- account_id (BIGINT FK to accounts)
- category_id (BIGINT FK to categories)
- amount (DECIMAL)
- currency (TEXT)
- period_type (TEXT) - "weekly", "monthly", "yearly", "custom"
- period_start (DATE)
- period_end (DATE)
- rollover (BOOLEAN) - Carry unused budget to next period
- alert_threshold (DECIMAL) - % to trigger alert
- is_active (BOOLEAN)
- created_at, updated_at
```

5. **`streaks`** - User tracking streaks
```sql
- id (BIGSERIAL PRIMARY KEY)
- user_id (UUID FK to users)
- streak_type (TEXT) - "daily_tracking", "budget_adherence"
- current_streak (INT)
- longest_streak (INT)
- last_activity_date (DATE)
- created_at, updated_at
```

6. **`user_settings`** - User preferences
```sql
- id (BIGSERIAL PRIMARY KEY)
- user_id (UUID FK to users)
- default_account_id (BIGINT FK to accounts)
- default_currency (TEXT)
- avatar_config (JSONB) - Avatar customization data
- notification_preferences (JSONB)
- theme (TEXT)
- created_at, updated_at
```

**New AI Tools (CRUDs):**

**Transaction Management:**
1. `register_transaction` - Register income or expense
2. `edit_transaction` - Modify transaction
3. `delete_transaction` - Remove transaction
4. `list_transactions` - List with filters (account, category, date range)
5. `get_transaction_summary` - Aggregated statistics

**Account Management:**
6. `create_account` - Create new account
7. `edit_account` - Modify account details
8. `delete_account` - Archive/delete account
9. `list_accounts` - Show all accounts
10. `set_default_account` - Change default account

**Category Management:**
11. `create_category` - Create custom category
12. `edit_category` - Modify category
13. `delete_category` - Remove category
14. `list_categories` - Show all categories

**Budget Management:**
15. `create_budget` - Set budget for category
16. `edit_budget` - Modify budget
17. `delete_budget` - Remove budget
18. `list_budgets` - Show all budgets
19. `get_budget_status` - Check budget usage

**Analytics & Insights:**
20. `get_spending_analysis` - Analyze spending patterns
21. `get_income_analysis` - Analyze income sources
22. `get_category_breakdown` - Spending by category
23. `get_financial_advice` - AI-powered recommendations

**Streak Management:**
24. `get_streak_status` - Current streak information
25. `update_streak` - Manual streak update (for admin)

---

## 4. New Database Schema

### 4.1 Entity Relationship Diagram

```
┌─────────────┐
│   users     │ (Supabase Auth extension)
│   (base)    │
└──────┬──────┘
       │
       ├────────────────┬────────────────┬─────────────────┐
       │                │                │                 │
┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼─────┐  ┌──────▼────────┐
│  accounts   │  │ categories  │  │  streaks  │  │ user_settings │
│             │  │             │  │           │  │               │
│ - personal  │  │ - food      │  │ - daily   │  │ - defaults    │
│ - business  │  │ - transport │  │ - longest │  │ - avatar      │
│ - family    │  │ - dog       │  └───────────┘  └───────────────┘
└──────┬──────┘  └──────┬──────┘
       │                │
       │         ┌──────▼──────┐
       │         │   budgets   │◄────── links account + category
       │         │             │
       │         │ - monthly   │
       │         │ - limits    │
       │         └─────────────┘
       │
┌──────▼──────────┐
│  transactions   │
│                 │
│ - income        │
│ - expense       │
│ - multi-currency│
└─────────────────┘
```

### 4.2 Key Relationships

- `users` 1:N `accounts` - One user, many accounts
- `users` 1:N `categories` - User-defined categories
- `users` 1:N `transactions` - All user transactions
- `accounts` 1:N `transactions` - Transactions belong to account
- `categories` 1:N `transactions` - Categorized transactions
- `accounts` + `categories` → `budgets` - Budget per account-category
- `users` 1:1 `user_settings` - User preferences

### 4.3 Sample Queries

**Get account balance:**
```sql
SELECT
  a.name as account_name,
  t.currency,
  SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE -t.amount END) as balance
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id
WHERE a.user_id = $1
GROUP BY a.id, a.name, t.currency
ORDER BY a.is_default DESC, a.name;
```

**Check budget status:**
```sql
SELECT
  c.name as category_name,
  b.amount as budget_limit,
  b.currency,
  COALESCE(SUM(t.amount), 0) as spent,
  (b.amount - COALESCE(SUM(t.amount), 0)) as remaining,
  (COALESCE(SUM(t.amount), 0) / b.amount * 100) as percentage_used
FROM budgets b
JOIN categories c ON b.category_id = c.id
LEFT JOIN transactions t ON
  t.category_id = c.id
  AND t.account_id = b.account_id
  AND t.transaction_type = 'expense'
  AND t.transaction_date >= b.period_start
  AND t.transaction_date <= b.period_end
WHERE b.user_id = $1 AND b.is_active = true
GROUP BY b.id, c.name, b.amount, b.currency;
```

---

## 5. New AI Agent Architecture

### 5.1 Updated State Structure

```python
class BilioState(TypedDict):
    """State for Bilio personal finance agent."""
    messages: list                                    # Chat history
    user_id: str                                      # Current user
    transactions: list[Transaction]                   # Recent transactions
    accounts: list[Account]                           # User's accounts
    categories: list[Category]                        # Available categories
    budgets: list[Budget]                            # Active budgets
    current_account: Optional[str]                   # Context: active account
    balance_summary: dict[str, dict[str, float]]     # {account: {currency: balance}}
    streak_info: dict                                 # Streak statistics
    session_context: dict                            # Runtime metadata
```

### 5.2 Transaction Tool Design

**Primary Tool: `register_transaction`**

```python
@tool
def register_transaction(
    amount: float,
    description: str,
    transaction_type: Literal["income", "expense"],
    category: Optional[str] = None,
    account: Optional[str] = None,
    currency: Optional[str] = None,
    transaction_date: Optional[str] = None
) -> str:
    """
    Register a financial transaction (income or expense).

    Args:
        amount: Transaction amount (positive number)
        description: What the transaction was for
        transaction_type: "income" or "expense"
        category: Category name (e.g., "food", "salary", "dog")
        account: Account name (uses default if not specified)
        currency: Currency code (uses account default if not specified)
        transaction_date: Date of transaction (ISO format, defaults to now)

    Examples:
        - "Gasté 20 soles en almuerzo"
          → register_transaction(20, "almuerzo", "expense", category="food", currency="PEN")

        - "Me pagaron 5000 de freelance en mi cuenta business"
          → register_transaction(5000, "freelance", "income", account="business", currency="PEN")

        - "Comida para el perro 45 soles"
          → register_transaction(45, "comida para perro", "expense", category="dog", currency="PEN")

    Returns:
        JSON with action and transaction data
    """
```

### 5.3 Account Management Tools

**CRUD for Accounts:**

```python
@tool
def create_account(
    name: str,
    account_type: Literal["personal", "business", "family", "custom"] = "personal",
    currency: str = "PEN",
    set_as_default: bool = False
) -> str:
    """Create a new financial account dynamically."""

@tool
def list_accounts(include_archived: bool = False) -> str:
    """List all user accounts with current balances."""

@tool
def set_default_account(account_name: str) -> str:
    """Change which account is used by default."""

@tool
def edit_account(
    account_name: str,
    new_name: Optional[str] = None,
    new_currency: Optional[str] = None
) -> str:
    """Modify account details."""
```

### 5.4 Category Management Tools

```python
@tool
def create_category(
    name: str,
    emoji: str,
    category_type: Literal["expense", "income", "both"] = "expense",
    parent_category: Optional[str] = None
) -> str:
    """
    Create custom category for organizing transactions.

    Args:
        name: Category name (e.g., "Matilda", "Motorcycle")
        emoji: Emoji for the category (e.g., "🐶", "🏍️") - REQUIRED
        category_type: Type of category
        parent_category: Optional parent for subcategories

    Examples:
        - "Crea categoría para los gastos de mi perrita Matilda"
          → create_category(name="Matilda", emoji="🐶", category_type="expense")

        - "Add category for freelance income"
          → create_category(name="Freelance", emoji="💼", category_type="income")
    """

@tool
def list_categories(category_type: Optional[str] = None) -> str:
    """List all available categories, optionally filtered."""
```

### 5.5 Budget Management Tools

```python
@tool
def create_budget(
    category: str,
    amount: float,
    currency: str = "PEN",
    period: Literal["weekly", "monthly", "yearly"] = "monthly",
    account: Optional[str] = None
) -> str:
    """
    Set a budget limit for a category.

    Examples:
        - "Set budget of 500 soles monthly for food"
          → create_budget("food", 500, "PEN", "monthly")
    """

@tool
def get_budget_status(
    category: Optional[str] = None,
    account: Optional[str] = None
) -> str:
    """
    Check budget usage and remaining amounts.

    Shows how much has been spent vs budget limit.
    """
```

### 5.6 Analytics Tools

```python
@tool
def get_spending_analysis(
    period: Literal["week", "month", "year", "all"] = "month",
    account: Optional[str] = None
) -> str:
    """Analyze spending patterns by category and time."""

@tool
def get_financial_advice() -> str:
    """
    Get AI-powered financial recommendations based on:
    - Spending patterns
    - Budget adherence
    - Income vs expenses
    - Category trends
    """
```

### 5.7 System Prompt for Bilio

```python
BILIO_SYSTEM_PROMPT = """Eres Bilio, un asistente de finanzas personales amigable y motivador.

CONTEXTO DEL USUARIO:
- Usuario: {user_name}
- Cuenta activa: {current_account}
- Cuentas disponibles: {accounts}
- Racha actual: {current_streak} días

Tu trabajo es:
1. Ayudar al usuario a registrar ingresos y gastos con lenguaje natural
2. Gestionar múltiples cuentas (personal, negocio, familia)
3. Crear y monitorear presupuestos por categoría
4. Dar consejos financieros personalizados
5. Mantener al usuario motivado con su racha de registro

SISTEMA DE CUENTAS:
- El usuario puede tener múltiples cuentas
- Si no especifica cuenta, usa la cuenta por defecto
- Puedes crear cuentas dinámicamente cuando el usuario lo solicite

REGISTRO DE TRANSACCIONES:
- Detecta si es INGRESO o GASTO del contexto
- Infiere la categoría automáticamente (comida, transporte, salario, etc.)
- Pregunta por detalles solo si son ambiguos
- Recuerda la moneda del usuario (PEN por defecto, pero adapta según contexto)

MONEDAS:
- Detecta la moneda del contexto geográfico o símbolos
- Soporta: PEN (soles), USD (dólares), EUR (euros), CLP, ARS, BRL, COP
- Si el usuario dice "soles" o "S/" → PEN
- Mantén consistencia dentro de la misma cuenta

PRESUPUESTOS:
- Alerta al usuario si se acerca o excede un presupuesto
- Celebra cuando mantiene el presupuesto bajo control
- Sugiere ajustes basados en patrones de gasto

CATEGORÍAS:
- Usa categorías existentes cuando sea posible
- Crea nuevas categorías si el usuario lo pide explícitamente
- Categorías comunes: comida, transporte, entretenimiento, salud, educación, hogar

MOTIVACIÓN Y RACHA:
- Celebra cuando el usuario registra transacciones consistentemente
- Recuérdales su racha para mantenerlos motivados
- Usa emojis ocasionalmente para hacer la experiencia más amena 🎉

TONO PERSONAL Y CONVERSACIONAL:
- Usa lenguaje casual y amigable: "Dale", "Perfecto", "Genial", "¡Vamos!", "le ponemos"
- Reconoce nombres específicos del usuario (mascotas, cuentas personalizadas)
- Ejemplo: "Dale! Creé la categoría 'Matilda' 🐶, ¿cuánto presupuesto le ponemos mensual?"
- Evita respuestas robóticas o formales

ENTRADA DE IMÁGENES:
- Si el usuario sube una foto de recibo/boleta, analízala para extraer:
  * Monto total
  * Fecha (si es visible)
  * Lugar/comercio
  * Categoría sugerida
- Confirma los datos extraídos antes de registrar

EJEMPLOS:
- "Gasté 20 soles en almuerzo" → expense, 20, PEN, category="food"
- "Me pagaron 5000 por el freelance" → income, 5000, PEN, category="freelance"
- "Compré comida para el perro 45 soles" → expense, 45, PEN, category="dog"
- "Registra 200 dólares en mi cuenta business" → expense, 200, USD, account="business"
- "¿Cuánto llevo gastado en comida este mes?" → get_spending_analysis(category="food")

Responde de forma breve y amigable (1-2 oraciones). NO muestres JSON, solo texto natural.
"""
```

---

## 6. Implementation Roadmap

### Phase 1: Database Migration (Week 1)

**Tasks:**
1. Create new tables: `accounts`, `categories`, `transactions`, `budgets`, `streaks`, `user_settings`
2. Create indexes for performance
3. Implement RLS policies for all new tables
4. Create database views for common queries (account balances, budget status)
5. Write migration scripts to clean up old JOURNI tables
6. Create seed data for system categories

**Deliverables:**
- SQL migration files (001_bilio_schema.sql, 002_bilio_rls.sql, 003_bilio_views.sql)
- Database testing scripts
- Rollback procedures

### Phase 2: Backend API & Services (Week 2)

**Tasks:**
1. Create new service classes:
   - `AccountService` - CRUD for accounts
   - `CategoryService` - CRUD for categories
   - `TransactionService` - CRUD for transactions
   - `BudgetService` - CRUD for budgets
   - `StreakService` - Manage tracking streaks
   - `AnalyticsService` - Spending analysis & insights

2. Update `graph.py`:
   - Replace `JourniState` with `BilioState`
   - Remove photo/milestone tools
   - Implement 25 new AI tools
   - Update system prompt to Bilio

3. Update `main.py`:
   - Remove group trip WebSocket logic
   - Implement personal chat endpoint
   - Add receipt OCR endpoint
   - Add audio transcription endpoint (Whisper)

**Deliverables:**
- Service layer code
- Updated agent graph
- API endpoint documentation
- Unit tests for services

### Phase 3: AI Agent Implementation (Week 3)

**Tasks:**
1. Implement all 25 AI tools with proper error handling
2. Create context-aware account selection logic
3. Implement smart category inference
4. Add budget alerts in tool responses
5. Implement financial advice generation
6. Add streak tracking logic
7. Test conversational flows extensively

**Key Features:**
- Natural language understanding for income vs expense
- Automatic currency detection
- Smart category suggestions
- Budget warnings in real-time
- Streak celebrations

**Deliverables:**
- Complete tool implementations
- Conversation flow tests
- Agent behavior documentation

### Phase 4: Frontend Integration (Week 4)

**Tasks:**
1. Create account management UI
2. Create category/budget management UI
3. Update transaction list to show account context
4. Add budget status visualization
5. Implement streak display widget
6. Add avatar customization UI
7. Create analytics dashboard with charts
8. Implement widgets for quick actions

**Deliverables:**
- Account switcher component
- Budget progress bars
- Streak display (Duolingo-style)
- Quick-add transaction widgets
- Spending charts by category

### Phase 5: Testing & Polish (Week 5)

**Tasks:**
1. End-to-end testing of all flows
2. Performance optimization
3. Security audit
4. User acceptance testing
5. Documentation updates
6. Deployment preparation

---

## 7. Data Migration Strategy

### 7.1 User Data Preservation

**What to Keep:**
- User accounts (Supabase Auth)
- User profiles (names, emails, avatars)

**What to Discard:**
- All trip data (no equivalent in Bilio)
- All photo data
- All location data
- Group relationships

### 7.2 Migration Script Outline

```python
async def migrate_journi_to_bilio():
    """
    Migrate existing JOURNI users to Bilio.

    Steps:
    1. For each user in users table:
       a. Create default "Personal" account
       b. Create system categories (food, transport, etc.)
       c. Initialize user_settings with defaults
       d. Initialize streak record

    2. Archive old tables (don't delete):
       - Rename trips → trips_archived
       - Rename expenses → expenses_archived
       - Keep for reference/audit

    3. Send welcome email to users about migration
    """
```

### 7.3 Rollback Plan

If migration fails:
1. Restore from database backup (taken before migration)
2. Revert code to previous version
3. Keep old tables available for 90 days
4. Provide data export tool for users

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Test Coverage:**
- All 25 AI tools
- Service layer methods (CRUD operations)
- Balance calculation logic
- Budget status calculations
- Streak tracking logic
- Category inference

**Example Test Cases:**

```python
# Test transaction registration
def test_register_expense_with_category():
    """Test that expenses are categorized correctly."""
    response = register_transaction(
        amount=50.0,
        description="Almuerzo en restaurante",
        transaction_type="expense",
        category="food",
        currency="PEN"
    )
    assert response["action"] == "register_transaction"
    assert response["data"]["category"] == "food"

# Test multi-account balance
def test_account_balance_calculation():
    """Test balance across multiple accounts."""
    # Setup: Add transactions to different accounts
    # Assert: Each account shows correct balance

# Test budget alerts
def test_budget_threshold_alert():
    """Test that budget warnings trigger at 80%."""
    # Setup: Create budget, add transactions
    # Assert: Alert appears when 80% spent
```

### 8.2 Integration Tests

**Scenarios to Test:**
1. User creates account → registers transaction → checks balance
2. User sets budget → exceeds budget → receives alert
3. User uploads receipt → AI extracts data → confirms → saves
4. User asks for advice → AI analyzes patterns → provides recommendations
5. User maintains streak → skips day → streak resets
6. User switches accounts → transactions isolated correctly

### 8.3 Conversation Flow Tests

Test natural language understanding:

```python
test_cases = [
    {
        "input": "gasté 20 soles en almuerzo",
        "expected_tool": "register_transaction",
        "expected_type": "expense",
        "expected_amount": 20,
        "expected_currency": "PEN",
        "expected_category": "food"
    },
    {
        "input": "me pagaron 5000 de mi trabajo",
        "expected_tool": "register_transaction",
        "expected_type": "income",
        "expected_amount": 5000,
        "expected_category": "salary"
    },
    {
        "input": "crea una cuenta para mi negocio",
        "expected_tool": "create_account",
        "expected_account_type": "business"
    },
    {
        "input": "cuánto gasté en comida este mes",
        "expected_tool": "get_spending_analysis",
        "expected_category": "food",
        "expected_period": "month"
    }
]
```

---

## 9. Security Considerations

### 9.1 Row-Level Security (RLS)

**Policy Requirements:**
- Users can only see their own accounts
- Users can only access their own transactions
- Users can only manage their own categories and budgets
- No cross-user data leakage

**Sample RLS Policy:**

```sql
-- Accounts: Users can only see their own
CREATE POLICY "Users can view own accounts"
ON accounts FOR SELECT
USING (auth.uid() = user_id);

-- Transactions: Users can only see their own
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Budgets: Users can only manage their own
CREATE POLICY "Users can manage own budgets"
ON budgets FOR ALL
USING (auth.uid() = user_id);
```

### 9.2 API Security

- All endpoints require authentication
- Rate limiting on AI agent calls
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS prevention on user-generated content

### 9.3 Data Privacy

- No sharing of financial data between users
- Encryption at rest (Supabase default)
- Encryption in transit (HTTPS)
- Receipt images stored in private buckets
- GDPR-compliant data export/deletion

---

## 10. Performance Optimization

### 10.1 Database Indexes

**Critical Indexes:**
```sql
-- Transaction queries by user and date
CREATE INDEX idx_transactions_user_date
ON transactions(user_id, transaction_date DESC);

-- Account balance aggregation
CREATE INDEX idx_transactions_account_type
ON transactions(account_id, transaction_type, currency);

-- Budget status queries
CREATE INDEX idx_budgets_active
ON budgets(user_id, is_active)
WHERE is_active = true;

-- Category filtering
CREATE INDEX idx_transactions_category
ON transactions(category_id, transaction_date DESC);
```

### 10.2 Caching Strategy

**Cache Layers:**
1. **Account Balances** - Cache for 5 minutes (recalculate on transaction)
2. **Budget Status** - Cache for 1 hour (invalidate on new expense)
3. **Category List** - Cache indefinitely (invalidate on category change)
4. **Streak Info** - Cache for 24 hours (update at midnight)

### 10.3 Query Optimization

**Materialized Views:**
```sql
-- Pre-computed account balances
CREATE MATERIALIZED VIEW user_account_balances AS
SELECT
  user_id,
  account_id,
  currency,
  SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END) as balance
FROM transactions
GROUP BY user_id, account_id, currency;

-- Refresh strategy: On transaction insert/update/delete
CREATE OR REPLACE FUNCTION refresh_balances()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_account_balances;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## 11. Monitoring & Analytics

### 11.1 Application Metrics

**Track:**
- Transaction registration rate (per day/week)
- Active users (daily/weekly/monthly)
- Account creation rate
- Budget adherence rate
- Streak maintenance rate
- AI tool usage frequency
- Response times for AI agent
- Error rates per tool

### 11.2 User Engagement Metrics

**KPIs:**
- Average transactions per user per week
- Percentage of users with active budgets
- Average streak length
- Retention rate (7-day, 30-day)
- Feature adoption (accounts, categories, budgets)
- Receipt upload rate vs manual entry

### 11.3 Financial Insights

**Aggregate Statistics (anonymized):**
- Most common expense categories
- Average monthly spending
- Income vs expense ratios
- Budget effectiveness
- Currency distribution

---

## 12. Future Enhancements

### Phase 2 Features (Post-MVP)

**Advanced Analytics:**
- Predictive spending forecasts
- Anomaly detection (unusual expenses)
- Trend analysis over time
- Comparison with similar users (anonymized)

**Social Features:**
- Share budgets with family members
- Split expenses with specific people (like JOURNI, but optional)
- Household account with multiple contributors

**Integrations:**
- Bank account sync (Plaid/Yodlee)
- Credit card transaction import
- Export to Excel/CSV
- Sync with accounting software (QuickBooks, Xero)

**Gamification Expansion:**
- Achievements/badges system
- Leaderboards (opt-in)
- Challenges (e.g., "No eating out for a week")
- Rewards for budget adherence

**AI Improvements:**
- Automatic transaction categorization learning
- Smarter budget recommendations
- Personalized savings goals
- Bill reminder predictions

---

## 13. Conclusion

### Summary of Changes

**Architecture Evolution:**
- Group collaboration → Personal finance management
- Trip-centric → Account-centric
- Photo albums → Financial insights
- Multi-user sessions → Single-user with multiple accounts

**Database Changes:**
- -5 tables (trips, participants, photos, locations, milestones)
- +6 tables (accounts, categories, transactions, budgets, streaks, user_settings)
- Simplified from 9 to 10 tables total

**AI Agent Changes:**
- -9 tools (photo/milestone management)
- +18 tools (accounts, categories, budgets, analytics)
- Total: 25 tools (vs 12 previously)

**New Capabilities:**
- Multi-account management
- Income tracking (not just expenses)
- Category-based budgeting
- Spending analytics
- Streak gamification
- Financial advice

### Success Criteria

**MVP Success Metrics (3 months):**
- 80% of users register transactions weekly
- 60% of users maintain 7-day streak
- 50% of users set at least one budget
- 70% of users create custom categories
- Average response time < 2 seconds for AI agent

**Technical Success:**
- 99.5% uptime
- < 1% error rate on AI tools
- < 500ms database query times
- Zero data breaches
- Successful migration of 100% of users

### Next Steps

1. **Week 1:** Review and approve this plan
2. **Week 1-2:** Database schema design and implementation
3. **Week 2-3:** Backend service development
4. **Week 3-4:** AI agent implementation and testing
5. **Week 4-5:** Frontend development
6. **Week 5-6:** Integration testing and deployment
7. **Week 6:** User migration and launch

---

## Appendix A: Complete Tool Reference

### Transaction Tools
1. `register_transaction(amount, description, type, category?, account?, currency?)` - Register income/expense
2. `edit_transaction(id, amount?, description?, category?, account?)` - Modify transaction
3. `delete_transaction(id)` - Remove transaction
4. `list_transactions(account?, category?, start_date?, end_date?, limit?)` - List with filters
5. `get_transaction_summary(account?, period?)` - Aggregated stats

### Account Tools
6. `create_account(name, type, currency?, set_as_default?)` - Create new account
7. `edit_account(name, new_name?, new_currency?)` - Modify account
8. `delete_account(name, confirm_deletion)` - Archive account
9. `list_accounts(include_archived?)` - Show all accounts
10. `set_default_account(name)` - Change default

### Category Tools
11. `create_category(name, type, parent?)` - Create category
12. `edit_category(name, new_name?, new_type?)` - Modify category
13. `delete_category(name)` - Remove category
14. `list_categories(type?, include_system?)` - Show categories

### Budget Tools
15. `create_budget(category, amount, currency?, period?, account?)` - Set budget
16. `edit_budget(category, account?, new_amount?, new_period?)` - Modify budget
17. `delete_budget(category, account?)` - Remove budget
18. `list_budgets(account?, active_only?)` - Show budgets
19. `get_budget_status(category?, account?)` - Check usage

### Analytics Tools
20. `get_spending_analysis(period, account?, category?)` - Analyze expenses
21. `get_income_analysis(period, account?, category?)` - Analyze income
22. `get_category_breakdown(period, account?)` - Spending by category
23. `get_financial_advice()` - AI recommendations

### Streak Tools
24. `get_streak_status()` - Current streak info
25. `update_streak(date?)` - Manual update (admin only)

---

## Appendix B: Sample API Responses

### Register Transaction Response
```json
{
  "action": "register_transaction",
  "success": true,
  "data": {
    "id": 12345,
    "transaction_type": "expense",
    "amount": 50.0,
    "currency": "PEN",
    "description": "Almuerzo en restaurante",
    "category": "food",
    "account": "Personal",
    "transaction_date": "2025-12-02T14:30:00Z"
  },
  "context": {
    "account_balance": {"PEN": 450.0},
    "budget_alert": {
      "category": "food",
      "spent": 350.0,
      "limit": 500.0,
      "remaining": 150.0,
      "percentage": 70.0,
      "warning": false
    },
    "streak_updated": true,
    "current_streak": 15
  },
  "message": "✅ Gasto registrado: 50 PEN en comida. Te quedan 150 soles de tu presupuesto mensual. ¡Llevas 15 días de racha! 🔥"
}
```

### Budget Status Response
```json
{
  "action": "get_budget_status",
  "success": true,
  "data": {
    "account": "Personal",
    "budgets": [
      {
        "category": "food",
        "limit": 500.0,
        "spent": 350.0,
        "remaining": 150.0,
        "currency": "PEN",
        "percentage_used": 70.0,
        "period": "2025-12-01 to 2025-12-31",
        "status": "on_track"
      },
      {
        "category": "transport",
        "limit": 200.0,
        "spent": 185.0,
        "remaining": 15.0,
        "currency": "PEN",
        "percentage_used": 92.5,
        "period": "2025-12-01 to 2025-12-31",
        "status": "warning"
      }
    ]
  },
  "message": "📊 Estado de presupuestos:\n• Comida: 350/500 PEN (70%) ✅\n• Transporte: 185/200 PEN (92.5%) ⚠️ ¡Cuidado, casi alcanzas el límite!"
}
```

---

**Document Version:** 1.0
**Last Updated:** December 2, 2025
**Author:** AI Migration Planning Team
**Status:** Ready for Review
