from sqlalchemy.orm import Session, joinedload

from app.core.enums import RequestSource, RequestStatus
from app.models.service_request import ServiceRequest
from app.models.user_log import UserLog
from app.schemas.request import GuestCalculatorRequestCreate, ServiceRequestCreate


def create_service_request(
    db: Session,
    user_id: int,
    payload: ServiceRequestCreate,
    estimated_snapshot: str | None = None,
) -> ServiceRequest:
    row = ServiceRequest(
        user_id=user_id,
        project_id=payload.project_id,
        solution_id=payload.solution_id,
        source=payload.source.value,
        comment=payload.comment,
        status=RequestStatus.NEW,
        estimated_total=estimated_snapshot,
    )
    db.add(row)
    db.flush()

    log = UserLog(
        user_id=user_id,
        action="request_created",
        entity_type="service_request",
        entity_id=row.id,
    )
    db.add(log)
    db.commit()
    db.refresh(row)

    return row


def create_guest_calculator_request(
    db: Session,
    payload: GuestCalculatorRequestCreate,
    estimated_snapshot: str,
) -> ServiceRequest:
    row = ServiceRequest(
        user_id=None,
        guest_full_name=payload.full_name.strip(),
        guest_phone=payload.phone.strip(),
        project_id=None,
        solution_id=None,
        source=RequestSource.CALCULATOR.value,
        comment=payload.comment,
        status=RequestStatus.NEW,
        estimated_total=estimated_snapshot,
    )
    db.add(row)
    db.flush()

    log = UserLog(
        user_id=None,
        action="request_created",
        entity_type="service_request",
        entity_id=row.id,
    )
    db.add(log)
    db.commit()
    db.refresh(row)

    return row


def list_requests_for_user(db: Session, user_id: int) -> list[ServiceRequest]:
    return (
        db.query(ServiceRequest)
        .options(joinedload(ServiceRequest.user))
        .filter(ServiceRequest.user_id == user_id)
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )


def list_all_requests(db: Session, skip: int = 0, limit: int = 100) -> list[ServiceRequest]:
    return (
        db.query(ServiceRequest)
        .options(joinedload(ServiceRequest.user))
        .order_by(ServiceRequest.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_request(db: Session, request_id: int) -> ServiceRequest | None:
    return (
        db.query(ServiceRequest)
        .options(joinedload(ServiceRequest.user))
        .filter(ServiceRequest.id == request_id)
        .first()
    )
