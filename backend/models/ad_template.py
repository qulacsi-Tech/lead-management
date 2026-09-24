"""
Ad Description Template — one predecided description LINE an institute picks
from when publishing an Admission Notice, a Job Vacancy or a Guess Paper. An
ad's description is up to three of these, one per line ("Ad description - 3
Line"; clarified 24 Sep 2026 as three single-line picks, not one 3-line block).

Client feedback 22 Sep 2026, row 5 asked for these to be predecided ("Ad
description - 3 Line (Select Any One)"); they started life as a constant in
frontend/src/constants/adTemplates.js. The follow-up asked for them to be
"customizable as per requirement", so the list now lives here and the Main
Admin edits it from the Platform Admin → Ad Descriptions screen.

PLATFORM-owned: every page reads the same list, only a Main Admin writes it.

`{name}` in `text` is replaced with the institute's name by the frontend when
the ad is saved. What an Opportunity / StudyPaper stores is that filled-in
text, not a reference to this row — so editing or deleting a template never
rewrites an ad that is already published.
"""

from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index
from sqlalchemy.sql import func

from core.database import Base

# The three ad types that carry a description. Matches Opportunity.type
# ('admission' | 'job') plus 'paper' for StudyPaper.
AD_TEMPLATE_SECTIONS = ["admission", "job", "paper"]

# One line each; an ad's description is up to three of them, one per line.
AD_TEMPLATE_MAX_LENGTH = 200


class AdDescriptionTemplate(Base):
    __tablename__ = "ad_description_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    section = Column(String, nullable=False)
    text = Column(String, nullable=False)
    # Display order within a section; new templates are appended.
    sort_order = Column(Integer, nullable=False, default=0)

    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("ix_ad_description_templates_section_order", "section", "sort_order"),
    )


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AdDescriptionTemplateCreate(BaseModel):
    section: str
    text: str = Field(min_length=1, max_length=AD_TEMPLATE_MAX_LENGTH)


class AdDescriptionTemplateUpdate(BaseModel):
    text: Optional[str] = Field(default=None, min_length=1, max_length=AD_TEMPLATE_MAX_LENGTH)
    sort_order: Optional[int] = None


class AdDescriptionTemplateResponse(BaseModel):
    id: str
    section: str
    text: str
    sort_order: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
