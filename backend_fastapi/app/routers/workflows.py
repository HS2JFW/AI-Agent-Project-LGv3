from typing import List, Optional, Any
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_, and_
from app.database import get_db
from app.models.workflow import Workflow
from app.models.workflow_run import WorkflowRun
from app.models.workflow_share import WorkflowShare
from app.models.user import User
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowResponse
from app.schemas.workflow_share import WorkflowShareCreate, WorkflowShareResponse
from app.routers.auth import get_current_user, require_role, get_current_active_user_optional

router = APIRouter(prefix="/api/workflows", tags=["Workflows"])

def safe_parse_json(val, default=None):
    if default is None:
        default = []
    if val is None:
        return default
    if isinstance(val, (list, dict)):
        return val
    try:
        return json.loads(val)
    except Exception:
        return default

@router.get("", summary="ดึงรายการ Workflow ทั้งหมดตามสิทธิ์ผู้ใช้งาน (RBAC) พร้อมแท็บกรอง")
async def get_all_workflows(
    visibility: Optional[str] = Query("all", description="ตัวกรองมุมมอง: 'all' (ทั้งหมด), 'mine' (งานของฉัน), 'shared' (แชร์กับฉัน)"),
    group_id: Optional[str] = Query(None, description="กรองตาม Group ID"),
    current_user: Optional[User] = Depends(get_current_active_user_optional),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch user shares map
    user_shares = {}
    if current_user:
        shares_query = select(WorkflowShare).where(
            or_(
                WorkflowShare.shared_with_user_id == current_user.id,
                WorkflowShare.shared_with_role == current_user.role
            )
        )
        shares_res = (await db.execute(shares_query)).scalars().all()
        for s in shares_res:
            existing = user_shares.get(s.workflow_id)
            if not existing or s.permission == "edit" or (s.permission == "execute" and existing == "view"):
                user_shares[s.workflow_id] = s.permission

    shared_wf_ids = list(user_shares.keys())
    query = select(Workflow, User.username).outerjoin(User, Workflow.owner_id == User.id)

    # 2. Base RBAC Filtering
    if current_user is None:
        query = query.where(or_(Workflow.is_public == True, Workflow.owner_id == None))
    elif current_user.role in ["superadmin", "admin"]:
        pass
    else:  # builder, operator, viewer
        query = query.where(
            or_(
                Workflow.owner_id == current_user.id,
                Workflow.is_public == True,
                Workflow.owner_id == None,
                Workflow.id.in_(shared_wf_ids) if shared_wf_ids else False
            )
        )

    # 3. Visibility tab filtering
    if current_user:
        if visibility == "mine":
            query = query.where(Workflow.owner_id == current_user.id)
        elif visibility == "shared":
            if shared_wf_ids:
                query = query.where(
                    or_(
                        Workflow.id.in_(shared_wf_ids),
                        and_(Workflow.is_public == True, Workflow.owner_id != current_user.id)
                    )
                )
            else:
                query = query.where(and_(Workflow.is_public == True, Workflow.owner_id != current_user.id))

    # 4. Group filter
    if group_id is not None:
        if group_id == "" or group_id == "null":
            query = query.where(Workflow.group_id == None)
        else:
            query = query.where(Workflow.group_id == group_id)

    query = query.order_by(Workflow.updated_at.desc())
    result = await db.execute(query)
    rows = result.all()

    response_list = []
    for wf, owner_username in rows:
        try:
            nodes_list = json.loads(wf.nodes or "[]")
        except Exception:
            nodes_list = []

        share_perm = user_shares.get(wf.id)
        is_shared = (share_perm is not None)

        # Determine permissions for current user
        if current_user is None:
            can_edit = False
            can_delete = False
        elif current_user.role in ["superadmin", "admin"]:
            can_edit = True
            can_delete = True
        elif current_user.role == "builder":
            is_owner = (wf.owner_id == current_user.id or wf.owner_id is None)
            can_edit = is_owner or (is_shared and share_perm == "edit")
            can_delete = (wf.owner_id == current_user.id)
        else:  # operator, viewer
            can_edit = (is_shared and share_perm == "edit")
            can_delete = False

        parsed_nodes = safe_parse_json(wf.nodes, [])
        parsed_edges = safe_parse_json(wf.edges, [])
        parsed_agent_nodes = safe_parse_json(wf.agent_nodes, [])
        parsed_agent_edges = safe_parse_json(wf.agent_edges, [])
        parsed_ai_models = safe_parse_json(wf.ai_models, [])

        response_list.append({
            "id": wf.id,
            "name": wf.name,
            "description": wf.description,
            "owner_id": wf.owner_id,
            "owner_username": owner_username,
            "is_public": wf.is_public,
            "group_id": wf.group_id,
            "color": wf.color,
            "is_shared": is_shared,
            "share_permission": share_perm,
            "can_edit": can_edit,
            "can_delete": can_delete,
            "nodes": parsed_nodes,
            "edges": parsed_edges,
            "agent_nodes": parsed_agent_nodes,
            "agent_edges": parsed_agent_edges,
            "agentNodes": parsed_agent_nodes,
            "agentEdges": parsed_agent_edges,
            "ai_models": parsed_ai_models,
            "aiModels": parsed_ai_models,
            "node_count": len(parsed_nodes),
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

    share_perm = None
    if current_user:
        share = await db.scalar(
            select(WorkflowShare).where(
                WorkflowShare.workflow_id == wf.id,
                or_(
                    WorkflowShare.shared_with_user_id == current_user.id,
                    WorkflowShare.shared_with_role == current_user.role
                )
            )
        )
        if share:
            share_perm = share.permission

    # Access check for private workflows
    if not wf.is_public and wf.owner_id is not None:
        if current_user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required to view private workflow")
        if current_user.role not in ["superadmin", "admin"] and wf.owner_id != current_user.id:
            if not share_perm:
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
        can_edit = is_owner or (share_perm == "edit")
        can_delete = (wf.owner_id == current_user.id)
    else:
        can_edit = (share_perm == "edit")
        can_delete = False

    parsed_nodes = safe_parse_json(wf.nodes, [])
    parsed_edges = safe_parse_json(wf.edges, [])
    parsed_agent_nodes = safe_parse_json(wf.agent_nodes, [])
    parsed_agent_edges = safe_parse_json(wf.agent_edges, [])
    parsed_ai_models = safe_parse_json(wf.ai_models, [])

    return {
        "id": wf.id,
        "name": wf.name,
        "description": wf.description,
        "owner_id": wf.owner_id,
        "owner_username": owner_username,
        "is_public": wf.is_public,
        "group_id": wf.group_id,
        "color": wf.color,
        "is_shared": (share_perm is not None),
        "share_permission": share_perm,
        "can_edit": can_edit,
        "can_delete": can_delete,
        "nodes": parsed_nodes,
        "edges": parsed_edges,
        "agent_nodes": parsed_agent_nodes,
        "agent_edges": parsed_agent_edges,
        "agentNodes": parsed_agent_nodes,
        "agentEdges": parsed_agent_edges,
        "ai_models": parsed_ai_models,
        "aiModels": parsed_ai_models,
        "node_count": len(parsed_nodes),
        "created_at": wf.created_at,
        "updated_at": wf.updated_at
    }

@router.post("", summary="สร้าง Workflow ใหม่ (Superadmin, Admin, Builder)")
async def create_workflow(
    payload: WorkflowCreate,
    current_user: User = Depends(require_role("superadmin", "admin", "builder")),
    db: AsyncSession = Depends(get_db)
):
    import uuid
    from datetime import datetime
    nodes_str = payload.nodes if isinstance(payload.nodes, str) else json.dumps(payload.nodes or [])
    edges_str = payload.edges if isinstance(payload.edges, str) else json.dumps(payload.edges or [])

    agent_nodes_val = payload.agent_nodes if payload.agent_nodes is not None else payload.agentNodes
    agent_nodes_str = agent_nodes_val if isinstance(agent_nodes_val, str) else json.dumps(agent_nodes_val or [])

    agent_edges_val = payload.agent_edges if payload.agent_edges is not None else payload.agentEdges
    agent_edges_str = agent_edges_val if isinstance(agent_edges_val, str) else json.dumps(agent_edges_val or [])

    ai_models_str = payload.ai_models if isinstance(payload.ai_models, str) else json.dumps(payload.ai_models or [])

    # If ID was provided and already exists, update it if user has permission
    if payload.id:
        existing = await db.get(Workflow, payload.id)
        if existing:
            if current_user.role == "builder" and existing.owner_id is not None and existing.owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permission denied: Workflow already exists and is owned by another user"
                )
            existing.name = payload.name
            existing.description = payload.description
            if payload.is_public is not None:
                existing.is_public = payload.is_public
            if payload.group_id is not None:
                existing.group_id = payload.group_id if payload.group_id != "" else None
            if payload.color is not None:
                existing.color = payload.color
            existing.nodes = nodes_str
            existing.edges = edges_str
            existing.agent_nodes = agent_nodes_str
            existing.agent_edges = agent_edges_str
            existing.ai_models = ai_models_str
            existing.updated_at = datetime.utcnow()
            await db.commit()
            await db.refresh(existing)
            return {
                "id": existing.id,
                "name": existing.name,
                "owner_id": existing.owner_id,
                "is_public": existing.is_public,
                "group_id": existing.group_id,
                "color": existing.color,
                "nodes": safe_parse_json(existing.nodes, []),
                "edges": safe_parse_json(existing.edges, []),
                "agent_nodes": safe_parse_json(existing.agent_nodes, []),
                "agent_edges": safe_parse_json(existing.agent_edges, []),
                "agentNodes": safe_parse_json(existing.agent_nodes, []),
                "agentEdges": safe_parse_json(existing.agent_edges, []),
                "message": "Workflow updated successfully"
            }

    wf_id = payload.id if payload.id else str(uuid.uuid4())
    new_wf = Workflow(
        id=wf_id,
        name=payload.name,
        description=payload.description,
        owner_id=current_user.id,
        is_public=payload.is_public if payload.is_public is not None else False,
        group_id=payload.group_id if payload.group_id != "" else None,
        color=payload.color,
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
        "group_id": new_wf.group_id,
        "color": new_wf.color,
        "nodes": safe_parse_json(new_wf.nodes, []),
        "edges": safe_parse_json(new_wf.edges, []),
        "agent_nodes": safe_parse_json(new_wf.agent_nodes, []),
        "agent_edges": safe_parse_json(new_wf.agent_edges, []),
        "agentNodes": safe_parse_json(new_wf.agent_nodes, []),
        "agentEdges": safe_parse_json(new_wf.agent_edges, []),
        "message": "Workflow created successfully"
    }

@router.put("/{wf_id}", summary="อัปเดต Workflow เดิม (Owner หรือ Admin หรือ Shared Edit)")
@router.patch("/{wf_id}", summary="อัปเดต Workflow บางฟิลด์ (Owner หรือ Admin หรือ Shared Edit)")
async def update_workflow(
    wf_id: str,
    payload: WorkflowUpdate,
    current_user: User = Depends(require_role("superadmin", "admin", "builder")),
    db: AsyncSession = Depends(get_db)
):
    wf = await db.get(Workflow, wf_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Ownership & Edit share enforcement
    if current_user.role == "builder":
        if wf.owner_id is not None and wf.owner_id != current_user.id:
            # Check if workflow is shared with edit permission
            share = await db.scalar(
                select(WorkflowShare).where(
                    WorkflowShare.workflow_id == wf.id,
                    WorkflowShare.permission == "edit",
                    or_(
                        WorkflowShare.shared_with_user_id == current_user.id,
                        WorkflowShare.shared_with_role == current_user.role
                    )
                )
            )
            if not share:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permission denied: You can only edit workflows that you own or have edit permission"
                )

    if payload.name is not None:
        wf.name = payload.name
    if payload.description is not None:
        wf.description = payload.description
    if payload.is_public is not None:
        wf.is_public = payload.is_public
    if payload.group_id is not None:
        wf.group_id = payload.group_id if payload.group_id != "" else None
    if payload.color is not None:
        wf.color = payload.color
    if payload.nodes is not None:
        wf.nodes = payload.nodes if isinstance(payload.nodes, str) else json.dumps(payload.nodes)
    if payload.edges is not None:
        wf.edges = payload.edges if isinstance(payload.edges, str) else json.dumps(payload.edges)
    agent_nodes_val = payload.agent_nodes if payload.agent_nodes is not None else payload.agentNodes
    if agent_nodes_val is not None:
        wf.agent_nodes = agent_nodes_val if isinstance(agent_nodes_val, str) else json.dumps(agent_nodes_val)
    agent_edges_val = payload.agent_edges if payload.agent_edges is not None else payload.agentEdges
    if agent_edges_val is not None:
        wf.agent_edges = agent_edges_val if isinstance(agent_edges_val, str) else json.dumps(agent_edges_val)
    if payload.ai_models is not None:
        wf.ai_models = payload.ai_models if isinstance(payload.ai_models, str) else json.dumps(payload.ai_models)

    await db.commit()
    await db.refresh(wf)
    return {
        "id": wf.id,
        "name": wf.name,
        "owner_id": wf.owner_id,
        "is_public": wf.is_public,
        "group_id": wf.group_id,
        "color": wf.color,
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

# ----------------- Workflow Sharing Endpoints -----------------

@router.get("/{wf_id}/shares", summary="ดึงรายการผู้ใช้/Role ที่ได้รับการแชร์สิทธิ์ (Owner หรือ Admin)")
async def get_workflow_shares(
    wf_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    wf = await db.get(Workflow, wf_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if current_user.role not in ["superadmin", "admin"] and wf.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied: Only the owner or admin can view shares")

    query = (
        select(WorkflowShare, User.username)
        .outerjoin(User, WorkflowShare.shared_with_user_id == User.id)
        .where(WorkflowShare.workflow_id == wf_id)
        .order_by(WorkflowShare.created_at.asc())
    )
    result = await db.execute(query)
    rows = result.all()

    shares_list = []
    for share, username in rows:
        shares_list.append({
            "id": share.id,
            "workflow_id": share.workflow_id,
            "shared_with_user_id": share.shared_with_user_id,
            "shared_with_username": username,
            "shared_with_role": share.shared_with_role,
            "permission": share.permission,
            "created_at": share.created_at
        })
    return shares_list

@router.post("/{wf_id}/shares", summary="เพิ่มการแชร์สิทธิ์ให้ User หรือ Role (Owner หรือ Admin)")
async def add_workflow_share(
    wf_id: str,
    payload: WorkflowShareCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    wf = await db.get(Workflow, wf_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if current_user.role not in ["superadmin", "admin"] and wf.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied: Only the owner or admin can share this workflow")

    if payload.permission not in ["view", "execute", "edit"]:
        raise HTTPException(status_code=400, detail="Invalid permission level. Must be 'view', 'execute', or 'edit'")

    target_user_id = payload.shared_with_user_id
    target_username = None

    if payload.shared_with_username:
        user_res = await db.execute(select(User).where(User.username == payload.shared_with_username.strip()))
        target_user = user_res.scalar_one_or_none()
        if not target_user:
            raise HTTPException(status_code=404, detail=f"User '{payload.shared_with_username}' not found")
        target_user_id = target_user.id
        target_username = target_user.username
    elif target_user_id:
        target_user = await db.get(User, target_user_id)
        if target_user:
            target_username = target_user.username

    if not target_user_id and not payload.shared_with_role:
        raise HTTPException(status_code=400, detail="Must specify either shared_with_user_id/username or shared_with_role")

    new_share = WorkflowShare(
        workflow_id=wf_id,
        shared_with_user_id=target_user_id,
        shared_with_role=payload.shared_with_role,
        permission=payload.permission
    )
    db.add(new_share)
    await db.commit()
    await db.refresh(new_share)

    return {
        "id": new_share.id,
        "workflow_id": new_share.workflow_id,
        "shared_with_user_id": new_share.shared_with_user_id,
        "shared_with_username": target_username,
        "shared_with_role": new_share.shared_with_role,
        "permission": new_share.permission,
        "created_at": new_share.created_at,
        "message": "Workflow shared successfully"
    }

@router.delete("/{wf_id}/shares/{share_id}", summary="ยกเลิกการแชร์สิทธิ์ (Owner หรือ Admin)")
async def delete_workflow_share(
    wf_id: str,
    share_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    wf = await db.get(Workflow, wf_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if current_user.role not in ["superadmin", "admin"] and wf.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied: Only the owner or admin can revoke shares")

    share = await db.get(WorkflowShare, share_id)
    if not share or share.workflow_id != wf_id:
        raise HTTPException(status_code=404, detail="Share record not found")

    await db.delete(share)
    await db.commit()
    return {"message": "Share revoked successfully", "id": share_id}

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
