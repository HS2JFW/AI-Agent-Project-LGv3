from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class WorkflowShareCreate(BaseModel):
    shared_with_user_id: Optional[str] = Field(None, description="ID ของ User ที่ต้องการแชร์ให้")
    shared_with_username: Optional[str] = Field(None, description="Username ของ User ที่ต้องการแชร์ให้ (ระบุแทน user_id ได้)")
    shared_with_role: Optional[str] = Field(None, description="แชร์ให้ทั้ง Role (เช่น 'operator', 'viewer')")
    permission: str = Field(default="view", description="ระดับสิทธิ์: 'view' (ดูได้), 'execute' (รันได้), 'edit' (แก้ไขได้)")

class WorkflowShareResponse(BaseModel):
    id: str
    workflow_id: str
    shared_with_user_id: Optional[str] = None
    shared_with_username: Optional[str] = None
    shared_with_role: Optional[str] = None
    permission: str
    created_at: datetime

    class Config:
        from_attributes = True

