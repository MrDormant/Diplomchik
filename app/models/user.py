from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.db.database import Base
from app.core.enums import UserStatus

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    role = Column(String, default=UserStatus.CLIENT)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String)

    password_hash = Column(String, nullable=False)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)