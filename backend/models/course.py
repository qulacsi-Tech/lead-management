"""
Course — INSTITUTE-owned academic catalogue entry.

Every course belongs to exactly one Page. There was no backend representation
of a course at all before Phase 2 (the frontend held a free-text string list),
so nothing is being duplicated here.
"""

from sqlalchemy import Column, String, Boolean, DateTime, JSON, ForeignKey, Index
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from typing import Optional, List, Any
import uuid

from core.database import Base

COURSE_STATUSES = ["Draft", "Published"]


class Course(Base):
    __tablename__ = "courses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    page_id = Column(String, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String, nullable=False)
    category = Column(String, index=True)
    level = Column(String)
    duration = Column(String)
    fees = Column(String)
    intake = Column(String)
    eligibility = Column(String)
    description = Column(String)
    specializations = Column(JSON, default=list)

    # Draft courses are invisible on the public page — the Institute Admin's
    # own workflow state, enforced server-side in the public read endpoint.
    status = Column(String, default="Draft", nullable=False, index=True)
    admission_open = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (Index("ix_courses_page_status", "page_id", "status"),)


class CourseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: Optional[str] = None
    level: Optional[str] = None
    duration: Optional[str] = None
    fees: Optional[str] = None
    intake: Optional[str] = None
    eligibility: Optional[str] = None
    description: Optional[str] = None
    specializations: List[str] = []
    status: str = "Draft"
    admission_open: bool = False


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    duration: Optional[str] = None
    fees: Optional[str] = None
    intake: Optional[str] = None
    eligibility: Optional[str] = None
    description: Optional[str] = None
    specializations: Optional[List[str]] = None
    status: Optional[str] = None
    admission_open: Optional[bool] = None


class CourseResponse(BaseModel):
    id: str
    page_id: str
    name: str
    category: Optional[str] = None
    level: Optional[str] = None
    duration: Optional[str] = None
    fees: Optional[str] = None
    intake: Optional[str] = None
    eligibility: Optional[str] = None
    description: Optional[str] = None
    specializations: Optional[List[str]] = None
    status: str
    admission_open: bool
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None

    class Config:
        from_attributes = True
