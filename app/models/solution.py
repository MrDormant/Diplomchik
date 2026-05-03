from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class SolutionCategory(Base):
    __tablename__ = "solution_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("solution_categories.id", ondelete="SET NULL"), nullable=True)
    sort_order = Column(Integer, default=0)

    parent = relationship("SolutionCategory", remote_side=[id], backref="children")
    solutions = relationship("Solution", back_populates="category")


class Solution(Base):
    __tablename__ = "solutions"
    __table_args__ = (Index("idx_solutions_category", "category_id"),)

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    short_description = Column(String(255), nullable=True)
    category_id = Column(Integer, ForeignKey("solution_categories.id", ondelete="RESTRICT"), nullable=False)
    base_material_cost = Column(Numeric(14, 2), default=0)
    base_work_cost = Column(Numeric(14, 2), default=0)
    cost_unit = Column(String, default="м²")
    load_capacity_kn_m2 = Column(Numeric(10, 2), nullable=True)
    span_width_m = Column(Numeric(10, 2), nullable=True)
    material_type = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)
    cover_image = Column(String(512), nullable=True)
    testovoe_pole = Column(String(500), nullable=True)

    category = relationship("SolutionCategory", back_populates="solutions")
    files = relationship("SolutionFile", back_populates="solution", cascade="all, delete-orphan")


class SolutionFile(Base):
    __tablename__ = "solution_files"

    id = Column(Integer, primary_key=True, index=True)
    solution_id = Column(Integer, ForeignKey("solutions.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    access_level = Column(String, default="public")
    title = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    solution = relationship("Solution", back_populates="files")
