import re
import shutil
import uuid
from decimal import Decimal
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.core.deps import require_roles
from app.models.solution import Solution
from app.models.user import User
from app.schemas.request import ServiceRequestResponse, ServiceRequestStatusUpdate
from app.schemas.showcase import AdminShowcaseProjectRow
from app.schemas.solution import AdminSolutionRow
from app.schemas.user import UserResponse, UserRoleUpdate
from app.crud import request as request_crud
from app.crud import showcase as showcase_crud
from app.crud import solution as solution_crud
from app.crud import user as user_crud
from app.services import admin_service

router = APIRouter()

_PROJECT_ROOT = Path(__file__).resolve().parents[5]
_FRONTEND_DIR = _PROJECT_ROOT / "frontend"
_COVER_DIR = _FRONTEND_DIR / "library-covers"
_SHOWCASE_DIR = _FRONTEND_DIR / "showcase-covers"
_ALLOWED_COVER_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _save_image(upload: UploadFile | None, target_dir: Path, url_prefix: str) -> str | None:
    if upload is None or not upload.filename:
        return None
    suffix = Path(upload.filename).suffix.lower()
    if suffix not in _ALLOWED_COVER_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Обложка должна быть файлом JPG, PNG, GIF или WEBP",
        )
    if upload.content_type and not upload.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Обложка должна быть изображением")

    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{suffix}"
    path = target_dir / filename
    with path.open("wb") as out:
        shutil.copyfileobj(upload.file, out)
    return f"{url_prefix}/{filename}"


def _save_solution_cover(upload: UploadFile | None) -> str | None:
    return _save_image(upload, _COVER_DIR, "/assets/library-covers")


def _save_showcase_cover(upload: UploadFile | None) -> str | None:
    return _save_image(upload, _SHOWCASE_DIR, "/assets/showcase-covers")


def _admin_solution_row(solution, category_name: str) -> AdminSolutionRow:
    return AdminSolutionRow(
        id=solution.id,
        code=solution.code,
        name=solution.name,
        slug=solution.slug,
        category_id=solution.category_id,
        category_name=category_name,
        short_description=solution.short_description,
        cover_image=solution.cover_image,
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


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def admin_update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя менять собственную роль")
    row = user_crud.get_user(db, user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    row.role = payload.role.value
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


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
    name: str = Form(...),
    slug: str = Form(...),
    category_id: int = Form(...),
    code: str | None = Form(None),
    short_description: str | None = Form(None),
    description: str | None = Form(None),
    base_material_cost: Decimal = Form(Decimal("0")),
    base_work_cost: Decimal = Form(Decimal("0")),
    material_type: str | None = Form(None),
    is_featured: bool = Form(False),
    cover_file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("manager")),
):
    name = name.strip()
    slug = slug.strip().lower()
    code = code.strip() if code else None
    short_description = short_description.strip() if short_description else None
    material_type = material_type.strip() if material_type else None

    if not name:
        raise HTTPException(status_code=422, detail="Укажите название")
    if not _SLUG_RE.match(slug):
        raise HTTPException(status_code=422, detail="Slug должен быть латиницей с дефисами")

    cat = solution_crud.get_category_by_id(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    if solution_crud.get_solution_by_slug_any(db, slug):
        raise HTTPException(status_code=400, detail="Решение с таким slug уже существует")
    if code:
        dup = db.query(Solution).filter(Solution.code == code).first()
        if dup:
            raise HTTPException(status_code=400, detail="Код решения уже занят")
    cover_image = _save_solution_cover(cover_file)
    row = solution_crud.create_solution_row(
        db,
        name=name,
        slug=slug,
        category_id=category_id,
        code=code,
        short_description=short_description,
        description=description,
        cover_image=cover_image,
        base_material_cost=base_material_cost,
        base_work_cost=base_work_cost,
        material_type=material_type,
        is_featured=is_featured,
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


@router.get("/showcase-projects", response_model=list[AdminShowcaseProjectRow])
def admin_list_showcase(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("manager")),
):
    return showcase_crud.admin_list_all_showcase(db)


@router.post("/showcase-projects", response_model=AdminShowcaseProjectRow)
def admin_create_showcase(
    name: str = Form(...),
    description: str | None = Form(None),
    address: str | None = Form(None),
    project_cost: Decimal | None = Form(None),
    cover_file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("manager")),
):
    name = name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Укажите название проекта")
    description = description.strip() if description else None
    address = address.strip() if address else None
    cover_image = _save_showcase_cover(cover_file)
    row = showcase_crud.create_showcase_row(
        db,
        name=name,
        description=description,
        address=address,
        project_cost=project_cost,
        cover_image=cover_image,
        is_active=True,
    )
    return row


@router.delete("/showcase-projects/{showcase_id}", response_model=AdminShowcaseProjectRow)
def admin_remove_showcase(
    showcase_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("manager")),
):
    row = showcase_crud.get_showcase_by_id(db, showcase_id)
    if not row:
        raise HTTPException(status_code=404, detail="Проект не найден")
    updated = showcase_crud.soft_delete_showcase(db, showcase_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return updated
