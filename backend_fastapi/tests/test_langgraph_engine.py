import pytest
from app.graph_engine.node_factory import create_node_instance
from app.graph_engine.translator import translate_to_langgraph
from app.graph_engine.state import WorkflowState

@pytest.mark.asyncio
async def test_node_factory_creation():
    # 1. OCR Node
    ocr_node = create_node_instance("ocr-1", "customNode", {"category": "ocr", "name": "Thai Verbatim OCR"})
    assert ocr_node.node_id == "ocr-1"

    # 2. General / Custom Node
    custom_node = create_node_instance("custom-1", "customNode", {"category": "general", "label": "Custom Step"})
    assert custom_node.node_id == "custom-1"

@pytest.mark.asyncio
async def test_translate_empty_graph():
    graph = translate_to_langgraph([], [])
    app = graph.compile()
    initial_state: WorkflowState = {
        "current_run_id": "test-run-empty",
        "active_node": None,
        "logs": [],
        "variables": {},
        "documents": [],
        "errors": []
    }
    result = await app.ainvoke(initial_state)
    assert result is not None

@pytest.mark.asyncio
async def test_translate_and_execute_linear_graph():
    nodes = [
        {
            "id": "step_a",
            "type": "customNode",
            "data": {"name": "Extract Source", "parameters": {"apiOutput": "sample data"}}
        },
        {
            "id": "step_b",
            "type": "customNode",
            "data": {"name": "Transform Data", "parameters": {}}
        }
    ]
    edges = [
        {"id": "e_a_b", "source": "step_a", "target": "step_b"}
    ]

    graph = translate_to_langgraph(nodes, edges)
    app = graph.compile()

    initial_state: WorkflowState = {
        "current_run_id": "test-linear-run",
        "active_node": None,
        "logs": [],
        "variables": {},
        "documents": [],
        "errors": []
    }

    final_state = await app.ainvoke(initial_state)
    assert final_state is not None
    assert final_state.get("active_node") == "step_b"

