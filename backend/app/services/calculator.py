from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.enums import FrameType, ObjectType


class CalcInput(BaseModel):
    length: float = Field(..., gt=0, le=500, description="Длина объекта, м (0 < L ≤ 500)")
    width: float = Field(..., gt=0, le=500, description="Ширина объекта, м (0 < W ≤ 500)")
    height: float = Field(..., gt=0, le=50, description="Высота объекта, м (0 < H ≤ 50)")
    object_type: ObjectType | None = None
    frame_type: FrameType | None = None


class CalcResult(BaseModel):
    area_sqm: float
    volume_cum: float
    estimated_cost_rub: int
    material_weight_tonnes: int
    construction_time_label: str


FRAME_MULTIPLIER = {
    FrameType.LSTK: 1.0,
    FrameType.STEEL: 1.08,
    FrameType.MIXED: 1.05,
}


def estimate_calc(inp: CalcInput) -> CalcResult:
    length = max(inp.length, 0.0)
    width = max(inp.width, 0.0)
    height = max(inp.height, 0.0)

    area = length * width
    volume = length * width * height

    frame = inp.frame_type or FrameType.LSTK
    mult = FRAME_MULTIPLIER.get(frame, 1.0)

    price = settings.calc_price_per_sqm * mult
    estimated_cost = int(round(area * price))
    material_weight = int(round(volume * 0.15))

    if area < 1000:
        time_label = "2–3 месяца"
    elif area < 5000:
        time_label = "4–5 месяцев"
    else:
        time_label = "6–8 месяцев"

    return CalcResult(
        area_sqm=round(area, 2),
        volume_cum=round(volume, 2),
        estimated_cost_rub=estimated_cost,
        material_weight_tonnes=material_weight,
        construction_time_label=time_label,
    )
