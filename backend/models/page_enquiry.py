"""
PageEnquiry — an enquiry addressed to one specific Institute Page.

Why this is NOT the existing `enquiries` table
----------------------------------------------
`models/enquiry.py` (`enquiries`) holds a student's *general* interest —
enquiry_type + state + course, with no institute attached — which institutes
then pay credits to unlock (`enquiry_unlocks`). That is the marketplace "Buy
Lead" side of the product and it has live data.

A PageEnquiry is the opposite direction: a visitor filling in the enquiry form
on one institute's public page, addressed to that institute, free to the
institute that received it. Same word, different entity — so it gets its own
table rather than overloading a marketplace record with a page_id.

Ownership: created by the enquirer, read and worked by the Page's admins.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
import uuid

from core.database import Base

ENQUIRY_STATUSES = ["New", "Contacted", "Responded", "Closed"]


class PageEnquiry(Base):
    __tablename__ = "page_enquiries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    page_id = Column(String, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True)

    # Set when the enquirer was signed in; enquiries are also accepted from
    # anonymous visitors, which is why this is nullable.
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), index=True)

    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    city = Column(String)
    state = Column(String)

    course_id = Column(String, ForeignKey("courses.id", ondelete="SET NULL"))
    course_name = Column(String)
    specialization = Column(String)

    status = Column(String, default="New", nullable=False, index=True)
    # Institute Admin's private working notes / response log.
    note = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (Index("ix_page_enquiries_page_status", "page_id", "status"),)


class PageEnquiryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    course_id: Optional[str] = None
    course_name: Optional[str] = None
    specialization: Optional[str] = None


class PageEnquiryUpdate(BaseModel):
    """Only the receiving institute may change these."""
    status: Optional[str] = None
    note: Optional[str] = None


class PageEnquiryResponse(BaseModel):
    id: str
    page_id: str
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    course_id: Optional[str] = None
    course_name: Optional[str] = None
    specialization: Optional[str] = None
    status: str
    note: Optional[str] = None
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True
