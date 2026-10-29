import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, RoleEnum
from app.schemas.auth import UserCreate, UserUpdate, UserOut, RoleInfo
from app.routers.auth import get_current_user, require_role
from app.services.auth_service import (
    list_users,
    get_user_by_id,
    create_user,
    update_user,
    delete_user
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["User Management & RBAC"])

ROLE_METADATA = [
    RoleInfo(
        role=RoleEnum.SUPERADMIN,
        name="Super Administrator",
        description="Full system control, User Management, System & Audit Logs, Security Configurations",
        tier=1
    ),
    RoleInfo(
        role=RoleEnum.ADMIN,
        name="Administrator",
        description="Workflow Management, Analytics, Read-only User List, Model Setup",
        tier=2
    ),
    RoleInfo(
        role=RoleEnum.BUILDER,
        name="Workflow Builder",
        description="Design, test, create, and edit owned Workflows and Prompts",
        tier=3
    ),
    RoleInfo(
        role=RoleEnum.OPERATOR,
        name="Workflow Operator",
        description="Upload documents to Queue, Execute/Stop workflows, Download generated outputs",
        tier=4
    ),
    RoleInfo(
        role=RoleEnum.VIEWER,
        name="Auditor / Viewer",
        description="Read-only access to Canvas and Analytics dashboard",
        tier=5
    ),
]

@router.get("/roles", response_model=List[RoleInfo], summary="List all available RBAC roles")
async def get_roles():
    """Returns available roles in the system with their descriptions and privilege tiers."""
    return ROLE_METADATA

@router.get("", response_model=List[UserOut], summary="List all users (Superadmin & Admin only)")
async def get_users_list(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.SUPERADMIN, RoleEnum.ADMIN))
):
    """Retrieve all registered users in the system."""
    return await list_users(db)

@router.get("/{user_id}", response_model=UserOut, summary="Get user details by ID")
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve details of a specific user. Allowed for Superadmin, Admin, or the user themselves."""
    if current_user.role not in [RoleEnum.SUPERADMIN, RoleEnum.ADMIN] and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this user's details."
        )
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED, summary="Create a new user (Superadmin & Admin only)")
async def create_new_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.SUPERADMIN, RoleEnum.ADMIN))
):
    """Create a new user account with assigned RBAC role."""
    # Only superadmin can create superadmin or admin
    if payload.role in [RoleEnum.SUPERADMIN, RoleEnum.ADMIN] and current_user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Superadmins can create other Superadmins or Administrators."
        )
    return await create_user(db, payload)

@router.patch("/{user_id}", response_model=UserOut, summary="Update user details, role, status or password")
async def update_user_details(
    user_id: str,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.SUPERADMIN, RoleEnum.ADMIN))
):
    """Update user information. Only Superadmins can change roles to Superadmin/Admin."""
    if payload.role in [RoleEnum.SUPERADMIN, RoleEnum.ADMIN] and current_user.role != RoleEnum.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Superadmins can elevate users to Superadmin or Administrator."
        )
    return await update_user(db, user_id, payload)

@router.delete("/{user_id}", summary="Delete user (Superadmin only)")
async def remove_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.SUPERADMIN))
):
    """Delete a user account. Cannot delete yourself."""
    await delete_user(db, user_id, current_user.id)
    return {"status": "ok", "message": "User deleted successfully."}
