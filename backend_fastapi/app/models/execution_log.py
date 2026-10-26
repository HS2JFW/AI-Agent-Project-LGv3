import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(36), ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False)
    node_id = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    level = Column(String(50), default="INFO", nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    run = relationship("WorkflowRun", back_populates="logs")

