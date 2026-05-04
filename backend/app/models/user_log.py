from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Index

from app.db.database import Base


class UserLog(Base):
    __tablename__ = "user_logs"
    __table_args__ = (
        Index("idx_user_logs_user", "user_id"),
        Index("idx_user_logs_time", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=True)
    entity_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
