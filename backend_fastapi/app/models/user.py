import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from app.database import Base

class RoleEnum:
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    BUILDER = "builder"
    OPERATOR = "operator"
    VIEWER = "viewer"

    ALL_ROLES = [SUPERADMIN, ADMIN, BUILDER, OPERATOR, VIEWER]

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    department = Column(String(100), nullable=True)
    role = Column(String(50), default=RoleEnum.BUILDER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
