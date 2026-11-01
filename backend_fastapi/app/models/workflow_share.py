import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from app.database import Base

class WorkflowShare(Base):
    __tablename__ = "workflow_shares"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    shared_with_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    shared_with_role = Column(String(50), nullable=True)
    permission = Column(String(20), default="view", nullable=False)  # "view", "execute", "edit"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

