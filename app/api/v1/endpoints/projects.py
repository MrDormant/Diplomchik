from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse
from app.crud import project as project_crud
from app.models.project import Project

router = APIRouter()


@router.post("/projects", response_model=ProjectResponse)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return project_crud.create_project(db, current_user.id, payload)


@router.get("/projects", response_model=list[ProjectResponse])
def list_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Project)
        .filter(Project.client_id == current_user.id)
        .order_by(Project.created_at.desc())
        .all()
    )
    return rows


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = project_crud.get_project_for_user(db, project_id, current_user.id)
    if not p:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return p
