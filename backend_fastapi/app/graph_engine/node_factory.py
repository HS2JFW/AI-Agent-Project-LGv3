from typing import Dict, Any, Optional, Callable
from app.graph_engine.nodes import (
    WorkflowNode, Agent, PDF_to_Image_Agent, Agent_Audit,
    PDF_Queue, TXT_Queue, Zip_Queue, DuckDB_Engine,
    Rubric, Multi_Criteria_Analysis, Table, Sample
)

def create_node_instance(
    node_id: str,
    node_type: str,
    node_data: Dict[str, Any],
    log_callback: Optional[Callable] = None,
    node_complete_callback: Optional[Callable] = None
) -> WorkflowNode:
    raw_key = (
        node_data.get("nodeClass") or
        node_data.get("nodeType") or
        node_type or
        node_data.get("name") or
        node_data.get("label") or
        ""
    ).lower().strip()

    key_space = raw_key.replace("_", " ").replace("-", " ")

    # 1. Queues
    if "pdf queue" in key_space or "queue pdf" in key_space:
        return PDF_Queue(node_id, node_type, node_data, log_callback, node_complete_callback)
    if "txt queue" in key_space or "queue txt" in key_space:
        return TXT_Queue(node_id, node_type, node_data, log_callback, node_complete_callback)
    if "zip queue" in key_space or "queue zip" in key_space:
        return Zip_Queue(node_id, node_type, node_data, log_callback, node_complete_callback)

    # 2. OCR & Agents
    if "pdf to image" in key_space or "agent pdfs image" in key_space:
        return PDF_to_Image_Agent(node_id, node_type, node_data, log_callback, node_complete_callback)
    if "audit" in key_space:
        return Agent_Audit(node_id, node_type, node_data, log_callback, node_complete_callback)
    if "duckdb" in key_space:
        return DuckDB_Engine(node_id, node_type, node_data, log_callback, node_complete_callback)
    if "agent" in key_space:
        return Agent(node_id, node_type, node_data, log_callback, node_complete_callback)

    # 3. Criteria
    if "rubric" in key_space:
        return Rubric(node_id, node_type, node_data, log_callback, node_complete_callback)
    if "multi criteria" in key_space or "mca" in key_space:
        return Multi_Criteria_Analysis(node_id, node_type, node_data, log_callback, node_complete_callback)
    if "sample" in key_space:
        return Sample(node_id, node_type, node_data, log_callback, node_complete_callback)
    if "table" in key_space:
        return Table(node_id, node_type, node_data, log_callback, node_complete_callback)

    return WorkflowNode(node_id, node_type, node_data, log_callback, node_complete_callback)

