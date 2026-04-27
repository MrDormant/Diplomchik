from pydantic import BaseModel

from app.core.config import settings


class CalcInput(BaseModel):
    length: float
    width: float
    height: float
    object_type: str | None = None
    frame_type: str | None = None


class CalcResult(BaseModel):
    area_sqm: float
    volume_cum: float
    estimated_cost_rub: int
    material_weight_tonnes: int
    construction_time_label: str


FRAME_MULTIPLIER = {
    "lstk": 1.0,
    "steel": 1.08,
    "mixed": 1.05,
}


def estimate_calc(inp: CalcInput) -> CalcResult:
    length = max(inp.length, 0.0)
    width = max(inp.width, 0.0)
    height = max(inp.height, 0.0)

    area = length * width
    volume = length * width * height

    frame_key = (inp.frame_type or "lstk").lower()
    mult = FRAME_MULTIPLIER.get(frame_key, 1.0)

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
