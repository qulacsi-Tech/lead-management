from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, Any
from core.database import Base
from models.enums import EnquiryType
import uuid


# --- SQLAlchemy Models ---
class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String, ForeignKey("students.id"), nullable=False, index=True)
    enquiry_type = Column(String, nullable=False)  # Coaching | College
    state = Column(String, nullable=False)
    course = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EnquiryUnlock(Base):
    __tablename__ = "enquiry_unlocks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institute_id = Column(String, ForeignKey("institutes.id"), nullable=False, index=True)
    enquiry_id = Column(String, ForeignKey("enquiries.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("institute_id", "enquiry_id", name="uq_institute_enquiry_unlock"),
    )


# --- Pydantic Schemas ---
class EnquiryCreate(BaseModel):
    enquiry_type: EnquiryType
    state: str
    course: str


class EnquiryResponse(BaseModel):
    id: str
    enquiry_type: str
    state: str
    course: str
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True


class EnquiryInstituteResponse(BaseModel):
    id: str
    enquiry_type: str
    state: str
    course: str
    created_at: Optional[Any] = None
    is_hot: bool = False
    is_unlocked: bool = False
    unlock_cost: int = 10
    student_name: Optional[str] = None
    student_phone: Optional[str] = None
    student_email: Optional[str] = None


class EnquiryAdminResponse(BaseModel):
    id: str
    student_name: str
    enquiry_type: str
    state: str
    course: str
    created_at: Optional[Any] = None
    matching_institutes: int = 0
