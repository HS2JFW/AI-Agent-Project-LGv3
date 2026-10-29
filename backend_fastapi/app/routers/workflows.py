from typing import List, Optional, Any
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_
from app.database import get_db
from app.models.workflow import Workflow
from app.models.workflow_run import WorkflowRun
from app.models.user import User
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowResponse
from app.routers.auth import get_current_user, require_role, get_current_active_user_optional

router = APIRouter(prefix="/api/workflows", tags=["Workflows"])

@router.get("", summary="ดึงรายการ Workflow ทั้งหมดตามสิทธิ์ผู้ใช้งาน (RBAC)")
async def get_all_workflows(
    current_user: Optional[User] = Depends(get_current_active_user_optional),
    db: AsyncSession = Depends(get_db)
):
    query = select(Workflow, User.username).outerjoin(User, Workflow.owner_id == User.id)

    # Filtering based on RBAC role
    if current_user is None:
        # Unauthenticated: only see public workflows or legacy workflows without owner
        query = query.where(or_(Workflow.is_public == True, Workflow.owner_id == None))
    elif current_user.role in ["superadmin", "admin"]:
        # Superadmin / Admin: see all workflows across entire organization
        pass
    elif current_user.role == "builder":
        # Builder: see owned workflows OR public workflows OR legacy workflows
        query = query.where(
            or_(
                Workflow.owner_id == current_user.id,
                Workflow.is_public == True,
                Workflow.owner_id == None
            )
        )
    else:
        # Operator / Viewer: see public workflows OR legacy workflows
        query = query.where(
            or_(
                Workflow.is_public == True,
                Workflow.owner_id == current_user.id,
                Workflow.owner_id == None
            )
        )

    query = query.order_by(Workflow.updated_at.desc())
    result = await db.execute(query)
    rows = result.all()

    response_list = []
    for wf, owner_username in rows:
        try:
            nodes_list = json.loads(wf.nodes or "[]")
        except Exception:
            nodes_list = []

        # Determine permissions for current user
        if current_user is None:
            can_edit = False
            can_delete = False
        elif current_user.role in ["superadmin", "admin"]:
            can_edit = True
            can_delete = True
        elif current_user.role == "builder":
            is_owner = (wf.owner_id == current_user.id or wf.owner_id is None)
            can_edit = is_owner
            can_delete = (wf.owner_id == current_user.id)
        else: # operator, viewer
            can_edit = False
            can_delete = False

        response_list.append({
            "id": wf.id,
            "name": wf.name,
            "description": wf.description,
            "owner_id": wf.owner_id,
            "owner_username": owner_username,
            "is_public": wf.is_public,
            "can_edit": can_edit,
            "can_delete": can_delete,
            "nodes": wf.nodes,
            "edges": wf.edges,
            "agent_nodes": wf.agent_nodes,
            "agent_edges": wf.agent_edges,
            "ai_models": wf.ai_models,
            "node_count": len(nodes_list),
            "created_at": wf.created_at,
            "updated_at": wf.updated_at
        })
    return response_list

@router.get("/{wf_id}", summary="ดึงข้อมูล Workflow ตาม ID พร้อมตรวจสอบสิทธิ์")
async def get_workflow_by_id(
    wf_id: str,
    current_user: Optional[User] = Depends(get_current_active_user_optional),
    db: AsyncSession = Depends(get_db)
):
    query = select(Workflow, User.username).outerjoin(User, Workflow.owner_id == User.id).where(Workflow.id == wf_id)
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    wf, owner_username = row

    # Access check for private workflows
    if not wf.is_public and wf.owner_id is not None:
        if current_user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required to view private workflow")
        if current_user.role not in ["superadmin", "admin"] and wf.owner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: You do not have permission to view this private workflow")

    # Determine permissions
    if current_user is None:
        can_edit = False
        can_delete = False
    elif current_user.role in ["superadmin", "admin"]:
        can_edit = True
        can_delete = True
    elif current_user.role == "builder":
        is_owner = (wf.owner_id == current_user.id or wf.owner_id is None)
        can_edit = is_owner
        can_delete = (wf.owner_id == current_user.id)
    else:
        can_edit = False
        can_delete = False

    return {
        "id": wf.id,
        "name": wf.name,
        "description": wf.description,
        "owner_id": wf.owner_id,
        "owner_username": owner_username,
        "is_public": wf.is_public,
        "can_edit": can_edit,
        "can_delete": can_delete,
        "nodes": wf.nodes,
        "edges": wf.edges,
        "agent_nodes": wf.agent_nodes,
        "agent_edges": wf.agent_edges,
        "ai_models": wf.ai_models,
        "created_at": wf.created_at,
        "updated_at": wf.updated_at
    }

@router.post("", summary="สร้าง Workflow ใหม่ (Superadmin, Admin, Builder)")
async def create_workflow(
    payload: WorkflowCreate,
    current_user: User = Depends(require_role("superadmin", "admin", "builder")),
    db: AsyncSession = Depends(get_db)
):
    nodes_str = payload.nodes if isinstance(payload.nodes, str) else json.dumps(payload.nodes or [])
    edges_str = payload.edges if isinstance(payload.edges, str) else json.dumps(payload.edges or [])
    agent_nodes_str = payload.agent_nodes if isinstance(payload.agent_nodes, str) else json.dumps(payload.agent_nodes or [])
    agent_edges_str = payload.agent_edges if isinstance(payload.agent_edges, str) else json.dumps(payload.agent_edges or [])
    ai_models_str = payload.ai_models if isinstance(payload.ai_models, str) else json.dumps(payload.ai_models or [])

    new_wf = Workflow(
        name=payload.name,
        description=payload.description,
        owner_id=current_user.id,
        is_public=payload.is_public if payload.is_public is not None else True,
        nodes=nodes_str,
        edges=edges_str,
        agent_nodes=agent_nodes_str,
        agent_edges=agent_edges_str,
        ai_models=ai_models_str
    )
    db.add(new_wf)
    await db.commit()
    await db.refresh(new_wf)
    return {
        "id": new_wf.id,
        "name": new_wf.name,
        "owner_id": new_wf.owner_id,
        "is_public": new_wf.is_public,
        "message": "Workflow created successfully"
    }

@router.put("/{wf_id}", summary="อัปเดต Workflow เดิม (Owner หรือ Admin)")
async def update_workflow(
    wf_id: str,
    payload: WorkflowUpdate,
    current_user: User = Depends(require_role("superadmin", "admin", "builder")),
    db: AsyncSession = Depends(get_db)
):
    wf = await db.get(Workflow, wf_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Ownership enforcement for builder
    if current_user.role == "builder":
        if wf.owner_id is not None and wf.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied: You can only edit workflows that you own"
            )

    if payload.name is not None:
        wf.name = payload.name
    if payload.description is not None:
        wf.description = payload.description
    if payload.is_public is not None:
        wf.is_public = payload.is_public
    if payload.nodes is not None:
        wf.nodes = payload.nodes if isinstance(payload.nodes, str) else json.dumps(payload.nodes)
    if payload.edges is not None:
        wf.edges = payload.edges if isinstance(payload.edges, str) else json.dumps(payload.edges)
    if payload.agent_nodes is not None:
        wf.agent_nodes = payload.agent_nodes if isinstance(payload.agent_nodes, str) else json.dumps(payload.agent_nodes)
    if payload.agent_edges is not None:
        wf.agent_edges = payload.agent_edges if isinstance(payload.agent_edges, str) else json.dumps(payload.agent_edges)
    if payload.ai_models is not None:
        wf.ai_models = payload.ai_models if isinstance(payload.ai_models, str) else json.dumps(payload.ai_models)

    await db.commit()
    await db.refresh(wf)
    return {
        "id": wf.id,
        "name": wf.name,
        "owner_id": wf.owner_id,
        "is_public": wf.is_public,
        "message": "Workflow updated successfully"
    }

@router.delete("/{wf_id}", summary="ลบ Workflow (Owner หรือ Admin)")
async def delete_workflow(
    wf_id: str,
    current_user: User = Depends(require_role("superadmin", "admin", "builder")),
    db: AsyncSession = Depends(get_db)
):
    wf = await db.get(Workflow, wf_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Ownership enforcement for builder
    if current_user.role == "builder":
        if wf.owner_id is not None and wf.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied: You can only delete workflows that you own"
            )

    await db.delete(wf)
    await db.commit()
    return {"message": "Workflow deleted successfully"}

@router.get("/{wf_id}/runs", summary="ดึงประวัติการรันทั้งหมดของ Workflow")
async def get_workflow_runs(wf_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowRun).where(WorkflowRun.workflow_id == wf_id).order_by(WorkflowRun.created_at.desc()))
    runs = result.scalars().all()
    return runs

@router.delete("/runs/{run_id}", summary="ลบประวัติการรันเฉพาะรอบ (Superadmin, Admin)")
async def delete_workflow_run(
    run_id: str,
    current_user: User = Depends(require_role("superadmin", "admin")),
    db: AsyncSession = Depends(get_db)
):
    run = await db.get(WorkflowRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    await db.delete(run)
    await db.commit()
    return {"message": "Workflow run deleted successfully"}
