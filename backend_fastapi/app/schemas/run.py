from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class RunRequest(BaseModel):
    inputs: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Input variables เริ่มต้นสำหรับ Workflow")
    variables: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Variables State เช่น selected_node_ids สำหรับ Sub-flow")

class RunResponse(BaseModel):
    run_id: str = Field(..., description="UUID ของรอบการรัน")
    status: str = Field("started", description="สถานะเริ่มต้น (started / failed)")

class NodeExecuteRequest(BaseModel):
    node_id: str
    node_type: str = "customNode"
    node_data: Dict[str, Any] = Field(default_factory=dict)
    variables: Dict[str, Any] = Field(default_factory=dict)

class AuditLogRequest(BaseModel):
    action: str
    details: Optional[Dict[str, Any]] = None
    tab: Optional[str] = "process"
    source: Optional[Dict[str, Any]] = None

