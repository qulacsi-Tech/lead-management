from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, Any
from core.database import Base
import uuid


# --- SQLAlchemy Model ---
class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    mentor_id = Column(String, ForeignKey("mentors.id"), nullable=False, index=True)
    subject = Column(String, nullable=False)
    location = Column(String, nullable=False)
    salary = Column(String)
    availability = Column(String, default="Immediate")
    employment_type = Column(String, default="Full-time")
    status = Column(String, default="Active")  # Active | Closed
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- Pydantic Schemas ---
class JobPostingCreate(BaseModel):
    subject: str
    location: str
    salary: Optional[str] = None
    availability: Optional[str] = "Immediate"
    employment_type: Optional[str] = "Full-time"


class JobPostingUpdate(BaseModel):
    status: Optional[str] = None
    subject: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    availability: Optional[str] = None
    employment_type: Optional[str] = None


class JobPostingResponse(BaseModel):
    id: str
    mentor_id: str
    subject: str
    location: str
    salary: Optional[str] = None
    availability: Optional[str] = None
    employment_type: Optional[str] = None
    status: str
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True
