from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field

class ProjectGroupBase(BaseModel):
    name: str = Field(..., description="ชื่อของกลุ่มหรือโฟลเดอร์", example="Procurement Projects")
    description: Optional[str] = Field(None, description="คำอธิบายรายละเอียดของกลุ่ม")
    color: Optional[str] = Field(default="blue", description="สีประจำโฟลเดอร์")
    parent_id: Optional[str] = Field(None, description="ID ของโฟลเดอร์แม่ (กรณีเป็น Sub-folder)")

class ProjectGroupCreate(ProjectGroupBase):
    id: Optional[str] = Field(None, description="กำหนด ID เฉพาะ (สำหรับ Migration จาก Client)")

class ProjectGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    parent_id: Optional[str] = None

class ProjectGroupResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color: Optional[str] = "blue"
    parent_id: Optional[str] = None
    owner_id: Optional[str] = None
    owner_username: Optional[str] = None
    can_edit: bool = True
    can_delete: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SyncGroupsRequest(BaseModel):
    groups: List[ProjectGroupCreate] = []
    workflow_group_map: Optional[Dict[str, Optional[str]]] = None
    workflow_color_map: Optional[Dict[str, Optional[str]]] = None
