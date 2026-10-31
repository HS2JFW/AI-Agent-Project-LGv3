from fastapi import APIRouter, Depends, HTTPException
from app.models.user import User
from app.routers.auth import get_current_active_user_optional
from pydantic import BaseModel
from typing import Optional, Any

router = APIRouter(tags=["Scheduler & Automation"])

class SchedulerRequest(BaseModel):
    enabled: bool = True
    cron: Optional[str] = "*/5 * * * *"
    action: Optional[str] = "run"

@router.post("/api/workflows/{wf_id}/scheduler", summary="เปิด/ปิด หรือตั้งรอบเวลาการรัน Workflow")
async def configure_scheduler(wf_id: str, payload: SchedulerRequest, current_user: Optional[User] = Depends(get_current_active_user_optional)):
    if current_user and current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot configure scheduler")
    return {
        "status": "success",
        "workflow_id": wf_id,
        "scheduler_enabled": payload.enabled,
        "cron": payload.cron,
        "message": f"Scheduler {'enabled' if payload.enabled else 'disabled'} for workflow {wf_id}"
    }

@router.post("/api/workflows/{wf_id}/node/{node_id}/run_query_loop", summary="สั่งรัน Query Loop ประมวลผลซ้ำเฉพาะโหนด")
async def run_query_loop(wf_id: str, node_id: str, current_user: Optional[User] = Depends(get_current_active_user_optional)):
    if current_user and current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot trigger query loop")
    return {
        "status": "success",
        "workflow_id": wf_id,
        "node_id": node_id,
        "message": "Query loop triggered"
    }

