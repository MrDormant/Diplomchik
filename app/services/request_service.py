from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.enums import RequestSource
from app.crud import project as project_crud
from app.crud import request as request_crud
from app.crud import solution as solution_crud
from app.models.user import User
from app.schemas.request import GuestCalculatorRequestCreate, ServiceRequestCreate
from app.services.calculator import CalcInput, estimate_calc
from app.services.email import send_operator_notification


def _snapshot_from_calc_input(calc: CalcInput) -> str:
    est = estimate_calc(calc)
    return (
        f"Площадь ~{est.area_sqm} м², "
        f"ориентир {est.estimated_cost_rub} ₽, "
        f"срок {est.construction_time_label}"
    )


def _build_estimated_snapshot(project) -> str:
    calc = CalcInput(
        length=float(project.length or 0),
        width=float(project.width or 0),
        height=float(project.height or 0),
        object_type=project.object_type,
        frame_type=project.frame_type,
    )
    return _snapshot_from_calc_input(calc)


def _build_notification_body(
    row,
    for_user: User | None,
    estimated_snapshot: str | None,
) -> str:
    body = (
        f"Новая заявка #{row.id}\n"
        f"Источник: {row.source}\n"
    )
    if for_user:
        body += (
            f"Клиент: {for_user.full_name}, {for_user.email}, тел. {for_user.phone}\n"
        )
    else:
        body += (
            f"Гость (без личного кабинета): {row.guest_full_name}, "
            f"тел. {row.guest_phone}\n"
        )
    if row.project_id:
        body += f"Проект ID: {row.project_id}\n"
    if row.solution_id:
        body += f"Решение ID: {row.solution_id}\n"
    if row.comment:
        body += f"Комментарий: {row.comment}\n"
    if estimated_snapshot:
        body += f"Оценка: {estimated_snapshot}\n"
    return body


async def create_request(
    db: Session,
    current_user: User,
    payload: ServiceRequestCreate,
):
    if not current_user.phone:
        raise HTTPException(
            status_code=400,
            detail="Укажите телефон в профиле (или при регистрации) для связи оператора",
        )

    estimated_snapshot = None
    if payload.source == RequestSource.CALCULATOR:
        if not payload.project_id:
            raise HTTPException(
                status_code=400,
                detail="Для заявки из калькулятора укажите project_id (сначала сохраните расчёт)",
            )
        project = project_crud.get_project_for_user(db, payload.project_id, current_user.id)
        if not project:
            raise HTTPException(status_code=404, detail="Проект не найден")
        estimated_snapshot = _build_estimated_snapshot(project)
    elif payload.source == RequestSource.LIBRARY and payload.solution_id:
        solution = solution_crud.get_solution_by_id(db, payload.solution_id)
        if not solution:
            raise HTTPException(status_code=404, detail="Решение не найдено")

    row = request_crud.create_service_request(
        db,
        current_user.id,
        payload,
        estimated_snapshot=estimated_snapshot,
    )

    body = _build_notification_body(row, current_user, estimated_snapshot)
    await send_operator_notification(f"Новая заявка #{row.id}", body)
    return row


async def create_guest_calculator_request(
    db: Session,
    payload: GuestCalculatorRequestCreate,
):
    calc = CalcInput(
        length=payload.length,
        width=payload.width,
        height=payload.height,
        object_type=payload.object_type,
        frame_type=payload.frame_type,
    )
    estimated_snapshot = _snapshot_from_calc_input(calc)
    row = request_crud.create_guest_calculator_request(
        db, payload, estimated_snapshot=estimated_snapshot
    )
    body = _build_notification_body(row, None, estimated_snapshot)
    await send_operator_notification(f"Новая заявка #{row.id}", body)
    return row
