import sys
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.execution_log import ExecutionLog
from app.models.workflow_run import WorkflowRun
from app.routers.auth import get_current_active_user_optional
from app.schemas.run import AuditLogRequest

router = APIRouter(tags=["Logs & Monitoring"])

# Standard 12-Factor App Logger outputting to sys.stdout (Factor XI: Logs as event streams)
logger = logging.getLogger("app.audit")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter("[%(asctime)s] [AUDIT] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

@router.post("/api/audit-log", summary="บันทึก User Activity Audit Log (stdout & Database)")
async def write_audit_log(
    payload: AuditLogRequest,
    current_user: Optional[User] = Depends(get_current_active_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    12-Factor App logging:
    1. Emits structured log line to stdout for Docker / Coolify logging drivers.
    2. Persists immutable audit record to PostgreSQL database (audit_logs table).
    No disk file I/O is performed.
    """
    timestamp_iso = datetime.utcnow().isoformat()
    src_file = payload.source.get("file", "main.py") if payload.source else "main.py"
    username = current_user.username if current_user else "anonymous"
    user_id = current_user.id if current_user else None
    details_str = json.dumps(payload.details or {}, ensure_ascii=False)
    tab_name = payload.tab.upper() if payload.tab else "GENERAL"

    # 1. 12-Factor stdout stream
    log_msg = f"[{tab_name}] USER: {username} | ACTION: {payload.action} | FILE: {src_file} | DETAILS: {details_str}"
    logger.info(log_msg)
    sys.stdout.flush()

    # 2. Database persistence
    try:
        audit_entry = AuditLog(
            user_id=user_id,
            username=username,
            action=payload.action,
            tab=payload.tab or "general",
            source_file=src_file,
            details=details_str,
            level="INFO"
        )
        db.add(audit_entry)
        await db.commit()
    except Exception as e:
        logger.warning(f"Could not persist audit log to DB: {e}")
        await db.rollback()

    return {"success": True}

@router.get("/api/system-logs", summary="ดึง System Logs ล่าสุด (จาก Database)")
async def get_system_logs(
    limit: int = Query(100, ge=1, le=500),
    current_user: Optional[User] = Depends(get_current_active_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if current_user and current_user.role not in ['superadmin', 'admin']:
        raise HTTPException(status_code=403, detail="Permission denied: Only Administrators and Superadmins can view system logs")

    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit)
    res = await db.execute(stmt)
    audit_entries = res.scalars().all()

    # Format as list of strings matching frontend tray expectations
    formatted_logs = [
        f"[{entry.timestamp.isoformat()}] [{entry.tab.upper() if entry.tab else 'SYSTEM'}] USER: {entry.username or 'anonymous'} | ACTION: {entry.action} | FILE: {entry.source_file or 'app'} | {entry.details or '{}'}"
        for entry in reversed(audit_entries)
    ]
    return {"logs": formatted_logs}

@router.get("/api/ai-logs", summary="ดึง AI Generation Logs (จาก Database)")
async def get_ai_logs(
    limit: int = Query(100, ge=1, le=500),
    current_user: Optional[User] = Depends(get_current_active_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if current_user and current_user.role not in ['superadmin', 'admin']:
        raise HTTPException(status_code=403, detail="Permission denied: Only Administrators and Superadmins can view AI logs")

    stmt = select(AuditLog).where(AuditLog.tab == "ai").order_by(desc(AuditLog.timestamp)).limit(limit)
    res = await db.execute(stmt)
    entries = res.scalars().all()

    formatted_logs = [
        f"[{entry.timestamp.isoformat()}] [AI] ACTION: {entry.action} | DETAILS: {entry.details or '{}'}"
        for entry in reversed(entries)
    ]
    return {"logs": formatted_logs}

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

@router.get("/api/workflows/{wf_id}/logs", summary="ดึง Log ย้อนหลังของ Workflow (จาก Database)")
async def get_wf_logs(
    wf_id: str,
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves workflow execution logs directly from the ExecutionLog database table.
    Eliminates all local file reads from WF/{wf_id}/log/.
    """
    stmt = (
        select(ExecutionLog)
        .join(WorkflowRun, ExecutionLog.run_id == WorkflowRun.id)
        .where(WorkflowRun.workflow_id == wf_id)
        .order_by(desc(ExecutionLog.timestamp))
        .limit(limit)
    )
    res = await db.execute(stmt)
    logs = res.scalars().all()

    return [
        {
            "timestamp": l.timestamp.isoformat() if l.timestamp else datetime.utcnow().isoformat(),
            "level": l.level or "INFO",
            "message": l.message,
            "node_id": l.node_id
        }
        for l in reversed(logs)
    ]
