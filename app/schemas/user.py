from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True