import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    user_id = Column(String(36), nullable=True, index=True)
    username = Column(String(100), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    tab = Column(String(50), nullable=True)
    source_file = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    level = Column(String(20), default="INFO", nullable=False)

