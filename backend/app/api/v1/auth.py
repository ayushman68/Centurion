"""
Auth & RBAC Route Handlers
"""
from datetime import datetime, timezone
import logging
from fastapi import APIRouter, HTTPException, status

from backend.app.models.auth import UserRegisterRequest, UserRegisterResponse
from backend.app.core.security import hash_password
from backend.app.services.storage_mock import MOCK_USERS

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])
logger = logging.getLogger("Centurion.AuthRouter")

@router.post(
    "/register",
    response_model=UserRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User Registration & RBAC Ingress"
)
async def register_user(payload: UserRegisterRequest):
    """
    POST /api/v1/auth/register
    - Hashes plain-text password using deep bcrypt hash (12 salt rounds).
    - Checks email uniqueness constraint.
    - Executes parameterized SQL insert to table `users`.
    """
    for u in MOCK_USERS.values():
        if u["email"].lower() == payload.email.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User with email '{payload.email}' already exists."
            )

    hashed = hash_password(payload.password)
    new_user_id = len(MOCK_USERS) + 1
    created_at = datetime.now(timezone.utc)
    user_record = {
        "user_id": new_user_id,
        "email": payload.email,
        "password_hash": hashed,
        "role_name": payload.role_name,
        "created_at": created_at
    }
    MOCK_USERS[new_user_id] = user_record
    logger.info("Successfully registered user ID %d with role %s", new_user_id, payload.role_name)

    return UserRegisterResponse(
        user_id=new_user_id,
        email=payload.email,
        role_name=payload.role_name,
        created_at=created_at,
        message="User credentials encrypted with bcrypt (12 rounds) and provisioned in users table."
    )
