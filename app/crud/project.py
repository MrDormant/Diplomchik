from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate


def create_project(db: Session, client_id: int, data: ProjectCreate) -> Project:
    area = None
    if data.length is not None and data.width is not None:
        area = Decimal(str(data.length * data.width))
    elif data.area_sqm is not None:
        area = Decimal(str(data.area_sqm))

    row = Project(
        name=data.name,
        client_id=client_id,
        object_type=data.object_type,
        frame_type=data.frame_type,
        length=Decimal(str(data.length)) if data.length is not None else None,
        width=Decimal(str(data.width)) if data.width is not None else None,
        height=Decimal(str(data.height)) if data.height is not None else None,
        area_sqm=area,
        description=data.description,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_project_for_user(db: Session, project_id: int, user_id: int) -> Project | None:
    return (
        db.query(Project)
        .filter(Project.id == project_id, Project.client_id == user_id)
        .first()
    )


def get_project(db: Session, project_id: int) -> Project | None:
    return db.query(Project).filter(Project.id == project_id).first()
