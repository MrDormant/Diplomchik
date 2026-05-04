from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.user import User


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    inn = Column(String, unique=True, nullable=True)
    status = Column(String, default="pending")
    verified_by_id = Column(
        Integer,
        ForeignKey("users.id", use_alter=True, name="fk_companies_verified_by"),
        nullable=True,
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="company", foreign_keys=[User.company_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])
