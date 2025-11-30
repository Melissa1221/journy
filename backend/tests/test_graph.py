"""
Tests for the LangGraph agent (graph.py)
"""
import pytest
import json
from unittest.mock import patch, MagicMock, AsyncMock


class TestTools:
    """Test the tool functions."""

    def test_register_expense_returns_json(self):
        """Test that register_expense returns valid JSON."""
        from graph import register_expense

        result = register_expense.invoke({
            "amount": 50.0,
            "description": "taxi",
            "paid_by": "meli",
            "split_among": ["meli", "andre"]
        })

        data = json.loads(result)
        assert data["action"] == "register_expense"
        assert data["data"]["amount"] == 50.0
        assert data["data"]["description"] == "taxi"
        assert data["data"]["paid_by"] == "meli"
        assert data["data"]["split_among"] == ["meli", "andre"]

    def test_register_expense_without_split(self):
        """Test register_expense with null split_among."""
        from graph import register_expense

        result = register_expense.invoke({
            "amount": 100.0,
            "description": "almuerzo",
            "paid_by": "pedro"
        })

        data = json.loads(result)
        assert data["data"]["split_among"] is None

    def test_get_balance(self):
        """Test get_balance tool."""
        from graph import get_balance

        # With person
        result = get_balance.invoke({"person": "meli"})
        data = json.loads(result)
        assert data["action"] == "get_balance"
        assert data["person"] == "meli"

        # Without person (all)
        result = get_balance.invoke({})
        data = json.loads(result)
        assert data["person"] is None

    def test_get_debts(self):
        """Test get_debts tool."""
        from graph import get_debts

        result = get_debts.invoke({})
        data = json.loads(result)
        assert data["action"] == "get_debts"

    def test_list_expenses(self):
        """Test list_expenses tool."""
        from graph import list_expenses

        result = list_expenses.invoke({})
        data = json.loads(result)
        assert data["action"] == "list_expenses"

    def test_register_payment(self):
        """Test register_payment tool."""
        from graph import register_payment

        result = register_payment.invoke({
            "from_user": "andre",
            "to_user": "meli",
            "amount": 25.0
        })

        data = json.loads(result)
        assert data["action"] == "register_payment"
        assert data["data"]["from_user"] == "andre"
        assert data["data"]["to_user"] == "meli"
        assert data["data"]["amount"] == 25.0

    def test_edit_expense(self):
        """Test edit_expense tool."""
        from graph import edit_expense

        result = edit_expense.invoke({
            "expense_id": "last",
            "split_among": ["meli", "andre", "pedro"]
        })

        data = json.loads(result)
        assert data["action"] == "edit_expense"
        assert data["data"]["expense_id"] == "last"
        assert data["data"]["split_among"] == ["meli", "andre", "pedro"]

    def test_delete_expense(self):
        """Test delete_expense tool."""
        from graph import delete_expense

        result = delete_expense.invoke({"expense_id": "last"})

        data = json.loads(result)
        assert data["action"] == "delete_expense"
        assert data["data"]["expense_id"] == "last"


class TestCheckpointer:
    """Test checkpointer selection logic."""

    def test_uses_memory_saver_without_env(self):
        """Test that InMemorySaver is used when SUPABASE_DB_URL is not set."""
        from langgraph.checkpoint.memory import InMemorySaver

        with patch.dict('os.environ', {}, clear=True):
            with patch('graph.SUPABASE_DB_URL', None):
                from graph import get_checkpointer

                # Force reimport to use patched value
                import importlib
                import graph as graph_module
                importlib.reload(graph_module)

                checkpointer = graph_module.get_checkpointer()
                assert isinstance(checkpointer, InMemorySaver)

    def test_postgres_import_available(self):
        """Test that PostgresSaver can be imported."""
        try:
            from langgraph.checkpoint.postgres import PostgresSaver
            assert PostgresSaver is not None
        except ImportError:
            pytest.fail("langgraph-checkpoint-postgres not installed")


class TestLLMFallback:
    """Test the LLM fallback chain."""

    def test_model_fallback_chain_defined(self):
        """Test that model fallback chain is properly defined."""
        from graph import MODEL_FALLBACK_CHAIN

        assert len(MODEL_FALLBACK_CHAIN) >= 3
        for model, max_tokens in MODEL_FALLBACK_CHAIN:
            assert isinstance(model, str)
            assert isinstance(max_tokens, int)
            assert max_tokens > 0

    def test_llm_manager_exists(self):
        """Test that LLM manager is instantiated."""
        from graph import llm_manager, LLMWithFallback

        assert isinstance(llm_manager, LLMWithFallback)


class TestState:
    """Test state structures."""

    def test_get_initial_state(self):
        """Test initial state creation."""
        from graph import get_initial_state

        state = get_initial_state("test_session", ["meli", "andre"])

        assert state["messages"] == []
        assert state["expenses"] == []
        assert state["payments"] == []
        assert state["participants"] == ["meli", "andre"]
        assert state["balances"] == {}
        assert state["session_name"] == "test_session"
        assert state["session_context"] == {}

    def test_initial_state_defaults(self):
        """Test initial state with defaults."""
        from graph import get_initial_state

        state = get_initial_state()

        assert state["participants"] == []
        assert state["session_name"] == ""


class TestExecuteTools:
    """Test the execute_tools node."""

    @pytest.mark.asyncio
    async def test_execute_register_expense(self):
        """Test executing register_expense tool."""
        from graph import execute_tools

        # Mock an AIMessage with tool call
        mock_message = MagicMock()
        mock_message.tool_calls = [{
            "id": "test_id",
            "name": "register_expense",
            "args": {
                "amount": 100.0,
                "description": "cena",
                "paid_by": "meli",
                "split_among": None
            }
        }]

        state = {
            "messages": [mock_message],
            "expenses": [],
            "payments": [],
            "balances": {},
            "participants": ["meli", "andre"]
        }

        result = await execute_tools(state)

        assert len(result["expenses"]) == 1
        assert result["expenses"][0]["amount"] == 100.0
        assert result["expenses"][0]["paid_by"] == "meli"
        # Should split among all participants
        assert result["expenses"][0]["split_among"] == ["meli", "andre"]

        # Check balances
        # meli paid 100, split between 2, so meli: +100 -50 = +50
        # andre: -50
        assert result["balances"]["meli"] == 50.0
        assert result["balances"]["andre"] == -50.0

    @pytest.mark.asyncio
    async def test_execute_register_payment(self):
        """Test executing register_payment tool."""
        from graph import execute_tools

        mock_message = MagicMock()
        mock_message.tool_calls = [{
            "id": "test_id",
            "name": "register_payment",
            "args": {
                "from_user": "andre",
                "to_user": "meli",
                "amount": 25.0
            }
        }]

        state = {
            "messages": [mock_message],
            "expenses": [],
            "payments": [],
            "balances": {"andre": -50.0, "meli": 50.0},
            "participants": ["meli", "andre"]
        }

        result = await execute_tools(state)

        assert len(result["payments"]) == 1
        assert result["payments"][0]["amount"] == 25.0
        # andre paid 25, so balance goes up
        assert result["balances"]["andre"] == -25.0
        # meli received 25, so balance goes down
        assert result["balances"]["meli"] == 25.0

    @pytest.mark.asyncio
    async def test_execute_delete_expense(self):
        """Test executing delete_expense tool."""
        from graph import execute_tools

        mock_message = MagicMock()
        mock_message.tool_calls = [{
            "id": "test_id",
            "name": "delete_expense",
            "args": {"expense_id": "last"}
        }]

        state = {
            "messages": [mock_message],
            "expenses": [{
                "id": "exp_1",
                "amount": 100.0,
                "description": "test",
                "paid_by": "meli",
                "split_among": ["meli", "andre"],
                "timestamp": ""
            }],
            "payments": [],
            "balances": {"meli": 50.0, "andre": -50.0},
            "participants": ["meli", "andre"]
        }

        result = await execute_tools(state)

        assert len(result["expenses"]) == 0
        # Balances should be reversed
        assert result["balances"]["meli"] == 0.0
        assert result["balances"]["andre"] == 0.0


class TestGraphBuild:
    """Test graph building."""

    def test_graph_builds_successfully(self):
        """Test that the graph can be built."""
        from graph import build_graph

        # This should not raise
        graph = build_graph()
        assert graph is not None

    def test_graph_has_required_nodes(self):
        """Test that graph has all required nodes."""
        from graph import graph

        # Graph should be compiled
        assert graph is not None


class TestResponseFiltering:
    """Test response filtering functions from main.py."""

    def test_filter_json_from_response_removes_action_json(self):
        """Test that JSON tool outputs are removed."""
        import sys
        sys.path.insert(0, '.')
        from main import filter_json_from_response

        # Text with embedded JSON
        text = 'Listo! {"action": "register_expense", "data": {"amount": 50}} Registrado.'
        result = filter_json_from_response(text)
        assert '"action"' not in result
        assert 'Listo!' in result

    def test_filter_json_preserves_clean_text(self):
        """Test that clean text is preserved."""
        from main import filter_json_from_response

        text = "Registré tu gasto de S/50.00 por taxi"
        result = filter_json_from_response(text)
        assert result == text

    def test_is_tool_related_content_detects_json(self):
        """Test detection of tool-related content."""
        from main import is_tool_related_content

        assert is_tool_related_content('{"action": "register_expense"}') is True
        assert is_tool_related_content('Hola, ¿cómo puedo ayudarte?') is False
        assert is_tool_related_content('') is False

    def test_extract_structured_data(self):
        """Test structured data extraction."""
        from main import extract_structured_data

        state = {
            "expenses": [{"id": "exp_1", "amount": 50}],
            "payments": [{"id": "pay_1", "amount": 25}],
            "balances": {"meli": 25.0, "andre": -25.0},
            "participants": ["meli", "andre"]
        }

        result = extract_structured_data(state)
        assert result["expenses"] == state["expenses"]
        assert result["payments"] == state["payments"]
        assert result["balances"] == state["balances"]
        assert result["participants"] == state["participants"]
        assert result["last_action"] is None

    def test_detect_action_expense_added(self):
        """Test detection of expense added action."""
        from main import detect_action_from_expenses

        old_expenses = []
        new_expenses = [{"id": "exp_1", "amount": 50}]

        result = detect_action_from_expenses(old_expenses, new_expenses, [], [])
        assert result["type"] == "expense_added"
        assert result["data"]["id"] == "exp_1"

    def test_detect_action_expense_deleted(self):
        """Test detection of expense deleted action."""
        from main import detect_action_from_expenses

        old_expenses = [{"id": "exp_1", "amount": 50}]
        new_expenses = []

        result = detect_action_from_expenses(old_expenses, new_expenses, [], [])
        assert result["type"] == "expense_deleted"
        assert result["data"]["id"] == "exp_1"

    def test_detect_action_expense_edited(self):
        """Test detection of expense edited action."""
        from main import detect_action_from_expenses

        old_expenses = [{"id": "exp_1", "amount": 50}]
        new_expenses = [{"id": "exp_1", "amount": 75}]

        result = detect_action_from_expenses(old_expenses, new_expenses, [], [])
        assert result["type"] == "expense_edited"
        assert result["data"]["amount"] == 75
        assert result["old_data"]["amount"] == 50

    def test_detect_action_payment_added(self):
        """Test detection of payment added action."""
        from main import detect_action_from_expenses

        old_payments = []
        new_payments = [{"id": "pay_1", "amount": 25}]

        result = detect_action_from_expenses([], [], old_payments, new_payments)
        assert result["type"] == "payment_added"
        assert result["data"]["id"] == "pay_1"

    def test_detect_action_no_change(self):
        """Test detection when no changes occurred."""
        from main import detect_action_from_expenses

        result = detect_action_from_expenses([], [], [], [])
        assert result is None


class TestMultimodalSupport:
    """Test multimodal/image support functions."""

    def test_build_multimodal_content_text_only(self):
        """Test that text-only messages return string."""
        from main import build_multimodal_content

        result = build_multimodal_content("Hello world", None)
        assert result == "Hello world"
        assert isinstance(result, str)

    def test_build_multimodal_content_with_image(self):
        """Test that messages with images return content blocks."""
        from main import build_multimodal_content

        # Minimal valid base64 image data
        fake_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

        result = build_multimodal_content("Registra este recibo", fake_base64)

        assert isinstance(result, list)
        assert len(result) == 2

        # Check text block
        assert result[0]["type"] == "text"
        assert result[0]["text"] == "Registra este recibo"

        # Check image block
        assert result[1]["type"] == "image_url"
        assert "image_url" in result[1]
        assert result[1]["image_url"]["url"].startswith("data:image/jpeg;base64,")

    def test_build_multimodal_content_with_data_url(self):
        """Test handling of data URL format images."""
        from main import build_multimodal_content

        data_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"

        result = build_multimodal_content("Analiza esto", data_url)

        assert isinstance(result, list)
        # Should extract the correct media type
        assert "image/png" in result[1]["image_url"]["url"]

    def test_build_multimodal_content_empty_image(self):
        """Test that empty image string returns text only."""
        from main import build_multimodal_content

        result = build_multimodal_content("Just text", "")
        assert result == "Just text"
        assert isinstance(result, str)
