from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class SolutionListItem(BaseModel):
    id: int
    code: str | None
    name: str
    slug: str
    short_description: str | None
    material_type: str | None
    base_material_cost: Decimal | None
    base_work_cost: Decimal | None
    cost_unit: str | None
    is_featured: bool
    cover_image: str | None = None

    model_config = {"from_attributes": True}


class SolutionDetail(SolutionListItem):
    description: str | None
    load_capacity_kn_m2: Decimal | None
    span_width_m: Decimal | None
    created_at: datetime
    cover_image: str | None = None

    model_config = {"from_attributes": True}


class SolutionCategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    parent_id: int | None
    sort_order: int

    model_config = {"from_attributes": True}


class AdminSolutionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    slug: str = Field(..., min_length=2, max_length=200, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    category_id: int
    code: str | None = Field(None, max_length=50)
    short_description: str | None = Field(None, max_length=255)
    description: str | None = None
    cover_image: str | None = Field(None, max_length=512)
    base_material_cost: Decimal = Decimal("0")
    base_work_cost: Decimal = Decimal("0")
    material_type: str | None = Field(None, max_length=120)
    is_featured: bool = False


class AdminSolutionRow(BaseModel):
    id: int
    code: str | None
    name: str
    slug: str
    category_id: int
    category_name: str
    short_description: str | None
    cover_image: str | None = None
    material_type: str | None
    base_material_cost: Decimal | None
    base_work_cost: Decimal | None
    is_featured: bool
    is_active: bool
