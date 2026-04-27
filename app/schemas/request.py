from datetime import datetime

from pydantic import BaseModel, Field

from app.core.enums import RequestSource, RequestStatus
from app.schemas.user import UserPublic


class GuestCalculatorRequestCreate(BaseModel):
    """Заявка с калькулятора без регистрации: контакт + те же параметры, что у /calculate."""

    full_name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=5, max_length=40)
    length: float
    width: float
    height: float
    object_type: str | None = None
    frame_type: str | None = None
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
