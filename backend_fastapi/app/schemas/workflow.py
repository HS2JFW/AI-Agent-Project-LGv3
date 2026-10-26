from typing import Optional, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class WorkflowBase(BaseModel):
    name: str = Field(..., description="ชื่อของ Workflow", example="TOR Evaluation Workflow")
    description: Optional[str] = Field(None, description="คำอธิบายรายละเอียดของ Workflow")
    nodes: Optional[Any] = Field(default=[], description="รายการ Node ใน React Flow Canvas (Array หรือ JSON String)")
    edges: Optional[Any] = Field(default=[], description="รายการ Edge ที่เชื่อมต่อ Node (Array หรือ JSON String)")
    agent_nodes: Optional[Any] = Field(default=[], description="รายการ Agent Node เพิ่มเติม")
    agent_edges: Optional[Any] = Field(default=[], description="รายการ Edge ของ Agent")
    ai_models: Optional[Any] = Field(default=[], description="รายการ Model Configuration และ API Keys")

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[Any] = None
    edges: Optional[Any] = None
    agent_nodes: Optional[Any] = None
    agent_edges: Optional[Any] = None
    ai_models: Optional[Any] = None

class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    nodes: str
    edges: str
    agent_nodes: Optional[str] = None
    agent_edges: Optional[str] = None
    ai_models: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

