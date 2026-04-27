from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.solution import SolutionCategoryResponse, SolutionDetail, SolutionListItem
from app.crud import solution as solution_crud

router = APIRouter()


@router.get("/categories", response_model=list[SolutionCategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return solution_crud.list_categories(db)


@router.get("/solutions", response_model=list[SolutionListItem])
def list_solutions(
    db: Session = Depends(get_db),
    category: str | None = Query(None, description="slug категории"),
    skip: int = 0,
    limit: int = 100,
):
    return solution_crud.list_solutions(db, category_slug=category, skip=skip, limit=limit)


@router.get("/solutions/by-slug/{slug}", response_model=SolutionDetail)
def get_solution(slug: str, db: Session = Depends(get_db)):
    row = solution_crud.get_solution_by_slug(db, slug)
    if not row:
        raise HTTPException(status_code=404, detail="Решение не найдено")
    return row
