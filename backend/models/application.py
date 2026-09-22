"""
OpportunityApplication — someone applying to one Admission Notice or one Job
Vacancy published by a Page.

Why this is not a PageEnquiry
-----------------------------
A `PageEnquiry` is an open-ended question addressed to an institute: "tell me
about your courses". An application is addressed to one specific opportunity,
is made by an identified person, and carries the things an institute needs to
act on it (qualification, experience, resume). The two have different
lifecycles and different inboxes, so they get different tables — the same
reasoning models/page_enquiry.py sets out for keeping itself separate from the
marketplace `enquiries` table.

Ownership: created by the applicant, read and worked by the Page's admins.

Why `user_id` is NOT NULL
-------------------------
Client feedback 22 Sep 2026: "When the user clicks on Apply we should not
redirect them to any other page — our task is to ensure that if the user is new
they should be able to create their profile here itself." Applying therefore
always ends with an account: an anonymous visitor's details create one inline
(see routers/applications.py). There is no anonymous application, which is also
what makes the unique constraint below meaningful.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
import uuid

from core.database import Base
from models.user import UserResponse

APPLICATION_STATUSES = ["New", "Shortlisted", "Contacted", "Rejected", "Closed"]


class OpportunityApplication(Base):
    __tablename__ = "opportunity_applications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    opportunity_id = Column(
        String, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Denormalised from the opportunity so the institute's inbox can be queried
    # without a join, and so an application survives in a page-scoped listing.
    page_id = Column(String, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Snapshot of who applied, at the time they applied. Kept on the row rather
    # than read through the user relationship because an institute reviewing an
    # application months later needs the details as submitted, not as since
    # edited on the profile.
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    city = Column(String)
    state = Column(String)

    # Job applications only; an admission application leaves these null.
    qualification = Column(String)
    experience = Column(String)
    current_institute = Column(String)
    resume_url = Column(String)

    message = Column(String)

    status = Column(String, default="New", nullable=False)
    note = Column(String)  # the institute's private working notes

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("opportunity_id", "user_id", name="uq_application_per_user"),
        Index("ix_applications_page_status", "page_id", "status"),
    )


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ApplicationCreate(BaseModel):
    """Submitted from the Apply dialog on a public institute page.

    `password` is used only when `email` has no account yet — the applicant is
    creating their profile inline, without leaving the page. For a signed-in
    applicant every field here is optional and defaults come from their
    profile.
    """

    name: Optional[str] = Field(default=None, max_length=150)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)

    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    current_institute: Optional[str] = None
    resume_url: Optional[str] = None
    message: Optional[str] = None


class ApplicationUpdate(BaseModel):
    """Only the receiving institute may change these."""

    status: Optional[str] = None
    note: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    opportunity_id: str
    page_id: str
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    current_institute: Optional[str] = None
    resume_url: Optional[str] = None
    message: Optional[str] = None
    status: str
    note: Optional[str] = None
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True


class ApplicationSubmitResponse(BaseModel):
    """What the Apply dialog gets back.

    `access_token` and `user` are present only when applying created a new
    account — the dialog signs the applicant in with them so they stay on the
    institute page already logged in, instead of being sent to /signup and
    losing their place. They are shaped to match TokenResponse so the client's
    existing `loginFromToken` can consume this directly.
    """

    application: ApplicationResponse
    access_token: Optional[str] = None
    user: Optional[UserResponse] = None
    account_created: bool = False
