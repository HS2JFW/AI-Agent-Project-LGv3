from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Any

router = APIRouter(tags=["Scheduler & Automation"])

class SchedulerRequest(BaseModel):
    enabled: bool = True
    cron: Optional[str] = "*/5 * * * *"
    action: Optional[str] = "run"

@router.post("/api/workflows/{wf_id}/scheduler", summary="เปิด/ปิด หรือตั้งรอบเวลาการรัน Workflow")
async def configure_scheduler(wf_id: str, payload: SchedulerRequest):
    return {
        "status": "success",
        "workflow_id": wf_id,
        "scheduler_enabled": payload.enabled,
        "cron": payload.cron,
        "message": f"Scheduler {'enabled' if payload.enabled else 'disabled'} for workflow {wf_id}"
    }

@router.post("/api/workflows/{wf_id}/node/{node_id}/run_query_loop", summary="สั่งรัน Query Loop ประมวลผลซ้ำเฉพาะโหนด")
async def run_query_loop(wf_id: str, node_id: str):
    return {
        "status": "success",
        "workflow_id": wf_id,
        "node_id": node_id,
        "message": "Query loop triggered"
    }

