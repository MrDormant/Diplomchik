from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Index
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.core.enums import RequestStatus, RequestSource


class ServiceRequest(Base):
    __tablename__ = "service_requests"
    __table_args__ = (
        Index("idx_service_requests_user", "user_id"),
        Index("idx_service_requests_status", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    guest_full_name = Column(String(255), nullable=True)
    guest_phone = Column(String(40), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    solution_id = Column(Integer, ForeignKey("solutions.id", ondelete="SET NULL"), nullable=True)
    source = Column(String, nullable=False, default=RequestSource.CALCULATOR)
    comment = Column(Text, nullable=True)
    status = Column(String, nullable=False, default=RequestStatus.NEW)
    manager_note = Column(Text, nullable=True)
    estimated_total = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    user = relationship("User", backref="service_requests")
    project = relationship("Project", backref="service_requests")
    solution = relationship("Solution", backref="service_requests")
