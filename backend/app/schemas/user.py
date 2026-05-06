from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.core.enums import UserRole


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str = Field(..., min_length=5, description="Для связи оператора")
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str | None
    role: str
    is_active: bool
    is_verified: bool
    company_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserPublic(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str | None

    model_config = {"from_attributes": True}
