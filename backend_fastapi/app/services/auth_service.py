import logging
from typing import Optional
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.user import User

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

async def ensure_default_users(db: AsyncSession) -> None:
    """Seed initial default accounts if they don't already exist."""
    defaults = [
        {"username": "user01", "password": "admin", "role": "admin", "email": "user01@local.test"},
        {"username": "admin", "password": "admin123", "role": "admin", "email": "admin@local.test"},
    ]
    for d in defaults:
        stmt = select(User).where(User.username == d["username"])
        res = await db.execute(stmt)
        if not res.scalar_one_or_none():
            new_user = User(
                username=d["username"],
                hashed_password=get_password_hash(d["password"]),
                role=d["role"],
                email=d["email"],
                is_active=True
            )
            db.add(new_user)
            await db.commit()
            logger.info(f"Initialized default user '{d['username']}' with role '{d['role']}'.")

