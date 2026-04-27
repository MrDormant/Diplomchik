from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.core.config import settings
from app.crud.user import get_user
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="В токене нет идентификатора пользователя — войдите снова",
            )
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Сессия истекла — войдите снова",
        )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail=(
                "Недействительный токен. Войдите снова. "
                "Если недавно меняли SECRET_KEY в .env, старый токен в браузере больше не подойдёт."
            ),
        )

    user = get_user(db, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def require_roles(*roles: str):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == "admin" or current_user.role in roles:
            return current_user
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    return role_checker


def require_staff():
    return require_roles("manager")
