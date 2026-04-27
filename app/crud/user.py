from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password


def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = hash_password(user.password)
    db_user = User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        password_hash=hashed_password,
        role=UserRole.CLIENT,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def list_users_admin(db: Session, skip: int = 0, limit: int = 500) -> list[User]:
    return (
        db.query(User)
        .order_by(User.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
