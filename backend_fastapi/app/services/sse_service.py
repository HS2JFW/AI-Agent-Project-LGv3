import asyncio
from typing import Dict, Any

class SSEManager:
    def __init__(self):
        # Maps run_id -> asyncio.Queue of event dicts
        self.active_streams: Dict[str, asyncio.Queue] = {}

    def get_queue(self, run_id: str) -> asyncio.Queue:
        if run_id not in self.active_streams:
            self.active_streams[run_id] = asyncio.Queue()
        return self.active_streams[run_id]

    async def emit_log(self, run_id: str, node_id: str, message: str, level: str = "INFO"):
        if run_id in self.active_streams:
            await self.active_streams[run_id].put({
                "type": "log",
                "data": {
                    "node_id": node_id,
                    "message": message,
                    "level": level
                }
            })

    async def emit_node_complete(self, run_id: str, node_id: str, outputs: Any):
        if run_id in self.active_streams:
            await self.active_streams[run_id].put({
                "type": "node_complete",
                "data": {
                    "node_id": node_id,
                    "outputs": outputs
                }
            })

    async def emit_complete(self, run_id: str, status: str = "completed", variables: Any = None, error: str = None):
        if run_id in self.active_streams:
            await self.active_streams[run_id].put({
                "type": "complete",
                "data": {
                    "status": status,
                    "variables": variables or {},
                    "error": error
                }
            })
            # Signal end of stream
            await self.active_streams[run_id].put(None)

    def cleanup(self, run_id: str):
        if run_id in self.active_streams:
            del self.active_streams[run_id]

sse_manager = SSEManager()

