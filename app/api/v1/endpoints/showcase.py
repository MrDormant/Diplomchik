from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.showcase import ShowcaseProjectListItem
from app.crud import showcase as showcase_crud

router = APIRouter()


@router.get("/showcase-projects", response_model=list[ShowcaseProjectListItem])
def list_showcase_projects(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    return showcase_crud.list_active_showcase(db, skip=skip, limit=limit)
