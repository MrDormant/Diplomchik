from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.enums import RequestStatus
from app.crud import request as request_crud
from app.models.service_request import ServiceRequest
from app.models.user import User
from app.models.user_log import UserLog
from app.schemas.request import ServiceRequestStatusUpdate


def update_request_status(
    db: Session,
    current_user: User,
    request_id: int,
    payload: ServiceRequestStatusUpdate,
) -> ServiceRequest:
    row = request_crud.get_request(db, request_id)
    if not row:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    row.status = payload.status.value
    if payload.manager_note is not None:
        row.manager_note = payload.manager_note
    db.add(row)

    log = UserLog(
        user_id=current_user.id,
        action="request_status_updated",
        entity_type="service_request",
        entity_id=row.id,
    )
    db.add(log)
    db.commit()
    db.refresh(row)
    return row


def get_summary(db: Session) -> dict:
    total = db.query(ServiceRequest).count()
    by_status = {}
    for status in RequestStatus:
        count = db.query(ServiceRequest).filter(ServiceRequest.status == status.value).count()
        by_status[status.value] = count
    return {"requests_total": total, "by_status": by_status}
