from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.core.config import settings  # ← отсюда берём ключи
from app.core.security import verify_password, create_access_token  # ← функции
from app.crud.user import get_user

from app.models.user import User  

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = get_user(db, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def require_role(required_role: str):
    """Декоратор-зависимость для проверки роли"""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role and current_user.role != "admin":
            raise HTTPException(
                status_code=403, 
                detail=f"Требуется роль: {required_role}"
            )
        return current_user
    return role_checker