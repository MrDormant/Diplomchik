from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.user import UserCreate, UserResponse
from app.crud.user import create_user, get_user

from fastapi import HTTPException
from app.core.security import verify_password, create_access_token
from app.crud.user import get_user_by_email


router = APIRouter()


@router.get("/ping")
def ping():
    return {"message": "pong"}



# СОЗДАНИЕ
@router.post("/users", response_model=UserResponse)
def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, user)

# ПОЛУЧЕНИЕ
@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    user = get_user(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = get_user_by_email(db, email)

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})

    return {"access_token": token, "token_type": "bearer"}