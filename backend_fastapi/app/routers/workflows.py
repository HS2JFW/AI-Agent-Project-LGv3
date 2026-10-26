from typing import List, Optional, Any
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import get_db
from app.models.workflow import Workflow
from app.models.workflow_run import WorkflowRun
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowResponse

router = APIRouter(prefix="/api/workflows", tags=["Workflows"])

@router.get("", summary="ดึงรายการ Workflow ทั้งหมด")
async def get_all_workflows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).order_by(Workflow.updated_at.desc()))
    workflows = result.scalars().all()
    
    response_list = []
    for wf in workflows:
        try:
            nodes_list = json.loads(wf.nodes or "[]")
        except Exception:
            nodes_list = []
        response_list.append({
            "id": wf.id,
            "name": wf.name,
            "description": wf.description,
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

@router.get("/{wf_id}", summary="ดึงข้อมูล Workflow ตาม ID")
async def get_workflow_by_id(wf_id: str, db: AsyncSession = Depends(get_db)):
    wf = await db.get(Workflow, wf_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {
        "id": wf.id,
        "name": wf.name,
        "description": wf.description,
        "nodes": wf.nodes,
        "edges": wf.edges,
        "agent_nodes": wf.agent_nodes,
        "agent_edges": wf.agent_edges,
        "ai_models": wf.ai_models,
        "created_at": wf.created_at,
        "updated_at": wf.updated_at
    }

@router.post("", summary="สร้าง Workflow ใหม่")
async def create_workflow(payload: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    nodes_str = payload.nodes if isinstance(payload.nodes, str) else json.dumps(payload.nodes or [])
    edges_str = payload.edges if isinstance(payload.edges, str) else json.dumps(payload.edges or [])
    agent_nodes_str = payload.agent_nodes if isinstance(payload.agent_nodes, str) else json.dumps(payload.agent_nodes or [])
    agent_edges_str = payload.agent_edges if isinstance(payload.agent_edges, str) else json.dumps(payload.agent_edges or [])
    ai_models_str = payload.ai_models if isinstance(payload.ai_models, str) else json.dumps(payload.ai_models or [])

    new_wf = Workflow(
        name=payload.name,
        description=payload.description,
        nodes=nodes_str,
        edges=edges_str,
        agent_nodes=agent_nodes_str,
        agent_edges=agent_edges_str,
        ai_models=ai_models_str
    )
    db.add(new_wf)
    await db.commit()
    await db.refresh(new_wf)
    return {"id": new_wf.id, "name": new_wf.name, "message": "Workflow created successfully"}

@router.put("/{wf_id}", summary="อัปเดต Workflow เดิม")
async def update_workflow(wf_id: str, payload: WorkflowUpdate, db: AsyncSession = Depends(get_db)):
    wf = await db.get(Workflow, wf_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if payload.name is not None:
        wf.name = payload.name
    if payload.description is not None:
        wf.description = payload.description
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
    return {"id": wf.id, "name": wf.name, "message": "Workflow updated successfully"}

@router.delete("/{wf_id}", summary="ลบ Workflow")
async def delete_workflow(wf_id: str, db: AsyncSession = Depends(get_db)):
    wf = await db.get(Workflow, wf_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    await db.delete(wf)
    await db.commit()
    return {"message": "Workflow deleted successfully"}

@router.get("/{wf_id}/runs", summary="ดึงประวัติการรันทั้งหมดของ Workflow")
async def get_workflow_runs(wf_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowRun).where(WorkflowRun.workflow_id == wf_id).order_by(WorkflowRun.created_at.desc()))
    runs = result.scalars().all()
    return runs

@router.delete("/runs/{run_id}", summary="ลบประวัติการรันเฉพาะรอบ")
async def delete_workflow_run(run_id: str, db: AsyncSession = Depends(get_db)):
    run = await db.get(WorkflowRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    await db.delete(run)
    await db.commit()
    return {"message": "Workflow run deleted successfully"}

