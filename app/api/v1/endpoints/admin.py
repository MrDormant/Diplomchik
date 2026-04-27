from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.core.deps import require_roles
from app.models.solution import Solution
from app.models.user import User
from app.schemas.request import ServiceRequestResponse, ServiceRequestStatusUpdate
from app.schemas.solution import AdminSolutionCreate, AdminSolutionRow
from app.schemas.user import UserResponse
from app.crud import request as request_crud
from app.crud import solution as solution_crud
from app.crud import user as user_crud
from app.services import admin_service

router = APIRouter()


def _admin_solution_row(solution, category_name: str) -> AdminSolutionRow:
    return AdminSolutionRow(
        id=solution.id,
        code=solution.code,
        name=solution.name,
        slug=solution.slug,
        category_id=solution.category_id,
        category_name=category_name,
        short_description=solution.short_description,
        material_type=solution.material_type,
        base_material_cost=solution.base_material_cost,
        base_work_cost=solution.base_work_cost,
        is_featured=bool(solution.is_featured),
        is_active=bool(solution.is_active),
    )


@router.get("/requests", response_model=list[ServiceRequestResponse])
def admin_list_requests(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("manager")),
    skip: int = 0,
    limit: int = 200,
):
    return request_crud.list_all_requests(db, skip=skip, limit=limit)


@router.patch("/requests/{request_id}", response_model=ServiceRequestResponse)
def admin_update_request(
    request_id: int,
    payload: ServiceRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("manager")),
):
    return admin_service.update_request_status(db, current_user, request_id, payload)


@router.get("/summary")
def admin_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("manager")),
):
    return admin_service.get_summary(db)


@router.get("/users", response_model=list[UserResponse])
def admin_list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("manager")),
    skip: int = 0,
    limit: int = 500,
):
    return user_crud.list_users_admin(db, skip=skip, limit=limit)


@router.get("/solutions", response_model=list[AdminSolutionRow])
def admin_list_solutions_staff(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("manager")),
):
    rows = solution_crud.admin_list_solutions_all(db)
    return [
        _admin_solution_row(
            r,
            r.category.name if r.category else "",
        )
        for r in rows
    ]


@router.post("/solutions", response_model=AdminSolutionRow)
def admin_create_solution(
    payload: AdminSolutionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("manager")),
):
    cat = solution_crud.get_category_by_id(db, payload.category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    if solution_crud.get_solution_by_slug_any(db, payload.slug):
        raise HTTPException(status_code=400, detail="Решение с таким slug уже существует")
    if payload.code:
        dup = db.query(Solution).filter(Solution.code == payload.code).first()
        if dup:
            raise HTTPException(status_code=400, detail="Код решения уже занят")
    row = solution_crud.create_solution_row(
        db,
        name=payload.name,
        slug=payload.slug,
        category_id=payload.category_id,
        code=payload.code,
        short_description=payload.short_description,
        description=payload.description,
        base_material_cost=payload.base_material_cost,
        base_work_cost=payload.base_work_cost,
        material_type=payload.material_type,
        is_featured=payload.is_featured,
        is_active=True,
    )
    return _admin_solution_row(row, cat.name)


@router.delete("/solutions/{solution_id}", response_model=AdminSolutionRow)
def admin_remove_solution(
    solution_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("manager")),
):
    row = solution_crud.get_solution_by_id(db, solution_id)
    if not row:
        raise HTTPException(status_code=404, detail="Решение не найдено")
    cat = solution_crud.get_category_by_id(db, row.category_id)
    updated = solution_crud.soft_delete_solution(db, solution_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Решение не найдено")
    return _admin_solution_row(
        updated,
        cat.name if cat else "",
    )
