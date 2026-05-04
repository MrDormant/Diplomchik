from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class ShowcaseProjectListItem(BaseModel):
    id: int
    name: str
    description: str | None
    address: str | None
    project_cost: Decimal | None
    cover_image: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminShowcaseProjectRow(BaseModel):
    id: int
    name: str
    description: str | None
    address: str | None
    project_cost: Decimal | None
    cover_image: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
