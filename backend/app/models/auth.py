"""
Authentication & RBAC Pydantic Schemas
"""
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator

class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Institutional corporate email address")
    password: str = Field(..., min_length=10, description="Minimum 10 characters password")
    role_name: str = Field(..., description="Assigned enterprise role")

    @field_validator("role_name")
    def validate_role(cls, v: str) -> str:
        allowed = {"Risk_Officer", "Portfolio_Manager", "Auditor"}
        if v not in allowed:
            raise ValueError(f"Invalid role '{v}'. Must be one of {allowed}")
        return v

class UserRegisterResponse(BaseModel):
    user_id: int
    email: str
    role_name: str
    created_at: datetime
    message: str
