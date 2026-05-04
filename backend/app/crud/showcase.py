from sqlalchemy.orm import Session

from app.models.showcase import ShowcaseProject


def list_active_showcase(db: Session, skip: int = 0, limit: int = 100) -> list[ShowcaseProject]:
    return (
        db.query(ShowcaseProject)
        .filter(ShowcaseProject.is_active.is_(True))
        .order_by(ShowcaseProject.created_at.desc(), ShowcaseProject.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def admin_list_all_showcase(db: Session) -> list[ShowcaseProject]:
    return (
        db.query(ShowcaseProject)
        .order_by(ShowcaseProject.id.desc())
        .all()
    )


def get_showcase_by_id(db: Session, showcase_id: int) -> ShowcaseProject | None:
    return db.query(ShowcaseProject).filter(ShowcaseProject.id == showcase_id).first()


def create_showcase_row(db: Session, **fields) -> ShowcaseProject:
    row = ShowcaseProject(**fields)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def soft_delete_showcase(db: Session, showcase_id: int) -> ShowcaseProject | None:
    row = db.query(ShowcaseProject).filter(ShowcaseProject.id == showcase_id).first()
    if not row:
        return None
    row.is_active = False
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
