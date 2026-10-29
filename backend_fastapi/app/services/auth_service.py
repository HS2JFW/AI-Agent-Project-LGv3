import logging
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from fastapi import HTTPException, status

from app.config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.user import User, RoleEnum
from app.schemas.auth import UserCreate, UserUpdate

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None

async def authenticate_user(db: AsyncSession, username: str, password: str) -> Optional[User]:
    stmt = select(User).where(User.username == username.strip().lower())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user

async def record_user_login(db: AsyncSession, user: User) -> None:
    """Update last_login_at timestamp for user."""
    user.last_login_at = datetime.utcnow()
    await db.commit()

async def list_users(db: AsyncSession) -> List[User]:
    stmt = select(User).order_by(User.created_at.asc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    stmt = select(User).where(User.username == username.strip().lower())
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, payload: UserCreate) -> User:
    uname = payload.username.strip().lower()
    existing = await get_user_by_username(db, uname)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{uname}' is already registered."
        )
    role = payload.role if payload.role in RoleEnum.ALL_ROLES else RoleEnum.BUILDER
    new_user = User(
        username=uname,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        email=payload.email,
        department=payload.department,
        role=role,
        is_active=payload.is_active if payload.is_active is not None else True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    logger.info(f"Created new user '{new_user.username}' with role '{new_user.role}'.")
    return new_user

async def update_user(db: AsyncSession, user_id: str, payload: UserUpdate) -> User:
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        user.email = payload.email
    if payload.department is not None:
        user.department = payload.department
    if payload.role is not None:
        if payload.role not in RoleEnum.ALL_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{payload.role}'. Allowed: {RoleEnum.ALL_ROLES}"
            )
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password:
        user.hashed_password = get_password_hash(payload.password)

    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    logger.info(f"Updated user '{user.username}' successfully.")
    return user

async def delete_user(db: AsyncSession, user_id: str, operator_id: str) -> bool:
    if user_id == operator_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account."
        )
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    await db.delete(user)
    await db.commit()
    logger.info(f"Deleted user '{user.username}' by operator '{operator_id}'.")
    return True

async def ensure_default_users(db: AsyncSession) -> None:
    """Seed initial default accounts across RBAC tiers if they don't already exist."""
    defaults = [
        {"username": "user01", "password": "admin", "role": RoleEnum.SUPERADMIN, "full_name": "Super Administrator", "email": "user01@local.test"},
        {"username": "admin", "password": "admin123", "role": RoleEnum.ADMIN, "full_name": "System Administrator", "email": "admin@local.test"},
        {"username": "builder01", "password": "builder123", "role": RoleEnum.BUILDER, "full_name": "Workflow Designer", "email": "builder01@local.test"},
        {"username": "operator01", "password": "operator123", "role": RoleEnum.OPERATOR, "full_name": "Operations Staff", "email": "operator01@local.test"},
        {"username": "viewer01", "password": "viewer123", "role": RoleEnum.VIEWER, "full_name": "Audit Viewer", "email": "viewer01@local.test"},
    ]
    for d in defaults:
        stmt = select(User).where(User.username == d["username"])
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            new_user = User(
                username=d["username"],
                hashed_password=get_password_hash(d["password"]),
                role=d["role"],
                full_name=d["full_name"],
                email=d["email"],
                is_active=True
            )
            db.add(new_user)
            await db.commit()
            logger.info(f"Initialized default user '{d['username']}' with role '{d['role']}'.")
        else:
            # Upgrade user01 to superadmin if currently admin
            if d["username"] == "user01" and user.role != RoleEnum.SUPERADMIN:
                user.role = RoleEnum.SUPERADMIN
                await db.commit()
