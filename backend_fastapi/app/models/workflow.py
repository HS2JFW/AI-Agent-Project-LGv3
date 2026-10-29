import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String(36), nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)
    nodes = Column(Text, default="[]", nullable=False)
    edges = Column(Text, default="[]", nullable=False)
    agent_nodes = Column(Text, default="[]", nullable=True)
    agent_edges = Column(Text, default="[]", nullable=True)
    ai_models = Column(Text, default="[]", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    runs = relationship("WorkflowRun", back_populates="workflow", cascade="all, delete-orphan")
