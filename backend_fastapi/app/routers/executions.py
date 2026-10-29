from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import json
import uuid
from app.database import get_db
from app.models.workflow import Workflow
from app.models.workflow_run import WorkflowRun
from app.models.user import User
from app.schemas.run import RunRequest, RunResponse, NodeExecuteRequest
from app.services.sse_service import sse_manager
from app.graph_engine.translator import run_langgraph_workflow
from app.graph_engine.node_factory import create_node_instance
from app.routers.auth import get_current_active_user_optional

router = APIRouter(tags=["Executions"])

@router.post("/api/workflows/{wf_id}/run", response_model=RunResponse, summary="สั่งเริ่มรัน Workflow ด้วย LangGraph")
async def execute_workflow(
    wf_id: str,
    payload: RunRequest,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_current_active_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if current_user and current_user.role == "viewer":
        raise HTTPException(
            status_code=403,
            detail="Permission denied: Role 'viewer' has read-only access and cannot execute workflows"
        )

    wf = await db.get(Workflow, wf_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Create run record
    run = WorkflowRun(
        id=str(uuid.uuid4()),
        workflow_id=wf.id,
        status="running",
        inputs=json.dumps(payload.inputs or {}),
        variables=json.dumps(payload.variables or {})
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    # Launch LangGraph in background
    background_tasks.add_task(
        run_langgraph_workflow,
        wf_id=wf.id,
        run_id=run.id,
        variables=payload.variables
    )

    return {"run_id": run.id, "status": "started"}

@router.get("/api/workflows/runs/{run_id}/stream", summary="Server-Sent Events (SSE) Real-time Stream")
async def stream_workflow_execution(run_id: str):
    """
    สตรีม Logs และ Node status สำหรับหน้าจอ Canvas React Flow
    """
    async def event_generator():
        yield f"data: {json.dumps({'status': 'connected'})}\n\n"
        queue = sse_manager.get_queue(run_id)
        while True:
            try:
                event = await queue.get()
                if event is None:
                    break
                event_type = event.get("type", "log")
                data_str = json.dumps(event.get("data", {}))
                yield f"event: {event_type}\ndata: {data_str}\n\n"
            except Exception:
                break
        sse_manager.cleanup(run_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/api/workflows/runs/{run_id}/stop", summary="สั่งหยุดการรัน Workflow")
async def stop_workflow_run(
    run_id: str,
    current_user: Optional[User] = Depends(get_current_active_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if current_user and current_user.role == "viewer":
        raise HTTPException(
            status_code=403,
            detail="Permission denied: Role 'viewer' cannot stop workflow runs"
        )

    run = await db.get(WorkflowRun, run_id)
    if run:
        run.status = "stopped"
        await db.commit()
    await sse_manager.emit_complete(run_id, status="stopped")
    return {"status": "stopped", "run_id": run_id}

@router.post("/api/nodes/execute", summary="ทดสอบรันโหนดเดี่ยว (Standalone Execution)")
async def execute_single_node(
    payload: NodeExecuteRequest,
    current_user: Optional[User] = Depends(get_current_active_user_optional)
):
    if current_user and current_user.role == "viewer":
        raise HTTPException(
            status_code=403,
            detail="Permission denied: Role 'viewer' cannot execute nodes"
        )

    node = create_node_instance(payload.node_id, payload.node_type, payload.node_data)
    state = {
        "current_run_id": "test_run",
        "workflow_id": "test_wf",
        "logs": [],
        "variables": payload.variables,
        "active_node": payload.node_id,
        "messages": []
    }
    result = await node.execute(state)
    return {"status": "success", "result": result}
