import os
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.models.user import User
from app.routers.auth import get_current_active_user_optional
from app.config import LOGS_DIR, BASE_DIR
from app.schemas.run import AuditLogRequest

router = APIRouter(tags=["Logs & Monitoring"])

AUDIT_LOG_FILE = os.path.join(BASE_DIR, "user_activity.log")
SYSTEM_LOG_FILE = os.path.join(LOGS_DIR, "system.log")
AI_LOG_FILE = os.path.join(LOGS_DIR, "ai.log")

@router.post("/api/audit-log", summary="บันทึก User Activity Audit Log")
async def write_audit_log(payload: AuditLogRequest):
    timestamp = datetime.utcnow().isoformat()
    src_file = payload.source.get("file", "main.py") if payload.source else "main.py"
    log_line = f"[{timestamp}] [File: {src_file}] [{payload.tab.upper()}] ACTION: {payload.action} | DETAILS: {json.dumps(payload.details or {})}\n"
    with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_line)
    return {"success": True}

@router.get("/api/system-logs", summary="ดึง System Logs ล่าสุด")
async def get_system_logs(current_user: Optional[User] = Depends(get_current_active_user_optional)):
    if current_user and current_user.role not in ['superadmin', 'admin']:
        raise HTTPException(status_code=403, detail="Permission denied: Only Administrators and Superadmins can view system logs")
    if not os.path.exists(SYSTEM_LOG_FILE):
        return {"logs": []}
    with open(SYSTEM_LOG_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return {"logs": lines[-200:]}

@router.get("/api/ai-logs", summary="ดึง AI Generation Logs")
async def get_ai_logs(current_user: Optional[User] = Depends(get_current_active_user_optional)):
    if current_user and current_user.role not in ['superadmin', 'admin']:
        raise HTTPException(status_code=403, detail="Permission denied: Only Administrators and Superadmins can view AI logs")
    if not os.path.exists(AI_LOG_FILE):
        return {"logs": []}
    with open(AI_LOG_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return {"logs": lines[-200:]}

@router.get("/api/processes/active-state", summary="ตรวจสอบสถานะ Active Process")
async def get_active_process_state():
    return {
        "status": "online",
        "active_processes": 0,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/api/init-process", summary="ดึงข้อมูลเริ่มต้นของ Process Monitor")
async def init_process():
    return {
        "initialized": True,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/api/nodes/{node_id}/progress", summary="ดึงความคืบหน้าของ Node")
async def get_node_progress(node_id: str):
    return {"node_id": node_id, "progress": 100, "status": "idle"}

@router.get("/api/workflows/{wf_id}/progress", summary="ดึงความคืบหน้ารวมของ Workflow")
async def get_workflow_progress(wf_id: str):
    return {"workflow_id": wf_id, "progress": 100, "status": "idle"}

@router.get("/api/workflows/{wf_id}/logs", summary="ดึง Log ย้อนหลังของ Workflow")
async def get_wf_logs(wf_id: str):
    wf_log_file = os.path.join(BASE_DIR, "WF", wf_id, "log", f"{wf_id}.log")
    if not os.path.exists(wf_log_file):
        return []
    with open(wf_log_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return [{"timestamp": datetime.utcnow().isoformat(), "level": "INFO", "message": l.strip()} for l in lines]

