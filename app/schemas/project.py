from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    object_type: str | None = None
    frame_type: str | None = None
    length: float | None = None
    width: float | None = None
    height: float | None = None
    area_sqm: float | None = None
    description: str | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    object_type: str | None = None
    frame_type: str | None = None
    length: Decimal | None
    width: Decimal | None
    height: Decimal | None
    area_sqm: Decimal | None
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
