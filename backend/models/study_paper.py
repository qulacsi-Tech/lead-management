"""
Study Paper — a guess paper or study material published by a Page, alongside
its Admission Notices and Job Vacancies.

Why this is not an Opportunity
------------------------------
An Opportunity is a *Sell Lead*: the institute publishes it in order to hear
back from the reader, and every route into it ends at the enquiry form. A
Study Paper is the opposite by explicit client instruction —

    "guess paper upload ka option bhi isme hi daal do jo keval download ho,
     download karne wali ki information uske pass nahi jaye"

    (add a guess-paper upload option here too, which is download-only; the
     downloader's information must not reach them)

— so it must never produce a lead for the page. Modelling it as a third
`Opportunity.type` would have put it one careless `or` away from the enquiry
flow, the follower notification fan-out in routers/opportunities.py, and the
likes table. A separate entity makes "this never generates a lead" structural
rather than a rule someone has to remember.

Why the table is `study_papers` and not `papers`
------------------------------------------------
An orphaned `papers` table (plus `paper_questions`, `paper_attempts`) still
exists in the development database from the mentor-question-bank feature
deleted in commit aa2e498, and alembic/env.py deliberately leaves those alone.
Taking the `papers` name would collide with live rows Alembic is instructed not
to touch.

Download privacy
----------------
`StudyPaperDownload` records who downloaded what, because the platform wants
the aggregate and needs to de-duplicate repeat downloads by the same account.
That table is PLATFORM-owned: no page-scoped response model exposes a row from
it, and `StudyPaperResponse` carries only `downloads_count`. The page admin
sees "Downloads: 2,458" and nothing that identifies a single downloader.
"""

from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, JSON, ForeignKey, Index, UniqueConstraint,
)
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from typing import Optional, List, Any
import uuid

from core.database import Base
from models.enums import AD_VISIBILITIES, AdVisibility

STUDY_PAPER_STATUSES = ["Draft", "Published", "Archived"]

# Free-text elsewhere in the product (Course.category, Opportunity.subject), so
# this is a suggestion list for the admin UI rather than a constraint.
STUDY_PAPER_KINDS = ["Guess Paper", "Study Material", "Previous Year Paper", "Notes", "Syllabus"]


class StudyPaper(Base):
    __tablename__ = "study_papers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    page_id = Column(String, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True)

    # "Guess Paper: Physics Class 12" is title="Physics Class 12" with
    # kind="Guess Paper" — kept in two columns so the list can be filtered by
    # kind without parsing the display string back apart.
    title = Column(String, nullable=False)
    kind = Column(String, default="Guess Paper", nullable=False, index=True)
    description = Column(String)

    subject = Column(String)
    class_level = Column(String)   # "Class 12", "JEE Main", "NEET"
    exam = Column(String)
    session = Column(String)
    tags = Column(JSON, default=list)

    # The uploaded file, as a /uploads/... path from core.storage.save_upload.
    # A paper cannot be Published without one — enforced in the router, since a
    # Draft is legitimately allowed to exist before the PDF is attached.
    file_url = Column(String)
    file_name = Column(String)
    file_size = Column(Integer)

    status = Column(String, default="Draft", nullable=False, index=True)

    # Where this paper may run — see models/enums.py AdVisibility. "platform"
    # offers it on every institute's page, which is how a strong guess paper
    # earns its uploader reach beyond their own followers.
    visibility = Column(String, default=AdVisibility.PAGE.value, nullable=False, index=True)

    # Denormalised counter, incremented in the same transaction as the
    # StudyPaperDownload insert. Stored rather than COUNT(*)-ed because the
    # public card renders it on every page view, while the rows behind it are
    # only ever read by platform-level reporting.
    downloads_count = Column(Integer, default=0, nullable=False)

    # Ordering on the public page; 1 = top, matching Opportunity.ranking so
    # "push to top" behaves identically across all three ad types.
    ranking = Column(Integer, default=100)

    published_at = Column(DateTime(timezone=True))
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("ix_study_papers_page_status", "page_id", "status"),
    )


class StudyPaperDownload(Base):
    """One row per account per paper. PLATFORM-owned — see module docstring.

    The unique constraint is what makes `downloads_count` mean "how many people
    took this" rather than "how many times a button was clicked", so a reader
    re-downloading their own copy does not inflate the institute's numbers.
    """

    __tablename__ = "study_paper_downloads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(
        String, ForeignKey("study_papers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("paper_id", "user_id", name="uq_study_paper_download"),
    )


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class StudyPaperCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    kind: str = "Guess Paper"
    description: Optional[str] = None
    subject: Optional[str] = None
    class_level: Optional[str] = None
    exam: Optional[str] = None
    session: Optional[str] = None
    tags: List[str] = []
    status: str = "Draft"
    visibility: str = AdVisibility.PAGE.value


class StudyPaperUpdate(BaseModel):
    title: Optional[str] = None
    kind: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    class_level: Optional[str] = None
    exam: Optional[str] = None
    session: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    visibility: Optional[str] = None


class StudyPaperResponse(BaseModel):
    """What a page admin and the public both see.

    Deliberately has no downloader field of any kind. Adding one here is what
    would break the client's privacy requirement, so the omission is the
    enforcement point — see the module docstring.
    """

    id: str
    page_id: str
    title: str
    kind: str
    description: Optional[str] = None
    subject: Optional[str] = None
    class_level: Optional[str] = None
    exam: Optional[str] = None
    session: Optional[str] = None
    tags: Optional[List[str]] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    status: str
    visibility: Optional[str] = None
    downloads_count: int = 0
    ranking: Optional[int] = None
    published_at: Optional[Any] = None
    created_at: Optional[Any] = None

    # Whether the caller has already taken this one — lets the UI say
    # "Downloaded" instead of implying a second download will be counted.
    # Always False for an anonymous caller.
    downloaded_by_me: bool = False

    class Config:
        from_attributes = True


class StudyPaperDownloadResponse(BaseModel):
    """Answer to POST /papers/{id}/download — the link plus the new total."""

    paper_id: str
    file_url: str
    file_name: Optional[str] = None
    downloads_count: int
    downloaded_by_me: bool = True
