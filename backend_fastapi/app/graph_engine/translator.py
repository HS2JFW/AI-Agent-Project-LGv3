from typing import List, Dict, Any, Optional, Callable
import json
from langgraph.graph import StateGraph, START, END
from app.graph_engine.state import WorkflowState
from app.graph_engine.node_factory import create_node_instance
from app.services.sse_service import sse_manager
from app.database import AsyncSessionLocal
from app.models.workflow import Workflow
from app.models.workflow_run import WorkflowRun

def create_node_executor(
    node_id: str,
    node_type: str,
    node_data: Dict[str, Any],
    log_callback: Optional[Callable] = None,
    node_complete_callback: Optional[Callable] = None
):
    instance = create_node_instance(node_id, node_type, node_data, log_callback, node_complete_callback)
    label = node_data.get("label", node_data.get("name", node_id))

    async def executor(state: WorkflowState):
        variables = state.get("variables", {})
        selected_nodes = variables.get("selected_node_ids")

        # Subflow bypass check: restore cached output if unselected
        if selected_nodes and isinstance(selected_nodes, list) and node_id not in selected_nodes:
            if log_callback:
                await log_callback(
                    state.get("current_run_id", ""),
                    node_id,
                    f"[Skip] โหนด '{label}' ข้ามการทำงาน แต่ดึงข้อมูลเดิมจากแคชให้โหนดถัดไป",
                    "INFO"
                )
            params = node_data.get("parameters", {})
            cached_output = (
                params.get("apiOutput") or params.get("agentResult") or
                params.get("output") or None
            )
            return {
                "active_node": node_id,
                "logs": [f"[{label}] Restored cached output."],
                "variables": {f"{node_id}_output": cached_output}
            }

        return await instance.execute(state)

    return executor

def translate_to_langgraph(
    nodes_list: List[Dict[str, Any]],
    edges_list: List[Dict[str, Any]],
    log_callback: Optional[Callable] = None,
    node_complete_callback: Optional[Callable] = None
) -> StateGraph:
    workflow = StateGraph(WorkflowState)

    if not nodes_list:
        async def empty_node(state: WorkflowState):
            return state
        workflow.add_node("empty", empty_node)
        workflow.add_edge(START, "empty")
        workflow.add_edge("empty", END)
        return workflow

    # 1. Add all nodes
    for node in nodes_list:
        n_id = node.get("id")
        n_type = node.get("type", "customNode")
        n_data = node.get("data", {})
        executor = create_node_executor(n_id, n_type, n_data, log_callback, node_complete_callback)
        workflow.add_node(n_id, executor)

    # 2. Find start nodes
    incoming_counts = {node.get("id"): 0 for node in nodes_list}
    for edge in edges_list:
        target = edge.get("target")
        if target in incoming_counts:
            incoming_counts[target] += 1

    start_nodes = [n_id for n_id, count in incoming_counts.items() if count == 0]
    if not start_nodes and nodes_list:
        start_nodes.append(nodes_list[0].get("id"))

    for start_id in start_nodes:
        workflow.add_edge(START, start_id)

    # 3. Add edges with looping support
    outgoing_edges: Dict[str, List[Dict[str, Any]]] = {n.get("id"): [] for n in nodes_list}
    for edge in edges_list:
        src = edge.get("source")
        if src in outgoing_edges:
            outgoing_edges[src].append(edge)

    for node in nodes_list:
        n_id = node.get("id")
        edges = outgoing_edges.get(n_id, [])
        targets = [e.get("target") for e in edges]
        valid_targets = [e.get("target") for e in edges if e.get("sourceHandle") != "invalid"]
        invalid_targets = [e.get("target") for e in edges if e.get("sourceHandle") == "invalid"]

        n_name = (node.get("data", {}).get("name") or node.get("data", {}).get("label") or "").lower()
        is_looping_node = "agent" in n_name or "queue" in n_name or "ocr" in n_name

        if is_looping_node:
            def make_conditional_router(node_id, targets, valid_targets, invalid_targets, n_name):
                def condition_fn(state: WorkflowState):
                    has_next = state.get("variables", {}).get("hasNext") or state.get("variables", {}).get("has_next")
                    if has_next:
                        return [node_id]  # Loop back
                    if "audit" in n_name:
                        audit_valid = state.get("variables", {}).get(f"{node_id}_audit_valid")
                        if audit_valid is True:
                            return valid_targets if valid_targets else [END]
                        elif audit_valid is False:
                            return invalid_targets if invalid_targets else [END]
                    return targets if targets else [END]
                return condition_fn

            workflow.add_conditional_edges(
                n_id,
                make_conditional_router(n_id, targets, valid_targets, invalid_targets, n_name)
            )
        else:
            if not targets:
                workflow.add_edge(n_id, END)
            else:
                for target in targets:
                    workflow.add_edge(n_id, target)

    return workflow

async def run_langgraph_workflow(wf_id: str, run_id: str, variables: Dict[str, Any]):
    """
    Main asynchronous background task to execute a workflow using LangGraph Python.
    """
    async with AsyncSessionLocal() as session:
        wf = await session.get(Workflow, wf_id)
        run = await session.get(WorkflowRun, run_id)
        if not wf or not run:
            return

        try:
            nodes = json.loads(wf.nodes or "[]")
            edges = json.loads(wf.edges or "[]")
        except Exception:
            nodes, edges = [], []

        # Prepare variables
        exec_variables = dict(variables or {})
        exec_variables["_workflow_nodes"] = nodes
        exec_variables["_workflow_edges"] = edges
        exec_variables["workflow_id"] = wf_id

        async def log_callback(r_id: str, node_id: str, message: str, level: str = "INFO"):
            await sse_manager.emit_log(r_id, node_id, message, level)

        async def node_complete_callback(node_id: str, outputs: Any):
            await sse_manager.emit_node_complete(run_id, node_id, outputs)

        try:
            workflow_graph = translate_to_langgraph(nodes, edges, log_callback, node_complete_callback)
            app = workflow_graph.compile()

            initial_state = {
                "workflow_id": wf_id,
                "current_run_id": run_id,
                "logs": [],
                "variables": exec_variables,
                "active_node": "",
                "messages": []
            }

            final_state = await app.ainvoke(initial_state)

            run.status = "completed"
            run.variables = json.dumps(final_state.get("variables", {}))
            await session.commit()

            await sse_manager.emit_complete(run_id, status="completed", variables=final_state.get("variables"))
        except Exception as e:
            run.status = "failed"
            await session.commit()
            await sse_manager.emit_complete(run_id, status="failed", error=str(e))

