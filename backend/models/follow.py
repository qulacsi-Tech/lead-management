from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from core.database import Base
import uuid


# --- SQLAlchemy Model ---
class MentorFollow(Base):
    __tablename__ = "mentor_follows"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String, ForeignKey("students.id"), nullable=False, index=True)
    mentor_id = Column(String, ForeignKey("mentors.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("student_id", "mentor_id", name="uq_student_mentor_follow"),
    )
