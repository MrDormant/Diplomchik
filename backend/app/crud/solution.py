from sqlalchemy.orm import Session, joinedload

from app.models.solution import Solution, SolutionCategory


def list_categories(db: Session) -> list[SolutionCategory]:
    return db.query(SolutionCategory).order_by(SolutionCategory.sort_order, SolutionCategory.id).all()


def get_category_by_id(db: Session, category_id: int) -> SolutionCategory | None:
    return db.query(SolutionCategory).filter(SolutionCategory.id == category_id).first()


def list_solutions(
    db: Session,
    category_slug: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Solution]:
    q = db.query(Solution).filter(Solution.is_active.is_(True))
    if category_slug:
        cat = db.query(SolutionCategory).filter(SolutionCategory.slug == category_slug).first()
        if cat:
            q = q.filter(Solution.category_id == cat.id)
    return (
        q.options(joinedload(Solution.category))
        .order_by(Solution.is_featured.desc(), Solution.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_solution_by_slug(db: Session, slug: str) -> Solution | None:
    return (
        db.query(Solution)
        .options(joinedload(Solution.category), joinedload(Solution.files))
        .filter(Solution.slug == slug, Solution.is_active.is_(True))
        .first()
    )


def get_solution_by_id(db: Session, solution_id: int) -> Solution | None:
    return db.query(Solution).filter(Solution.id == solution_id).first()


def get_solution_by_slug_any(db: Session, slug: str) -> Solution | None:
    return db.query(Solution).filter(Solution.slug == slug).first()


def admin_list_solutions_all(db: Session) -> list[Solution]:
    return (
        db.query(Solution)
        .options(joinedload(Solution.category))
        .order_by(Solution.category_id, Solution.id)
        .all()
    )


def create_solution_row(db: Session, **fields) -> Solution:
    row = Solution(**fields)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def soft_delete_solution(db: Session, solution_id: int) -> Solution | None:
    row = db.query(Solution).filter(Solution.id == solution_id).first()
    if not row:
        return None
    row.is_active = False
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
