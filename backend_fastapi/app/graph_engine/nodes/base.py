from typing import Dict, Any, Optional, Callable
import asyncio
from app.graph_engine.state import WorkflowState

class WorkflowNode:
    def __init__(
        self,
        node_id: str,
        node_type: str,
        node_data: Dict[str, Any],
        log_callback: Optional[Callable] = None,
        node_complete_callback: Optional[Callable] = None
    ):
        self.node_id = node_id
        self.node_type = node_type
        self.node_data = node_data or {}
        self.label = self.node_data.get("label", self.node_data.get("name", node_type))
        self.category = self.node_data.get("category", "")
        self.parameters = self.node_data.get("parameters", {})
        self.log_callback = log_callback
        self.node_complete_callback = node_complete_callback
        self.input_data = None
        self.output_data = None

    async def log(self, run_id: str, message: str, level: str = "INFO"):
        if self.log_callback:
            await self.log_callback(run_id, self.node_id, message, level)
        else:
            print(f"[{self.label} | {level}] {message}")

    def resolve_inputs(self, state: WorkflowState):
        variables = state.get("variables", {})
        wf_edges = variables.get("_workflow_edges", [])
        incoming_edges = [e for e in wf_edges if e.get("target") == self.node_id]

        for edge in incoming_edges:
            src_id = edge.get("source")
            if not src_id:
                continue

            output_val = variables.get(f"{src_id}_output")
            if output_val is None:
                output_val = variables.get(f"{src_id}_api_result")
            if output_val is None:
                output_val = variables.get(f"{src_id}_json_data")

            self.input_data = output_val

    async def execute(self, state: WorkflowState) -> Dict[str, Any]:
        self.resolve_inputs(state)
        run_id = state.get("current_run_id", "")
        await self.log(run_id, f"Node '{self.label}' ({self.node_type}) started execution.")

        # Simulate standard processing
        await asyncio.sleep(0.5)

        output_msg = f"Processed node: {self.label}"
        self.output_data = output_msg
        await self.log(run_id, f"Node '{self.label}' completed execution.")

        if self.node_complete_callback:
            await self.node_complete_callback(self.node_id, self.output_data)

        return {
            "active_node": self.node_id,
            "logs": [f"[{self.label}] {output_msg}"],
            "variables": {
                f"{self.node_id}_output": self.output_data
            }
        }

