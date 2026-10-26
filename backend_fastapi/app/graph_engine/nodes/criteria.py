from typing import Dict, Any
from app.graph_engine.nodes.base import WorkflowNode
from app.graph_engine.state import WorkflowState

class Rubric(WorkflowNode):
    async def execute(self, state: WorkflowState) -> Dict[str, Any]:
        self.resolve_inputs(state)
        rubric_data = self.node_data.get("rubricData") or self.parameters.get("rubric", {})
        self.output_data = rubric_data
        return {
            "active_node": self.node_id,
            "variables": {f"{self.node_id}_output": self.output_data}
        }

class Multi_Criteria_Analysis(WorkflowNode):
    async def execute(self, state: WorkflowState) -> Dict[str, Any]:
        self.resolve_inputs(state)
        mca_data = self.node_data.get("mcaData") or self.parameters.get("mca", {})
        self.output_data = mca_data
        return {
            "active_node": self.node_id,
            "variables": {f"{self.node_id}_output": self.output_data}
        }

class Table(WorkflowNode):
    async def execute(self, state: WorkflowState) -> Dict[str, Any]:
        self.resolve_inputs(state)
        table_data = self.node_data.get("tableData") or self.parameters.get("table", {})
        self.output_data = table_data
        return {
            "active_node": self.node_id,
            "variables": {f"{self.node_id}_output": self.output_data}
        }

class Sample(WorkflowNode):
    async def execute(self, state: WorkflowState) -> Dict[str, Any]:
        self.resolve_inputs(state)
        sample_data = self.node_data.get("sampleData") or self.parameters.get("sample", {})
        self.output_data = sample_data
        return {
            "active_node": self.node_id,
            "variables": {f"{self.node_id}_output": self.output_data}
        }

