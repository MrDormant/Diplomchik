from datetime import datetime

from pydantic import BaseModel, Field

from app.core.enums import FrameType, ObjectType, RequestSource, RequestStatus
from app.schemas.user import UserPublic


PHONE_PATTERN = r"^[\+\d\s\-\(\)]{10,20}$"


class GuestCalculatorRequestCreate(BaseModel):

    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(
        ...,
        min_length=10,
        max_length=20,
        pattern=PHONE_PATTERN,
        description="Телефон в свободном формате: +7 (495) 123-45-67, 84951234567 и т.п.",
    )
    length: float = Field(..., gt=0, le=500)
    width: float = Field(..., gt=0, le=500)
    height: float = Field(..., gt=0, le=50)
    object_type: ObjectType | None = None
    frame_type: FrameType | None = None
    comment: str | None = Field(None, max_length=4000)


class ServiceRequestCreate(BaseModel):
    project_id: int | None = None
    solution_id: int | None = None
    source: RequestSource
    comment: str | None = Field(None, max_length=4000)


class ServiceRequestResponse(BaseModel):
    id: int
    user_id: int | None = None
    guest_full_name: str | None = None
    guest_phone: str | None = None
    project_id: int | None
    solution_id: int | None
    source: str
    comment: str | None
    status: str
    manager_note: str | None
    estimated_total: str | None
    created_at: datetime
    updated_at: datetime | None
    user: UserPublic | None = None

    model_config = {"from_attributes": True}


class ServiceRequestStatusUpdate(BaseModel):
    status: RequestStatus
    manager_note: str | None = Field(None, max_length=4000)
