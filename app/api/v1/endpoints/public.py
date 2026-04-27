from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.deps import get_db
from app.schemas.request import GuestCalculatorRequestCreate, ServiceRequestResponse
from app.services import request_service

router = APIRouter()


@router.get("/public/config")
def public_config():
    return {
        "app_name": settings.app_name,
        "manager_phone": settings.manager_phone,
        "manager_phone_tel": f"tel:{settings.manager_phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')}",
    }


@router.post("/public/calculator-request", response_model=ServiceRequestResponse)
async def public_guest_calculator_request(
    payload: GuestCalculatorRequestCreate,
    db: Session = Depends(get_db),
):
    """Заявка по предварительному расчёту без регистрации (имя и телефон)."""
    return await request_service.create_guest_calculator_request(db, payload)
