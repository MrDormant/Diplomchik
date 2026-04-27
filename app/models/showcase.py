from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text

from app.db.database import Base


class ShowcaseProject(Base):
    """Готовый (реализованный) проект для витрины каталога «Готовые проекты»."""

    __tablename__ = "showcase_projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    address = Column(String(255), nullable=True)
    project_cost = Column(Numeric(14, 2), nullable=True)
    cover_image = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
