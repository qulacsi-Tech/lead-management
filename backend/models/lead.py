from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from core.database import Base
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from models.enums import LeadStatus, LeadSource
import uuid

# --- SQLAlchemy Model ---
class Lead(Base):
    """A parent/student enquiry captured by the institute."""
    __tablename__ = "leads"

    id                  = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    parent_name         = Column(String, nullable=False)
    student_name        = Column(String)
    phone               = Column(String, nullable=False, index=True)
    alternate_phone     = Column(String)
    email                = Column(String, index=True)
    city                = Column(String)
    grade_interested    = Column(String)          # e.g. "Grade 5", "Class 10"
    program_interested  = Column(String)           # course / program name
    source              = Column(String, default=LeadSource.OTHER, index=True)
    status              = Column(String, default=LeadStatus.NEW, index=True)
    assigned_to         = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    created_by           = Column(String, ForeignKey("users.id"), nullable=True)
    notes               = Column(Text)
    next_follow_up_at   = Column(DateTime(timezone=True))
    last_contacted_at   = Column(DateTime(timezone=True))
    created_at           = Column(DateTime(timezone=True), server_default=func.now())
    updated_at           = Column(DateTime(timezone=True), onupdate=func.now())

# --- Pydantic Schemas ---
class LeadCreate(BaseModel):
    parent_name: str
    student_name: Optional[str] = None
    phone: str
    alternate_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    city: Optional[str] = None
    grade_interested: Optional[str] = None
    program_interested: Optional[str] = None
    source: Optional[LeadSource] = LeadSource.OTHER
    status: Optional[LeadStatus] = LeadStatus.NEW
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    next_follow_up_at: Optional[datetime] = None

class LeadUpdate(BaseModel):
    parent_name: Optional[str] = None
    student_name: Optional[str] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    city: Optional[str] = None
    grade_interested: Optional[str] = None
    program_interested: Optional[str] = None
    source: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    next_follow_up_at: Optional[datetime] = None
    last_contacted_at: Optional[datetime] = None

class LeadAssign(BaseModel):
    assigned_to: str

class LeadResponse(BaseModel):
    id: str
    parent_name: str
    student_name: Optional[str]
    phone: str
    alternate_phone: Optional[str]
    email: Optional[str]
    city: Optional[str]
    grade_interested: Optional[str]
    program_interested: Optional[str]
    source: str
    status: str
    assigned_to: Optional[str]
    created_by: Optional[str]
    notes: Optional[str]
    next_follow_up_at: Optional[datetime]
    last_contacted_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class LeadListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[LeadResponse]
