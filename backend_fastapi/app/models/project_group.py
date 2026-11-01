import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from app.database import Base

class ProjectGroup(Base):
    __tablename__ = "project_groups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(50), nullable=True, default="blue")
    parent_id = Column(String(36), nullable=True)
    owner_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
