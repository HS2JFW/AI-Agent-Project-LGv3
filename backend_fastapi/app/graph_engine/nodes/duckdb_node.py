from typing import Dict, Any
from app.graph_engine.nodes.base import WorkflowNode
from app.graph_engine.state import WorkflowState
from app.services.analytics_service import query_duckdb

class DuckDB_Engine(WorkflowNode):
    async def execute(self, state: WorkflowState) -> Dict[str, Any]:
        self.resolve_inputs(state)
        run_id = state.get("current_run_id", "")
        await self.log(run_id, f"DuckDB Engine '{self.label}' executing SQL...")

        sql_query = self.parameters.get("query", "SELECT 1 as test;")
        result = query_duckdb(sql_query)

        self.output_data = result
        await self.log(run_id, f"DuckDB executed in {result.get('execution_time_sec', 0)}s, returned {result.get('row_count', 0)} rows.")

        if self.node_complete_callback:
            await self.node_complete_callback(self.node_id, self.output_data)

        return {
            "active_node": self.node_id,
            "logs": [f"[{self.label}] Query completed."],
            "variables": {
                f"{self.node_id}_output": self.output_data
            }
        }

