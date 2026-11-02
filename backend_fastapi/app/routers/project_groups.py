import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, update, delete

from app.database import get_db
from app.models.project_group import ProjectGroup
from app.models.workflow import Workflow
from app.models.user import User
from app.schemas.project_group import (
    ProjectGroupCreate,
    ProjectGroupUpdate,
    ProjectGroupResponse,
    SyncGroupsRequest
)
from app.routers.auth import (
    get_current_user,
    require_role,
    get_current_active_user_optional
)

router = APIRouter(prefix="/api/groups", tags=["Project Groups"])

@router.get("", summary="ดึงรายการโฟลเดอร์/กลุ่มงานทั้งหมดตามสิทธิ์ RBAC")
async def get_all_groups(
    current_user: Optional[User] = Depends(get_current_active_user_optional),
    db: AsyncSession = Depends(get_db)
):
    query = select(ProjectGroup, User.username).outerjoin(User, ProjectGroup.owner_id == User.id)

    if current_user is None:
        # Unauthenticated: only see system/unowned groups
        query = query.where(ProjectGroup.owner_id == None)
    elif current_user.role == "superadmin":
        # Superadmin: see all groups
        pass
    else:
        # Admin, Builder, Operator, Viewer: see own groups or shared unowned groups
        query = query.where(
            or_(
                ProjectGroup.owner_id == current_user.id,
                ProjectGroup.owner_id == None
            )
        )

    query = query.order_by(ProjectGroup.created_at.asc())
    result = await db.execute(query)
    rows = result.all()

    response_list = []
    for grp, owner_username in rows:
        if current_user is None:
            can_edit = False
            can_delete = False
        elif current_user.role == "superadmin":
            can_edit = True
            can_delete = True
        else:
            is_owner = (grp.owner_id == current_user.id or grp.owner_id is None)
            can_edit = is_owner
            can_delete = is_owner

        response_list.append({
            "id": grp.id,
            "name": grp.name,
            "description": grp.description,
            "color": grp.color or "blue",
            "parent_id": grp.parent_id,
            "owner_id": grp.owner_id,
            "owner_username": owner_username,
            "can_edit": can_edit,
            "can_delete": can_delete,
            "created_at": grp.created_at,
            "updated_at": grp.updated_at
        })

    return response_list

@router.post("", summary="สร้างโฟลเดอร์/กลุ่มงานใหม่ (Superadmin, Admin, Builder)")
async def create_group(
    payload: ProjectGroupCreate,
    current_user: User = Depends(require_role("superadmin", "admin", "builder")),
    db: AsyncSession = Depends(get_db)
):
    grp_id = payload.id if payload.id else str(uuid.uuid4())
    
    # Check if ID already exists
    existing = await db.get(ProjectGroup, grp_id)
    if existing:
        raise HTTPException(status_code=400, detail="Group with this ID already exists")

    new_group = ProjectGroup(
        id=grp_id,
        name=payload.name,
        description=payload.description,
        color=payload.color or "blue",
        parent_id=payload.parent_id,
        owner_id=current_user.id
    )
    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)

    return {
        "id": new_group.id,
        "name": new_group.name,
        "description": new_group.description,
        "color": new_group.color,
        "parent_id": new_group.parent_id,
        "owner_id": new_group.owner_id,
        "owner_username": current_user.username,
        "can_edit": True,
        "can_delete": True,
        "created_at": new_group.created_at,
        "updated_at": new_group.updated_at
    }

@router.put("/{group_id}", summary="แก้ไขข้อมูลโฟลเดอร์ (Owner หรือ Admin)")
@router.patch("/{group_id}", summary="แก้ไขข้อมูลโฟลเดอร์บางส่วน (Owner หรือ Admin)")
async def update_group(
    group_id: str,
    payload: ProjectGroupUpdate,
    current_user: User = Depends(require_role("superadmin", "admin", "builder")),
    db: AsyncSession = Depends(get_db)
):
    grp = await db.get(ProjectGroup, group_id)
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found")

    if current_user.role != "superadmin":
        if grp.owner_id is not None and grp.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied: You can only edit groups that you own"
            )

    if payload.name is not None:
        grp.name = payload.name
    if payload.description is not None:
        grp.description = payload.description
    if payload.color is not None:
        grp.color = payload.color
    if payload.parent_id is not None:
        if payload.parent_id == group_id:
            raise HTTPException(status_code=400, detail="A group cannot be its own parent")
        grp.parent_id = payload.parent_id if payload.parent_id != "" else None

    await db.commit()
    await db.refresh(grp)

    return {
        "id": grp.id,
        "name": grp.name,
        "description": grp.description,
        "color": grp.color,
        "parent_id": grp.parent_id,
        "owner_id": grp.owner_id,
        "message": "Group updated successfully"
    }

@router.delete("/{group_id}", summary="ลบโฟลเดอร์ (Owner หรือ Admin)")
async def delete_group(
    group_id: str,
    delete_workflows: bool = Query(False, description="ลบ Workflow ที่อยู่ข้างในด้วยหรือไม่ (ถ้า False จะย้ายออกสู่นอกโฟลเดอร์)"),
    current_user: User = Depends(require_role("superadmin", "admin", "builder")),
    db: AsyncSession = Depends(get_db)
):
    grp = await db.get(ProjectGroup, group_id)
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found")

    if current_user.role != "superadmin":
        if grp.owner_id is not None and grp.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied: You can only delete groups that you own"
            )

    # 1. Handle workflows inside this group
    if delete_workflows:
        # Delete only workflows the user has permission to delete
        wf_query = select(Workflow).where(Workflow.group_id == group_id)
        if current_user.role != "superadmin":
            wf_query = wf_query.where(or_(Workflow.owner_id == current_user.id, Workflow.owner_id == None))
        wfs = (await db.execute(wf_query)).scalars().all()
        for wf in wfs:
            await db.delete(wf)
    else:
        # Unlink workflows from this group
        await db.execute(
            update(Workflow)
            .where(Workflow.group_id == group_id)
            .values(group_id=None)
        )

    # 2. Re-parent sub-groups to the parent of this deleted group
    await db.execute(
        update(ProjectGroup)
        .where(ProjectGroup.parent_id == group_id)
        .values(parent_id=grp.parent_id)
    )

    # 3. Delete group
    await db.delete(grp)
    await db.commit()

    return {"message": "Group deleted successfully", "id": group_id}

@router.post("/sync", summary="ซิงค์และบันทึกโฟลเดอร์จาก Client (Auto-Migration)")
async def sync_groups_from_client(
    payload: SyncGroupsRequest,
    current_user: User = Depends(require_role("superadmin", "admin", "builder")),
    db: AsyncSession = Depends(get_db)
):
    migrated_groups = 0
    migrated_workflows = 0

    # 1. Sync Groups
    for g_data in payload.groups:
        target_id = g_data.id if g_data.id else str(uuid.uuid4())
        existing = await db.get(ProjectGroup, target_id)
        if not existing:
            new_grp = ProjectGroup(
                id=target_id,
                name=g_data.name,
                description=g_data.description,
                color=g_data.color or "blue",
                parent_id=g_data.parent_id,
                owner_id=current_user.id
            )
            db.add(new_grp)
            migrated_groups += 1

    # 2. Sync Workflow Group Mapping
    if payload.workflow_group_map:
        for wf_id, grp_id in payload.workflow_group_map.items():
            wf = await db.get(Workflow, wf_id)
            if wf:
                # Check permission to modify workflow
                if current_user.role in ["superadmin", "admin"] or wf.owner_id in [current_user.id, None]:
                    wf.group_id = grp_id if grp_id else None
                    migrated_workflows += 1

    # 3. Sync Workflow Color Mapping
    if payload.workflow_color_map:
        for wf_id, col in payload.workflow_color_map.items():
            wf = await db.get(Workflow, wf_id)
            if wf and col:
                if current_user.role in ["superadmin", "admin"] or wf.owner_id in [current_user.id, None]:
                    wf.color = col

    await db.commit()
    return {
        "status": "success",
        "migrated_groups": migrated_groups,
        "migrated_workflows": migrated_workflows
    }

