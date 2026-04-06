from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.db.deps import get_db
from app.schemas.user import UserCreate, UserResponse
from app.crud.user import create_user, get_user, get_user_by_email
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user
from app.models.user import User

from app.core.deps import get_current_user, require_role

router = APIRouter()

@router.post("/users", response_model=UserResponse)
def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, user)



@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    user = get_user(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user



@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = get_user_by_email(db, form_data.username)

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})

    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/admin-panel")
def admin_panel(user: User = Depends(require_role("admin"))):
    return {"message": f"Привет, админ {user.full_name}!", "role": user.role}