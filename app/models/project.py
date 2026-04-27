from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text, Boolean
from sqlalchemy.orm import relationship

from app.db.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    client_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    object_type = Column(String, nullable=True)
    frame_type = Column(String, nullable=True)
    length = Column(Numeric(12, 2), nullable=True)
    width = Column(Numeric(12, 2), nullable=True)
    height = Column(Numeric(12, 2), nullable=True)
    area_sqm = Column(Numeric(14, 2), nullable=True)
    description = Column(Text, nullable=True)
    is_saved = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    client = relationship("User", backref="projects")
    project_solutions = relationship("ProjectSolution", back_populates="project", cascade="all, delete-orphan")


class ProjectSolution(Base):
    __tablename__ = "project_solutions"
    __table_args__ = ()

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    solution_id = Column(Integer, ForeignKey("solutions.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Numeric(14, 4), default=1)
    unit = Column(String, default="шт")
    material_cost = Column(Numeric(14, 2), nullable=False)
    work_cost = Column(Numeric(14, 2), nullable=False)
    total_cost = Column(Numeric(14, 2), nullable=False)
    note = Column(String, nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="project_solutions")
    solution = relationship("Solution")
