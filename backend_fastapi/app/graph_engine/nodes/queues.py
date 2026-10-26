from typing import Dict, Any
import os
from app.graph_engine.nodes.base import WorkflowNode
from app.graph_engine.state import WorkflowState
from app.config import QUEUE_PDF_TEMP_DIR, QUEUE_TXT_TEMP_DIR, QUEUE_ZIP_TEMP_DIR

class QueueNode(WorkflowNode):
    queue_dir = QUEUE_PDF_TEMP_DIR
    queue_key = "pdfQueue"

    async def execute(self, state: WorkflowState) -> Dict[str, Any]:
        self.resolve_inputs(state)
        run_id = state.get("current_run_id", "")
        await self.log(run_id, f"Checking files in {self.label}...")

        # Scan files in directory
        files = []
        if os.path.exists(self.queue_dir):
            files = sorted([f for f in os.listdir(self.queue_dir) if not f.startswith(".")])

        # Current processing index tracked in variables
        current_index = state.get("variables", {}).get(f"{self.node_id}_index", 0)
        total_files = len(files)

        if total_files > 0 and current_index < total_files:
            current_file = files[current_index]
            file_path = os.path.join(self.queue_dir, current_file)
            has_next = (current_index + 1) < total_files
            next_index = current_index + 1

            await self.log(run_id, f"Processing [{next_index}/{total_files}]: {current_file}")

            output_payload = {
                "current_file": current_file,
                "file_path": file_path,
                "index": current_index,
                "total": total_files,
                "hasNext": has_next
            }
            self.output_data = output_payload

            if self.node_complete_callback:
                await self.node_complete_callback(self.node_id, self.output_data)

            return {
                "active_node": self.node_id,
                "logs": [f"[{self.label}] Fed file: {current_file}"],
                "variables": {
                    f"{self.node_id}_output": self.output_data,
                    f"{self.node_id}_index": next_index,
                    "hasNext": has_next,
                    "has_next": has_next,
                    "current_queue_file": file_path
                }
            }
        else:
            await self.log(run_id, f"All files in {self.label} processed.")
            self.output_data = {"hasNext": False, "status": "completed"}
            return {
                "active_node": self.node_id,
                "logs": [f"[{self.label}] Queue finished."],
                "variables": {
                    "hasNext": False,
                    "has_next": False,
                    f"{self.node_id}_index": 0
                }
            }

class PDF_Queue(QueueNode):
    queue_dir = str(QUEUE_PDF_TEMP_DIR)
    queue_key = "pdfQueue"

class TXT_Queue(QueueNode):
    queue_dir = str(QUEUE_TXT_TEMP_DIR)
    queue_key = "txtQueue"

class Zip_Queue(QueueNode):
    queue_dir = str(QUEUE_ZIP_TEMP_DIR)
    queue_key = "zipQueue"

