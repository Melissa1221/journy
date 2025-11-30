"""
LangGraph Agent for Journi

Multi-session expense tracking agent with:
- Natural language understanding for expenses
- Tools for registering expenses and querying balances
- State persistence via checkpointer
"""

from typing import TypedDict, Annotated, Literal, Optional
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langsmith import traceable
import operator
import json
import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL persistence (optional - uses InMemorySaver if not configured)
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")

# IMPORTANT: Disable psycopg3 prepared statements globally
# Supabase's transaction pooler (port 6543) uses PgBouncer which is incompatible
# with prepared statements. This MUST be set before any connections are made.
try:
    from psycopg import Connection, AsyncConnection
    Connection.prepare_threshold = None
    AsyncConnection.prepare_threshold = None
    print("🔧 Disabled psycopg3 prepared statements (Supabase pooler compatibility)")
except ImportError:
    pass  # psycopg3 not installed


# ============== STATE DEFINITION ==============

class Expense(TypedDict):
    id: str
    amount: float
    currency: str  # ISO code: PEN, CLP, USD, EUR, etc.
    description: str
    paid_by: str
    split_among: list[str]
    timestamp: str


class Payment(TypedDict):
    """Direct payment between users."""
    id: str
    from_user: str
    to_user: str
    amount: float
    currency: str  # ISO code: PEN, CLP, USD, EUR, etc.
    timestamp: str


class Photo(TypedDict):
    """A photo in a milestone."""
    id: str
    milestone_id: str
    storage_url: str
    storage_path: str
    thumbnail_url: Optional[str]
    description: str
    tags: list[str]
    detected_people: list[str]
    location: Optional[str]
    uploaded_by: str
    uploaded_at: str
    order_index: int


class Milestone(TypedDict):
    """A milestone/moment in the trip containing photos."""
    id: str
    name: str
    description: Optional[str]
    location: Optional[str]
    tags: list[str]
    created_at: str
    created_by: str
    photo_count: int
    cover_photo_id: Optional[str]


class JourniState(TypedDict):
    """State for the expense tracking agent."""
    messages: Annotated[list, operator.add]
    expenses: list[Expense]
    payments: list[Payment]  # Direct payments between users
    participants: list[str]
    balances: dict[str, dict[str, float]]  # {person: {currency: amount}} e.g. {"andre": {"CLP": -11500, "PEN": 20}}
    session_name: str
    session_context: dict  # Current session context (online users, etc.)
    # Photo/Milestone fields
    milestones: list[Milestone]
    photos: list[Photo]


# ============== HELPER FUNCTIONS ==============

def normalize_name(name: str) -> str:
    """Normalize participant name - preserve original case for display."""
    return name.strip()


def update_balance(balances: dict, person: str, currency: str, amount: float) -> None:
    """Update a person's balance for a specific currency.

    Args:
        balances: The balances dict {person: {currency: amount}}
        person: Person's name
        currency: Currency code (PEN, CLP, etc.)
        amount: Amount to add (positive) or subtract (negative)
    """
    if person not in balances:
        balances[person] = {}
    if currency not in balances[person]:
        balances[person][currency] = 0.0
    balances[person][currency] += amount


def get_person_balance(balances: dict, person: str, currency: str) -> float:
    """Get a person's balance for a specific currency."""
    return balances.get(person, {}).get(currency, 0.0)


# ============== TOOLS ==============

@tool
def register_expense(
    amount: float,
    description: str,
    paid_by: str,
    currency: str = "PEN",
    split_among: Optional[list[str]] = None,
    split_amounts: Optional[dict[str, float]] = None
) -> str:
    """
    Register a new expense in the session.

    Args:
        amount: The amount paid
        description: What the expense was for (e.g., "taxi", "almuerzo")
        paid_by: Name of the person who paid
        currency: Currency code (PEN, CLP, USD, EUR, etc.)
        split_among: List of names to split EQUALLY (None = all participants)
        split_amounts: Dict of {name: amount} for UNEQUAL splits. Must sum to total amount.
                      Use this when people consumed different amounts.
                      Example: {"meli": 20, "andre": 30} for a 50 total expense.

    IMPORTANT: Use split_among OR split_amounts, NOT both.
    - split_among: Equal split → {"meli", "andre"} each pays 25 of 50
    - split_amounts: Unequal split → {"meli": 20, "andre": 30}

    Returns:
        JSON string with the action and expense data
    """
    # Validate: can't use both split methods
    if split_among and split_amounts:
        return json.dumps({
            "action": "error",
            "message": "Use split_among OR split_amounts, not both"
        })

    return json.dumps({
        "action": "register_expense",
        "data": {
            "amount": amount,
            "description": description,
            "paid_by": paid_by,
            "currency": currency.upper(),
            "split_among": split_among,
            "split_amounts": split_amounts
        }
    })


@tool
def get_balance(person: Optional[str] = None) -> str:
    """
    Get the balance for a specific person or all participants.

    Args:
        person: Name of person to check (None = show all balances)

    Returns:
        JSON string with the action
    """
    return json.dumps({
        "action": "get_balance",
        "person": person
    })


@tool
def get_debts() -> str:
    """
    Calculate who owes whom and how much.
    Shows optimized debt settlement.

    Returns:
        JSON string with the action
    """
    return json.dumps({
        "action": "get_debts"
    })


@tool
def list_expenses() -> str:
    """
    List all registered expenses in the session.

    Returns:
        JSON string with the action
    """
    return json.dumps({
        "action": "list_expenses"
    })


@tool
def register_payment(
    from_user: str,
    to_user: str,
    amount: float,
    currency: str = "PEN"
) -> str:
    """
    Register a direct payment from one person to another to settle debts.

    Use this when someone says "ya le pagué a X" or "le di dinero a Y".

    Args:
        from_user: Person who made the payment (who paid)
        to_user: Person who received the payment
        amount: Amount paid
        currency: Currency code (PEN, CLP, USD, EUR, etc.)

    Returns:
        JSON string with the action
    """
    return json.dumps({
        "action": "register_payment",
        "data": {
            "from_user": from_user,
            "to_user": to_user,
            "amount": amount,
            "currency": currency.upper()
        }
    })


@tool
def edit_expense(
    expense_id: str,
    split_among: Optional[list[str]] = None,
    amount: Optional[float] = None,
    description: Optional[str] = None,
    paid_by: Optional[str] = None
) -> str:
    """
    Edit an existing expense. Use this to modify split, amount, description or who paid.

    Use when user says "divídelo entre X y Y", "cambia el monto", "en realidad pagó X".
    Use expense_id "last" to edit the most recent expense.

    Args:
        expense_id: ID of expense to edit (use "last" for most recent)
        split_among: New list of people to split among (optional)
        amount: New amount (optional)
        description: New description (optional)
        paid_by: New payer (optional)

    Returns:
        JSON string with the action
    """
    return json.dumps({
        "action": "edit_expense",
        "data": {
            "expense_id": expense_id,
            "split_among": split_among,
            "amount": amount,
            "description": description,
            "paid_by": paid_by
        }
    })


@tool
def delete_expense(expense_id: str) -> str:
    """
    Delete an expense from the session.

    Use when user says "borra eso", "cancela el último gasto", "quita ese gasto".
    Use expense_id "last" to delete the most recent expense.

    Args:
        expense_id: ID of expense to delete (use "last" for most recent)

    Returns:
        JSON string with the action
    """
    return json.dumps({
        "action": "delete_expense",
        "data": {
            "expense_id": expense_id
        }
    })


# ============== MILESTONE/PHOTO TOOLS ==============

@tool
def create_milestone(
    name: str,
    description: Optional[str] = None,
    location: Optional[str] = None,
    tags: Optional[list[str]] = None
) -> str:
    """
    Create a new milestone/moment for grouping photos.

    Use when user mentions a new place or activity context.
    Examples: "Estamos en Sky Costanera", "Llegamos al hotel", "Almuerzo en La Mar"

    Args:
        name: Name of the milestone (e.g., "Sky Costanera")
        description: Optional longer description
        location: City or place name
        tags: Optional tags for categorization

    Returns:
        JSON string with the action
    """
    return json.dumps({
        "action": "create_milestone",
        "data": {
            "name": name,
            "description": description,
            "location": location,
            "tags": tags or []
        }
    })


@tool
def edit_milestone(
    milestone_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    location: Optional[str] = None,
    cover_photo_id: Optional[str] = None
) -> str:
    """
    Edit an existing milestone. Use milestone_id="last" for the most recent.

    Args:
        milestone_id: ID of milestone to edit
        name: New name
        description: New description
        location: New location
        cover_photo_id: ID of photo to use as cover
    """
    return json.dumps({
        "action": "edit_milestone",
        "data": {
            "milestone_id": milestone_id,
            "name": name,
            "description": description,
            "location": location,
            "cover_photo_id": cover_photo_id
        }
    })


@tool
def delete_milestone(milestone_id: str, delete_photos: bool = False) -> str:
    """
    Delete a milestone. Use milestone_id="last" for the most recent.

    Args:
        milestone_id: ID of milestone to delete
        delete_photos: If True, also delete photos. If False, photos become orphaned.
    """
    return json.dumps({
        "action": "delete_milestone",
        "data": {
            "milestone_id": milestone_id,
            "delete_photos": delete_photos
        }
    })


@tool
def list_milestones() -> str:
    """
    List all milestones in the trip.

    Returns:
        JSON string with the action
    """
    return json.dumps({
        "action": "list_milestones"
    })


@tool
def register_photo(
    description: str,
    tags: list[str],
    milestone_id: Optional[str] = "last",
    detected_people: Optional[list[str]] = None,
    location: Optional[str] = None
) -> str:
    """
    Register a photo after analyzing it. The image is already uploaded.
    Call this AFTER analyzing an image with vision to save its metadata.

    Use milestone_id="last" to add to the most recently created milestone.

    Args:
        description: AI-generated description of what's in the photo
        tags: Relevant tags (paisaje, grupo, comida, selfie, mirador, etc.)
        milestone_id: Which milestone to add to (use "last" for most recent)
        detected_people: List of participants detected in the photo
        location: Inferred location if visible

    Returns:
        JSON string with the action
    """
    return json.dumps({
        "action": "register_photo",
        "data": {
            "description": description,
            "tags": tags,
            "milestone_id": milestone_id,
            "detected_people": detected_people or [],
            "location": location
        }
    })


@tool
def edit_photo(
    photo_id: str,
    description: Optional[str] = None,
    tags: Optional[list[str]] = None,
    detected_people: Optional[list[str]] = None,
    milestone_id: Optional[str] = None
) -> str:
    """
    Edit photo metadata. Can also move photo to different milestone.
    Use photo_id="last" for the most recent photo.

    Args:
        photo_id: ID of photo to edit
        description: New description
        tags: New tags
        detected_people: New list of people
        milestone_id: Move to different milestone
    """
    return json.dumps({
        "action": "edit_photo",
        "data": {
            "photo_id": photo_id,
            "description": description,
            "tags": tags,
            "detected_people": detected_people,
            "milestone_id": milestone_id
        }
    })


@tool
def delete_photo(photo_id: str) -> str:
    """
    Delete a photo. Use photo_id="last" for the most recent.
    This also removes it from storage.

    Args:
        photo_id: ID of photo to delete
    """
    return json.dumps({
        "action": "delete_photo",
        "data": {
            "photo_id": photo_id
        }
    })


@tool
def list_photos(milestone_id: Optional[str] = None) -> str:
    """
    List photos, optionally filtered by milestone.

    Args:
        milestone_id: Filter to only show photos from this milestone

    Returns:
        JSON string with the action
    """
    return json.dumps({
        "action": "list_photos",
        "data": {
            "milestone_id": milestone_id
        }
    })


@tool
def view_photos(milestone_id: Optional[str] = None, photo_ids: Optional[list[str]] = None) -> str:
    """
    View/analyze stored photos. Use this to SEE photos and answer questions about them.

    This fetches the actual images so you can analyze their content.
    Use when user asks: "¿Qué comimos?", "¿Cómo se veía el hotel?", "Muéstrame las fotos"

    Args:
        milestone_id: View all photos from this milestone
        photo_ids: View specific photos by ID

    Returns:
        JSON string with the action (photos will be loaded as images)
    """
    return json.dumps({
        "action": "view_photos",
        "data": {
            "milestone_id": milestone_id,
            "photo_ids": photo_ids
        }
    })


# ============== LLM SETUP ==============

# Model configuration with providers
# Priority: OpenAI direct API first, then OpenRouter fallbacks
MODEL_CONFIG = [
    {"provider": "openai", "model": "gpt-5.1"},                   # Primary: GPT-5.1
    {"provider": "openai", "model": "gpt-4o"},                    # Fallback 1: GPT-4o
    {"provider": "openrouter", "model": "anthropic/claude-sonnet-4"},  # Fallback 2: Claude via OpenRouter
    {"provider": "openrouter", "model": "google/gemini-2.0-flash-001"}, # Fallback 3: Gemini Flash
]

# Expense tools
EXPENSE_TOOLS = [register_expense, edit_expense, delete_expense, register_payment, get_balance, get_debts, list_expenses]

# Milestone/Photo tools
PHOTO_TOOLS = [create_milestone, edit_milestone, delete_milestone, list_milestones,
               register_photo, edit_photo, delete_photo, list_photos, view_photos]

# All tools
TOOLS = EXPENSE_TOOLS + PHOTO_TOOLS


class LLMWithFallback:
    """LLM wrapper with automatic fallback between providers."""

    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY")
        self.current_model_index = 0

    def _create_llm(self, config: dict, with_tools: bool = True):
        """Create LLM instance for given config."""
        if config["provider"] == "openai":
            llm = ChatOpenAI(
                model=config["model"],
                api_key=self.openai_key,
            )
        else:  # openrouter
            llm = ChatOpenAI(
                model=config["model"],
                api_key=self.openrouter_key,
                base_url="https://openrouter.ai/api/v1",
            )
        return llm.bind_tools(TOOLS) if with_tools else llm

    async def ainvoke(self, messages, with_tools: bool = True):
        """Invoke LLM with automatic fallback on failure."""
        last_error = None

        for i, config in enumerate(MODEL_CONFIG):
            try:
                llm = self._create_llm(config, with_tools=with_tools)
                response = await llm.ainvoke(messages)

                # Success - log if we switched models
                if i != self.current_model_index:
                    print(f"✅ Using model: {config['provider']}/{config['model']}")
                    self.current_model_index = i

                return response

            except Exception as e:
                error_str = str(e)
                last_error = e
                model_name = f"{config['provider']}/{config['model']}"

                # Check if it's a credit/quota error
                if "402" in error_str or "credit" in error_str.lower() or "quota" in error_str.lower():
                    print(f"⚠️ {model_name} failed (credits), trying next...")
                    continue

                # Check if it's a rate limit
                if "429" in error_str or "rate" in error_str.lower():
                    print(f"⚠️ {model_name} rate limited, trying next...")
                    continue

                # Other errors - still try fallback
                print(f"⚠️ {model_name} error: {error_str[:100]}, trying next...")
                continue

        # All models failed
        raise Exception(f"All models failed. Last error: {last_error}")


# Global LLM instance with fallback
llm_manager = LLMWithFallback()


def get_llm():
    """Get the LLM manager instance (for backwards compatibility)."""
    return llm_manager


# ============== NODE FUNCTIONS ==============

SYSTEM_PROMPT = """Eres Journi, un asistente amigable para gestionar gastos grupales en viajes.

CONTEXTO DE SESIÓN:
- Usuario que envía este mensaje: {current_user}
- Participantes del viaje: {participants}
- Gastos registrados: {expense_count}

Tu trabajo es:
1. Interpretar mensajes sobre gastos en lenguaje natural (español)
2. Usar las herramientas para registrar gastos, pagos y consultar balances
3. Responder de forma MUY breve y amigable (1-2 oraciones max)

FORMATO DE MENSAJES:
Los mensajes vienen como "[nombre]: mensaje"
- El nombre entre corchetes es QUIEN habla
- "yo", "pagué", "debo" = el usuario entre corchetes

MONEDAS (MUY IMPORTANTE):
Los gastos se registran con su moneda real. NO conviertas entre monedas.
- RECUERDA LA MONEDA: Una vez que se establece la moneda en el primer gasto, USA ESA MISMA MONEDA para todos los gastos siguientes SIN PREGUNTAR, a menos que el usuario especifique otra.
- DETECTA la moneda del contexto geográfico:
  - Chile: CLP (pesos chilenos)
  - Perú: PEN (soles)
  - Argentina: ARS (pesos argentinos)
  - USA: USD (dólares)
  - Europa: EUR (euros)
- Señales de contexto:
  - Lugares mencionados: "taxi en Santiago" → CLP, "almuerzo en Lima" → PEN
  - Símbolos: "S/" o "soles" → PEN, "$" en Chile → CLP, "CLP" explícito → CLP
  - Montos típicos: 23000 en Chile = CLP, 50 en Perú = PEN
- SOLO pregunta por moneda si es el PRIMER gasto de la sesión y no hay contexto claro
- Las deudas se calculan SEPARADAMENTE por cada moneda, sin mezclar

HERRAMIENTAS:
- register_expense: Registrar gasto. Parámetros importantes:
  * split_among: Lista de nombres para división IGUAL (ej: ["meli", "andre"] → cada uno paga 50%)
  * split_amounts: Dict para división DESIGUAL (ej: {{"meli": 20, "andre": 30}} → montos específicos)
  * IMPORTANTE: Usa split_among O split_amounts, NUNCA ambos
- edit_expense: Modificar gasto existente. Usa expense_id="last" para el último.
- delete_expense: Eliminar gasto. Usa expense_id="last" para el último.
- register_payment: Pago directo entre personas (ej: "ya le pagué a X")
- get_balance: Consultar balance
- get_debts: Ver quién debe a quién

IMÁGENES - DOS TIPOS:

1. RECIBOS/BOLETAS (para gastos):
- Analiza la imagen para extraer monto y descripción
- Usa register_expense con los datos extraídos
- Pregunta quién pagó si no está claro

2. FOTOS DE MOMENTOS (para memorias del viaje):
- Cuando el usuario mencione un lugar + adjunte fotos:
  a. PRIMERO crea un milestone con create_milestone()
  b. LUEGO para CADA imagen, analízala y llama register_photo() con:
     - description: Qué se ve en la foto
     - tags: ["paisaje", "grupo", "comida", "selfie", "mirador", etc.]
     - detected_people: Participantes que reconozcas
     - location: Lugar inferido si es visible

- Ejemplos de contexto → milestone:
  - "Estamos en Sky Costanera" + fotos → create_milestone("Sky Costanera", location="Santiago")
  - "Llegamos al hotel" + fotos → create_milestone("Hotel")
  - "Almuerzo increíble" + fotos → create_milestone("Almuerzo", tags=["comida"])

- IMPORTANTE: Usa milestone_id="last" para registrar fotos en el milestone recién creado

HERRAMIENTAS DE FOTOS:
- create_milestone: Crear un hito/momento del viaje
- register_photo: Guardar foto analizada en un milestone
- list_milestones: Ver todos los hitos
- list_photos: Ver fotos de un milestone
- view_photos: Para VER fotos guardadas y responder preguntas sobre ellas

REGLAS:
- "pagué X por Y" → register_expense con paid_by = usuario actual
- "Juan pagó X" → register_expense con paid_by = "Juan"
- "divídelo entre X y Y" o "agrégalo a Z" → edit_expense("last", split_among=[...])
- "borra eso" o "cancela el último" → delete_expense("last")
- "ya le pagué X a María" → register_payment(from=usuario, to="María", amount=X)
- "entre todos" o sin especificar → split_among = null (divide entre todos los participantes conocidos)
- Responde en español, MUY breve, sin repetir el nombre entre corchetes
- NO muestres JSON en tus respuestas, solo texto amigable
- IMPORTANTE: Si el usuario quiere cambiar un gasto existente, usa edit_expense, NO crees uno nuevo

Ejemplos:
- "[meli]: pagué 50 del taxi" → register_expense(50, "taxi", "meli", currency="PEN")
- "[meli]: pagué 23000 del uber en Santiago" → register_expense(23000, "uber", "meli", currency="CLP")
- "[meli]: dividelo con andre" → edit_expense("last", split_among=["meli", "andre"])
- "[andre]: borra el último gasto" → delete_expense("last")
- "[andre]: ya le di 25 a meli" → register_payment("andre", "meli", 25, currency="PEN")
- "[pedro]: ¿cuánto debo?" → get_balance("pedro")

DIVISIÓN DESIGUAL (split_amounts):
- "[meli]: andre pagó 50 de comida, mi plato fue 20" → register_expense(50, "comida", "andre", split_amounts={{"meli": 20, "andre": 30}})
- "[pedro]: pagué 100 del almuerzo, yo comí 40, juan 35, maría 25" → register_expense(100, "almuerzo", "pedro", split_amounts={{"pedro": 40, "juan": 35, "maría": 25}})
- Cuando alguien dice "mi parte fue X" o "yo consumí X" → usa split_amounts
"""


@traceable(name="process_message", run_type="llm", tags=["journi", "expense-tracking"])
async def process_message(state: JourniState) -> dict:
    """Process user message with the LLM."""
    # Get session context if available
    session_ctx = state.get("session_context", {})

    # Build system prompt with context
    system = SYSTEM_PROMPT.format(
        current_user=session_ctx.get("current_user", "desconocido"),
        participants=", ".join(state.get("participants", [])) or "ninguno aún",
        expense_count=len(state.get("expenses", []))
    )

    # Get messages (filter out tool messages for cleaner context)
    messages = [SystemMessage(content=system)]

    for msg in state["messages"]:
        if isinstance(msg, dict):
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg.get("role") == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        else:
            messages.append(msg)

    response = await llm_manager.ainvoke(messages)
    return {"messages": [response]}


@traceable(name="execute_tools", run_type="tool", tags=["journi", "expense-tracking"])
async def execute_tools(state: JourniState) -> dict:
    """Execute tools called by the LLM."""
    last_message = state["messages"][-1]

    # Check if there are tool calls
    if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
        return {}

    tool_results = []
    new_expenses = list(state.get("expenses", []))
    new_payments = list(state.get("payments", []))
    new_balances = dict(state.get("balances", {}))
    participants = list(state.get("participants", []))
    new_milestones = list(state.get("milestones", []))
    new_photos = list(state.get("photos", []))

    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        tool_id = tool_call["id"]

        result_content = ""

        if tool_name == "register_expense":
            data = tool_args
            expense_id = f"exp_{len(new_expenses) + 1}"

            # Normalize names
            paid_by = normalize_name(data["paid_by"])
            currency = data.get("currency", "PEN").upper()
            split_amounts = data.get("split_amounts")

            # Handle split_amounts (unequal split) vs split_among (equal split)
            if split_amounts:
                # Unequal split: validate and use specific amounts
                split_amounts = {normalize_name(k): v for k, v in split_amounts.items()}
                total_split = sum(split_amounts.values())

                # Validate amounts sum to total (with small tolerance for float precision)
                if abs(total_split - data["amount"]) > 0.01:
                    result_content = f"Error: split_amounts suma {total_split:.2f} pero el gasto es {data['amount']:.2f}"
                    tool_results.append(ToolMessage(content=result_content, tool_call_id=tool_id))
                    continue

                split_list = list(split_amounts.keys())
            else:
                # Equal split: use split_among or all participants
                split_list = data.get("split_among") or participants
                if not split_list:
                    split_list = [paid_by]
                else:
                    split_list = [normalize_name(p) for p in split_list]
                split_amounts = None

            # Ensure paid_by is in participants
            if paid_by not in participants:
                participants.append(paid_by)

            # Ensure all split people are in participants
            for person in split_list:
                if person not in participants:
                    participants.append(person)

            expense = {
                "id": expense_id,
                "amount": data["amount"],
                "currency": currency,
                "description": data["description"],
                "paid_by": paid_by,
                "split_among": split_list,
                "split_amounts": split_amounts,  # Store for reference
                "timestamp": ""
            }
            new_expenses.append(expense)

            # Update balances (per currency)
            # Payer gets credit in that currency
            update_balance(new_balances, paid_by, currency, data["amount"])

            # Each person owes their share in that currency
            if split_amounts:
                # Unequal split: use specific amounts
                for person, amount in split_amounts.items():
                    update_balance(new_balances, person, currency, -amount)
                split_desc = ", ".join([f"{p}: {a:.2f}" for p, a in split_amounts.items()])
                result_content = f"Gasto registrado: {data['amount']:.2f} {currency} por '{data['description']}', pagado por {paid_by}. División: {split_desc}"
            else:
                # Equal split
                per_person = data["amount"] / len(split_list)
                for person in split_list:
                    update_balance(new_balances, person, currency, -per_person)
                result_content = f"Gasto registrado: {data['amount']:.2f} {currency} por '{data['description']}', pagado por {paid_by}, dividido entre {len(split_list)} personas"

        elif tool_name == "get_balance":
            person = tool_args.get("person")
            if person:
                person_balances = new_balances.get(person, {})
                if person_balances:
                    lines = []
                    for curr, bal in sorted(person_balances.items()):
                        if abs(bal) > 0.01:
                            sign = "+" if bal >= 0 else ""
                            lines.append(f"{sign}{bal:.2f} {curr}")
                    result_content = f"Balance de {person}: " + (", ".join(lines) if lines else "0")
                else:
                    result_content = f"Balance de {person}: 0"
            else:
                if new_balances:
                    lines = []
                    for p in sorted(new_balances.keys()):
                        person_bals = new_balances[p]
                        bal_strs = []
                        for curr, bal in sorted(person_bals.items()):
                            if abs(bal) > 0.01:
                                sign = "+" if bal >= 0 else ""
                                bal_strs.append(f"{sign}{bal:.2f} {curr}")
                        if bal_strs:
                            lines.append(f"  {p}: {', '.join(bal_strs)}")
                    result_content = "Balances actuales:\n" + "\n".join(lines) if lines else "Todos están a mano"
                else:
                    result_content = "No hay balances registrados aún"

        elif tool_name == "get_debts":
            if not new_balances:
                result_content = "No hay deudas registradas aún"
            else:
                # Collect all currencies used
                all_currencies = set()
                for person_bals in new_balances.values():
                    all_currencies.update(person_bals.keys())

                all_debts = []
                for currency in sorted(all_currencies):
                    # Get balances for this currency
                    currency_balances = {p: bals.get(currency, 0) for p, bals in new_balances.items()}

                    # Calculate optimized debts for this currency
                    debtors = [(p, -b) for p, b in currency_balances.items() if b < -0.01]
                    creditors = [(p, b) for p, b in currency_balances.items() if b > 0.01]

                    debtors.sort(key=lambda x: x[1], reverse=True)
                    creditors.sort(key=lambda x: x[1], reverse=True)

                    i, j = 0, 0
                    while i < len(debtors) and j < len(creditors):
                        debtor, debt = debtors[i]
                        creditor, credit = creditors[j]
                        amount = min(debt, credit)

                        if amount > 0.01:
                            all_debts.append(f"  {debtor} → {creditor}: {amount:.2f} {currency}")

                        if abs(debt - amount) < 0.01:
                            i += 1
                        else:
                            debtors[i] = (debtor, debt - amount)

                        if abs(credit - amount) < 0.01:
                            j += 1
                        else:
                            creditors[j] = (creditor, credit - amount)

                if all_debts:
                    result_content = "Deudas pendientes:\n" + "\n".join(all_debts)
                else:
                    result_content = "No hay deudas pendientes. ¡Están a mano!"

        elif tool_name == "list_expenses":
            if not new_expenses:
                result_content = "No hay gastos registrados aún"
            else:
                lines = []
                for exp in new_expenses:
                    curr = exp.get('currency', 'PEN')
                    lines.append(
                        f"  - {exp['amount']:.2f} {curr} por '{exp['description']}' "
                        f"(pagó {exp['paid_by']}, entre {len(exp['split_among'])} personas)"
                    )
                result_content = f"Gastos ({len(new_expenses)} total):\n" + "\n".join(lines)

        elif tool_name == "register_payment":
            data = tool_args
            from_user = normalize_name(data["from_user"])
            to_user = normalize_name(data["to_user"])
            amount = data["amount"]
            currency = data.get("currency", "PEN").upper()

            # Create payment record
            payment_id = f"pay_{len(new_payments) + 1}"
            payment = {
                "id": payment_id,
                "from_user": from_user,
                "to_user": to_user,
                "amount": amount,
                "currency": currency,
                "timestamp": ""
            }
            new_payments.append(payment)

            # Update balances for this currency:
            # from_user paid money, so their balance goes UP (they're owed less / owe less)
            update_balance(new_balances, from_user, currency, amount)
            # to_user received money, so their balance goes DOWN (they're owed more / owe more)
            update_balance(new_balances, to_user, currency, -amount)

            # Ensure both are in participants
            if from_user not in participants:
                participants.append(from_user)
            if to_user not in participants:
                participants.append(to_user)

            result_content = f"Pago registrado: {from_user} pagó {amount:.2f} {currency} a {to_user}"

            # Check if they're now even in this currency
            from_user_bal = get_person_balance(new_balances, from_user, currency)
            if abs(from_user_bal) < 0.01:
                result_content += f". ¡{from_user} ya está a mano en {currency}!"

        elif tool_name == "edit_expense":
            data = tool_args
            expense_id = data["expense_id"]

            # Find expense to edit
            target_idx = -1
            if expense_id == "last" and new_expenses:
                target_idx = len(new_expenses) - 1
            else:
                for idx, exp in enumerate(new_expenses):
                    if exp["id"] == expense_id:
                        target_idx = idx
                        break

            if target_idx == -1:
                result_content = f"No encontré el gasto '{expense_id}'"
            else:
                old_expense = new_expenses[target_idx]
                currency = old_expense.get("currency", "PEN")

                # Reverse old balance impact (in the expense's currency)
                old_split_count = len(old_expense["split_among"])
                old_per_person = old_expense["amount"] / old_split_count
                update_balance(new_balances, old_expense["paid_by"], currency, -old_expense["amount"])
                for person in old_expense["split_among"]:
                    update_balance(new_balances, person, currency, old_per_person)

                # Apply updates
                if data.get("amount") is not None:
                    old_expense["amount"] = data["amount"]
                if data.get("description") is not None:
                    old_expense["description"] = data["description"]
                if data.get("paid_by") is not None:
                    paid_by = normalize_name(data["paid_by"])
                    old_expense["paid_by"] = paid_by
                    if paid_by not in participants:
                        participants.append(paid_by)
                if data.get("split_among") is not None:
                    normalized_split = [normalize_name(p) for p in data["split_among"]]
                    old_expense["split_among"] = normalized_split
                    for person in normalized_split:
                        if person not in participants:
                            participants.append(person)

                # Apply new balance impact (in the expense's currency)
                new_split_count = len(old_expense["split_among"])
                new_per_person = old_expense["amount"] / new_split_count
                update_balance(new_balances, old_expense["paid_by"], currency, old_expense["amount"])
                for person in old_expense["split_among"]:
                    update_balance(new_balances, person, currency, -new_per_person)

                new_expenses[target_idx] = old_expense
                result_content = f"Gasto actualizado: {old_expense['amount']:.2f} {currency} por '{old_expense['description']}', pagado por {old_expense['paid_by']}, dividido entre {', '.join(old_expense['split_among'])}"

        elif tool_name == "delete_expense":
            data = tool_args
            expense_id = data["expense_id"]

            # Find expense to delete
            target_idx = -1
            if expense_id == "last" and new_expenses:
                target_idx = len(new_expenses) - 1
            else:
                for idx, exp in enumerate(new_expenses):
                    if exp["id"] == expense_id:
                        target_idx = idx
                        break

            if target_idx == -1:
                result_content = f"No encontré el gasto '{expense_id}'"
            else:
                deleted = new_expenses.pop(target_idx)
                currency = deleted.get("currency", "PEN")

                # Reverse balance impact (in the expense's currency)
                split_count = len(deleted["split_among"])
                per_person = deleted["amount"] / split_count
                update_balance(new_balances, deleted["paid_by"], currency, -deleted["amount"])
                for person in deleted["split_among"]:
                    update_balance(new_balances, person, currency, per_person)

                result_content = f"Gasto eliminado: {deleted['amount']:.2f} {currency} por '{deleted['description']}'"

        # ============== MILESTONE TOOL HANDLERS ==============
        elif tool_name == "create_milestone":
            from datetime import datetime
            from services import get_db

            data = tool_args
            milestone_id = f"milestone_{len(new_milestones) + 1}"
            session_ctx = state.get("session_context", {})
            current_user = session_ctx.get("current_user", "unknown")
            trip_id = session_ctx.get("trip_id")  # Get trip_id from session context

            milestone = {
                "id": milestone_id,
                "name": data["name"],
                "description": data.get("description"),
                "location": data.get("location"),
                "tags": data.get("tags", []),
                "created_at": datetime.now().isoformat(),
                "created_by": current_user,
                "photo_count": 0,
                "cover_photo_id": None
            }
            new_milestones.append(milestone)

            # Persist to database if trip_id is available
            if trip_id:
                try:
                    db = get_db()
                    db_milestone = await db.insert_milestone(
                        trip_id=trip_id,
                        name=data["name"],
                        description=data.get("description"),
                        location=data.get("location"),
                        tags=data.get("tags", []),
                        created_by_user_id=None  # Anonymous user support
                    )
                    if db_milestone:
                        milestone["db_id"] = db_milestone.id
                        print(f"✅ Milestone persisted to DB: {db_milestone.id}")
                except Exception as e:
                    print(f"⚠️ Failed to persist milestone to DB: {e}")

            result_content = f"Milestone creado: '{data['name']}'" + (f" en {data['location']}" if data.get('location') else "")

        elif tool_name == "edit_milestone":
            data = tool_args
            milestone_id = data["milestone_id"]

            target_idx = -1
            if milestone_id == "last" and new_milestones:
                target_idx = len(new_milestones) - 1
            else:
                for idx, ms in enumerate(new_milestones):
                    if ms["id"] == milestone_id:
                        target_idx = idx
                        break

            if target_idx == -1:
                result_content = f"No encontré el milestone '{milestone_id}'"
            else:
                ms = new_milestones[target_idx]
                if data.get("name"):
                    ms["name"] = data["name"]
                if data.get("description"):
                    ms["description"] = data["description"]
                if data.get("location"):
                    ms["location"] = data["location"]
                if data.get("cover_photo_id"):
                    ms["cover_photo_id"] = data["cover_photo_id"]
                new_milestones[target_idx] = ms
                result_content = f"Milestone actualizado: '{ms['name']}'"

        elif tool_name == "delete_milestone":
            data = tool_args
            milestone_id = data["milestone_id"]
            delete_photos_flag = data.get("delete_photos", False)

            target_idx = -1
            if milestone_id == "last" and new_milestones:
                target_idx = len(new_milestones) - 1
            else:
                for idx, ms in enumerate(new_milestones):
                    if ms["id"] == milestone_id:
                        target_idx = idx
                        break

            if target_idx == -1:
                result_content = f"No encontré el milestone '{milestone_id}'"
            else:
                deleted_ms = new_milestones.pop(target_idx)
                if delete_photos_flag:
                    # Remove associated photos
                    new_photos = [p for p in new_photos if p["milestone_id"] != deleted_ms["id"]]
                result_content = f"Milestone eliminado: '{deleted_ms['name']}'"

        elif tool_name == "list_milestones":
            if not new_milestones:
                result_content = "No hay milestones registrados aún"
            else:
                lines = []
                for ms in new_milestones:
                    lines.append(f"  - {ms['name']} ({ms['photo_count']} fotos)" + (f" - {ms['location']}" if ms.get('location') else ""))
                result_content = f"Milestones ({len(new_milestones)} total):\n" + "\n".join(lines)

        # ============== PHOTO TOOL HANDLERS ==============
        elif tool_name == "register_photo":
            from datetime import datetime
            data = tool_args
            photo_id = f"photo_{len(new_photos) + 1}"
            session_ctx = state.get("session_context", {})
            current_user = session_ctx.get("current_user", "unknown")

            # Get pending upload info from session context
            pending_uploads = session_ctx.get("pending_uploads", [])
            upload_info = pending_uploads.pop(0) if pending_uploads else {"url": "", "path": ""}

            # Find milestone
            milestone_id = data.get("milestone_id", "last")
            target_milestone = None
            if milestone_id == "last" and new_milestones:
                target_milestone = new_milestones[-1]
            else:
                for ms in new_milestones:
                    if ms["id"] == milestone_id:
                        target_milestone = ms
                        break

            if not target_milestone:
                result_content = "No hay milestone para agregar la foto. Crea uno primero."
            else:
                photo = {
                    "id": photo_id,
                    "milestone_id": target_milestone["id"],
                    "storage_url": upload_info.get("url", ""),
                    "storage_path": upload_info.get("path", ""),
                    "thumbnail_url": None,
                    "description": data["description"],
                    "tags": data.get("tags", []),
                    "detected_people": [normalize_name(p) for p in data.get("detected_people", [])],
                    "location": data.get("location"),
                    "uploaded_by": current_user,
                    "uploaded_at": datetime.now().isoformat(),
                    "order_index": len([p for p in new_photos if p["milestone_id"] == target_milestone["id"]])
                }
                new_photos.append(photo)

                # Update milestone photo count
                for idx, ms in enumerate(new_milestones):
                    if ms["id"] == target_milestone["id"]:
                        ms["photo_count"] = ms.get("photo_count", 0) + 1
                        if not ms.get("cover_photo_id"):
                            ms["cover_photo_id"] = photo_id
                        new_milestones[idx] = ms
                        break

                # Persist to database if trip_id is available
                trip_id = session_ctx.get("trip_id")
                if trip_id and upload_info.get("url"):
                    try:
                        from services import get_db
                        db = get_db()

                        # Get DB milestone ID if available
                        db_milestone_id = target_milestone.get("db_id")

                        db_photo = await db.insert_photo(
                            trip_id=trip_id,
                            milestone_id=db_milestone_id,
                            photo_url=upload_info.get("url", ""),
                            storage_path=upload_info.get("path", ""),
                            uploaded_by_user_id=None,  # Anonymous user support
                            description=data["description"],
                            tags=data.get("tags", []),
                            detected_people=data.get("detected_people", []),
                            location_name=data.get("location"),
                            order_index=photo["order_index"]
                        )
                        if db_photo:
                            photo["db_id"] = db_photo.id
                            print(f"✅ Photo persisted to DB: {db_photo.id}")
                    except Exception as e:
                        print(f"⚠️ Failed to persist photo to DB: {e}")

                result_content = f"Foto guardada en '{target_milestone['name']}': {data['description'][:50]}..."

        elif tool_name == "edit_photo":
            data = tool_args
            photo_id = data["photo_id"]

            target_idx = -1
            if photo_id == "last" and new_photos:
                target_idx = len(new_photos) - 1
            else:
                for idx, p in enumerate(new_photos):
                    if p["id"] == photo_id:
                        target_idx = idx
                        break

            if target_idx == -1:
                result_content = f"No encontré la foto '{photo_id}'"
            else:
                photo = new_photos[target_idx]
                if data.get("description"):
                    photo["description"] = data["description"]
                if data.get("tags"):
                    photo["tags"] = data["tags"]
                if data.get("detected_people"):
                    photo["detected_people"] = [normalize_name(p) for p in data["detected_people"]]
                if data.get("milestone_id"):
                    # Move to different milestone
                    old_milestone_id = photo["milestone_id"]
                    photo["milestone_id"] = data["milestone_id"]
                    # Update photo counts
                    for idx, ms in enumerate(new_milestones):
                        if ms["id"] == old_milestone_id:
                            ms["photo_count"] = max(0, ms.get("photo_count", 1) - 1)
                        if ms["id"] == data["milestone_id"]:
                            ms["photo_count"] = ms.get("photo_count", 0) + 1
                        new_milestones[idx] = ms
                new_photos[target_idx] = photo
                result_content = f"Foto actualizada: {photo['description'][:30]}..."

        elif tool_name == "delete_photo":
            data = tool_args
            photo_id = data["photo_id"]

            target_idx = -1
            if photo_id == "last" and new_photos:
                target_idx = len(new_photos) - 1
            else:
                for idx, p in enumerate(new_photos):
                    if p["id"] == photo_id:
                        target_idx = idx
                        break

            if target_idx == -1:
                result_content = f"No encontré la foto '{photo_id}'"
            else:
                deleted_photo = new_photos.pop(target_idx)
                # Update milestone photo count
                for idx, ms in enumerate(new_milestones):
                    if ms["id"] == deleted_photo["milestone_id"]:
                        ms["photo_count"] = max(0, ms.get("photo_count", 1) - 1)
                        new_milestones[idx] = ms
                        break
                result_content = f"Foto eliminada: {deleted_photo['description'][:30]}..."

        elif tool_name == "list_photos":
            data = tool_args
            milestone_id = data.get("milestone_id")

            photos_to_list = new_photos
            if milestone_id:
                if milestone_id == "last" and new_milestones:
                    milestone_id = new_milestones[-1]["id"]
                photos_to_list = [p for p in new_photos if p["milestone_id"] == milestone_id]

            if not photos_to_list:
                result_content = "No hay fotos registradas" + (f" en ese milestone" if milestone_id else "")
            else:
                lines = []
                for p in photos_to_list:
                    tags_str = ", ".join(p.get("tags", [])[:3])
                    lines.append(f"  - [{p['id']}] {p['description'][:40]}... ({tags_str})")
                result_content = f"Fotos ({len(photos_to_list)} total):\n" + "\n".join(lines)

        elif tool_name == "view_photos":
            # This tool returns info but actual image viewing happens in main.py
            data = tool_args
            milestone_id = data.get("milestone_id")
            photo_ids = data.get("photo_ids")

            photos_to_view = []
            if photo_ids:
                photos_to_view = [p for p in new_photos if p["id"] in photo_ids]
            elif milestone_id:
                if milestone_id == "last" and new_milestones:
                    milestone_id = new_milestones[-1]["id"]
                photos_to_view = [p for p in new_photos if p["milestone_id"] == milestone_id]
            else:
                photos_to_view = new_photos[-5:] if new_photos else []  # Last 5 photos

            if not photos_to_view:
                result_content = "No hay fotos para ver"
            else:
                # Store photos to view in context for main.py to fetch
                session_ctx = state.get("session_context", {})
                session_ctx["photos_to_view"] = photos_to_view
                lines = []
                for p in photos_to_view:
                    lines.append(f"  - {p['description']}")
                result_content = f"Viendo {len(photos_to_view)} fotos:\n" + "\n".join(lines)

        tool_results.append(
            ToolMessage(content=result_content, tool_call_id=tool_id)
        )

    return {
        "messages": tool_results,
        "expenses": new_expenses,
        "payments": new_payments,
        "balances": new_balances,
        "participants": participants,
        "milestones": new_milestones,
        "photos": new_photos
    }


@traceable(name="generate_response", run_type="llm", tags=["journi", "expense-tracking"])
async def generate_response(state: JourniState) -> dict:
    """Generate final response after tool execution.

    Uses LLM WITHOUT tools bound to ensure it only generates text,
    not additional tool calls that would not be executed.
    """
    # Build context with tool results
    messages = []
    for msg in state["messages"]:
        if isinstance(msg, (HumanMessage, AIMessage, ToolMessage, SystemMessage)):
            messages.append(msg)
        elif isinstance(msg, dict):
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg["content"]))

    # Use with_tools=False to prevent additional tool calls
    response = await llm_manager.ainvoke(messages, with_tools=False)
    return {"messages": [response]}


def should_execute_tools(state: JourniState) -> Literal["tools", "end"]:
    """Determine if we need to execute tools."""
    if not state["messages"]:
        return "end"

    last_message = state["messages"][-1]
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        return "tools"
    return "end"


def should_continue_after_tools(state: JourniState) -> Literal["respond", "end"]:
    """Determine if we need to generate a response after tools."""
    # Always generate a response after executing tools
    return "respond"


# ============== BUILD GRAPH ==============

# Global checkpointer and graph instances
_checkpointer = None
_graph = None


async def get_async_checkpointer():
    """Get or create async PostgreSQL checkpointer."""
    global _checkpointer

    if _checkpointer is not None:
        return _checkpointer

    if SUPABASE_DB_URL:
        try:
            from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
            from psycopg_pool import AsyncConnectionPool

            print("🔗 Connecting to PostgreSQL (async)...")

            # Create async connection pool
            # Note: prepare_threshold is already disabled at module import level
            pool = AsyncConnectionPool(
                conninfo=SUPABASE_DB_URL,
                max_size=10,
                min_size=1,
                open=False  # Don't open immediately
            )
            await pool.open()

            print("✅ Connection pool opened")

            _checkpointer = AsyncPostgresSaver(pool)

            # Setup tables on first run (idempotent)
            try:
                await _checkpointer.setup()
                print("✅ PostgreSQL async checkpointer ready (tables created/verified)")
            except Exception as e:
                print(f"⚠️ Table setup note: {e}")
            return _checkpointer
        except Exception as e:
            print(f"⚠️ PostgreSQL failed, falling back to memory: {e}")
            import traceback
            traceback.print_exc()
            _checkpointer = InMemorySaver()
            return _checkpointer
    else:
        print("📝 Using InMemorySaver (set SUPABASE_DB_URL for persistence)")
        _checkpointer = InMemorySaver()
        return _checkpointer


def get_sync_checkpointer():
    """Get sync checkpointer for initialization (falls back to memory)."""
    # For the initial graph build, use InMemorySaver
    # The async checkpointer will be set up later via startup event
    print("📝 Using InMemorySaver for initial graph (async checkpointer will be set up on startup)")
    return InMemorySaver()


def build_graph_builder():
    """Build the LangGraph StateGraph builder (without compiling)."""
    builder = StateGraph(JourniState)

    # Add nodes
    builder.add_node("process", process_message)
    builder.add_node("tools", execute_tools)
    builder.add_node("respond", generate_response)

    # Add edges
    builder.add_edge(START, "process")
    builder.add_conditional_edges(
        "process",
        should_execute_tools,
        {
            "tools": "tools",
            "end": END
        }
    )
    builder.add_conditional_edges(
        "tools",
        should_continue_after_tools,
        {
            "respond": "respond",
            "end": END
        }
    )
    builder.add_edge("respond", END)

    return builder


def build_graph(checkpointer=None):
    """Build and compile the LangGraph agent with given checkpointer."""
    builder = build_graph_builder()
    if checkpointer is None:
        checkpointer = get_sync_checkpointer()
    return builder.compile(checkpointer=checkpointer)


async def get_graph():
    """Get or create the graph with async checkpointer."""
    global _graph

    if _graph is not None:
        return _graph

    checkpointer = await get_async_checkpointer()
    builder = build_graph_builder()
    _graph = builder.compile(checkpointer=checkpointer)
    return _graph


# Initial graph with InMemorySaver (will be replaced on startup with async version)
graph = build_graph()


# ============== HELPER FUNCTIONS ==============

def get_initial_state(session_name: str = "", participants: list = None) -> JourniState:
    """Create initial state for a new session."""
    return {
        "messages": [],
        "expenses": [],
        "payments": [],
        "participants": participants or [],
        "balances": {},
        "session_name": session_name,
        "session_context": {},
        "milestones": [],
        "photos": []
    }
