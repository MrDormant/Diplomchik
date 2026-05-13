from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.core.enums import UserRole


PHONE_PATTERN = r"^[\+\d\s\-\(\)]{10,20}$"


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(
        ...,
        min_length=10,
        max_length=20,
        pattern=PHONE_PATTERN,
        description="Телефон для связи оператора (10–20 символов, цифры/+/-/пробелы/скобки)",
    )
    password: str = Field(..., min_length=6, max_length=128)


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
