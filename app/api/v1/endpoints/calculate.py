from fastapi import APIRouter

from app.services.calculator import CalcInput, estimate_calc

router = APIRouter()


@router.post("/calculate")
def calculate(inp: CalcInput):
    return estimate_calc(inp)
