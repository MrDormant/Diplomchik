from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.request import ServiceRequestCreate, ServiceRequestResponse
from app.crud import request as request_crud
from app.services import request_service

router = APIRouter()


@router.post("/requests", response_model=ServiceRequestResponse)
async def create_request(
    payload: ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await request_service.create_request(db, current_user, payload)


@router.get("/requests", response_model=list[ServiceRequestResponse])
def list_my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return request_crud.list_requests_for_user(db, current_user.id)


@router.get("/requests/{request_id}", response_model=ServiceRequestResponse)
def get_my_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = request_crud.get_request(db, request_id)
    if not row or row.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return row
