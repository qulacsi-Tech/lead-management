"""
Opportunity — an institute-originated Sell Lead: an Admission Notice or a Job
Vacancy published by a Page.

Reinstated in Phase 2. A previous `models/opportunity.py` was deleted in commit
aa2e498; it is NOT copied back verbatim because it predates the Page entity and
the Draft/Published/Expired/Closed lifecycle the Phase 1 UI now expects.

Note on `job_postings`: an orphaned `job_postings` table still exists in the
database from the deleted mentor-availability feature. It is mentor-scoped
(mentor_id), not page-scoped, and models a mentor advertising *their own*
availability rather than an institute advertising a vacancy. It is a different
entity and is deliberately not reused.
"""

from sqlalchemy import Column, String, Integer, DateTime, Date, JSON, ForeignKey, Index
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import date
import uuid

from core.database import Base

OPPORTUNITY_TYPES = ["admission", "job"]
OPPORTUNITY_STATUSES = ["Draft", "Published", "Expired", "Closed"]


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    page_id = Column(String, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False, index=True)  # admission | job

    title = Column(String, nullable=False)
    description = Column(String)
    status = Column(String, default="Draft", nullable=False, index=True)

    # Optional link to a course in the same page's catalogue.
    course_id = Column(String, ForeignKey("courses.id", ondelete="SET NULL"), index=True)

    # --- Admission-notice fields ---
    session = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    eligibility = Column(String)

    # --- Job-vacancy fields ---
    position = Column(String)
    subject = Column(String)
    department = Column(String)
    employment_type = Column(String)
    location = Column(String)
    experience = Column(String)
    qualification = Column(String)
    salary = Column(String)
    skills = Column(JSON, default=list)
    apply_before = Column(Date)

    apply_url = Column(String)

    # Ordering on the public page; 1 = top. "Push to top" rewrites these.
    ranking = Column(Integer, default=100)
    reach = Column(Integer, default=0)
    views = Column(Integer, default=0)

    published_at = Column(DateTime(timezone=True))
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("ix_opportunities_page_type_status", "page_id", "type", "status"),
    )


class OpportunityCreate(BaseModel):
    type: str
    title: str = Field(min_length=1, max_length=300)
    description: Optional[str] = None
    status: str = "Draft"
    course_id: Optional[str] = None

    session: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    eligibility: Optional[str] = None

    position: Optional[str] = None
    subject: Optional[str] = None
    department: Optional[str] = None
    employment_type: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    qualification: Optional[str] = None
    salary: Optional[str] = None
    skills: List[str] = []
    apply_before: Optional[date] = None

    apply_url: Optional[str] = None


class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    course_id: Optional[str] = None
    session: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    eligibility: Optional[str] = None
    position: Optional[str] = None
    subject: Optional[str] = None
    department: Optional[str] = None
    employment_type: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    qualification: Optional[str] = None
    salary: Optional[str] = None
    skills: Optional[List[str]] = None
    apply_before: Optional[date] = None
    apply_url: Optional[str] = None


class OpportunityResponse(BaseModel):
    id: str
    page_id: str
    type: str
    title: str
    description: Optional[str] = None
    status: str
    course_id: Optional[str] = None
    session: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    eligibility: Optional[str] = None
    position: Optional[str] = None
    subject: Optional[str] = None
    department: Optional[str] = None
    employment_type: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    qualification: Optional[str] = None
    salary: Optional[str] = None
    skills: Optional[List[str]] = None
    apply_before: Optional[date] = None
    apply_url: Optional[str] = None
    ranking: Optional[int] = None
    reach: Optional[int] = None
    views: Optional[int] = None
    published_at: Optional[Any] = None
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True
