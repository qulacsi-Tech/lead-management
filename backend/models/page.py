"""
Institute Page — the authoritative entity behind every public institute page
and the whole Institute Admin console.

Relationship to the legacy `institutes` table
---------------------------------------------
`models/institute.py` (`institutes`) is an *account* record: one row per
Institute-role login, created by `/register/institute`. It has no slug, no
media, no multi-admin support, and is 1:1 with a User.

`Page` is different in kind: a Facebook-Page-style entity that any number of
users can administer, that carries the public content, and that is created by
the Main Admin rather than by a self-service signup. The two are kept separate
rather than merged because the product genuinely has both concepts, and the
legacy table holds live data.

Ownership: PLATFORM. Only a Main Admin creates a Page, sets its slug/type, and
assigns its admins. Everything *inside* the page is owned by those admins.
"""

from sqlalchemy import Column, String, Boolean, DateTime, JSON, ForeignKey, UniqueConstraint, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
import uuid

from core.database import Base


class Page(Base):
    __tablename__ = "pages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # --- Identity (PLATFORM-owned: set at creation by Main Admin) ---
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, nullable=False)  # School | Coaching | College | University | Training Institute

    # --- Public content (INSTITUTE-owned: maintained by Page Admins) ---
    tagline = Column(String)
    about = Column(String)
    logo_url = Column(String)
    banners = Column(JSON, default=list)          # [url, ...]
    gallery = Column(JSON, default=list)          # [{ id, url, caption }, ...]
    social_links = Column(JSON, default=dict)     # { facebook, instagram, youtube, linkedin }
    # The "Select & Fill" builder payload: aboutStats, whyChooseUs,
    # keyHighlights, facilities, campusLife, achievements.
    content = Column(JSON, default=dict)

    # --- Contact / location ---
    address = Column(String)
    city = Column(String, index=True)
    state = Column(String, index=True)
    website = Column(String)
    contact = Column(String)
    affiliation = Column(String)

    # --- Lifecycle (PLATFORM-owned) ---
    is_enabled = Column(Boolean, default=True, nullable=False)
    followers_count = Column(String, default="0")  # denormalised display counter

    created_by = Column(String, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    admins = relationship("PageAdmin", back_populates="page", cascade="all, delete-orphan")


class PageAdmin(Base):
    """Who may administer a Page.

    This is the single source of truth for the question "is this authenticated
    user an administrator of this particular page?" — replacing the frontend's
    email-matching against a bundled JS array.

    Deliberately a *relationship*, not a user role: a user's `role` stays
    Professional/Student, and administering a page is something they are
    granted per page. That avoids introducing a second, incompatible RBAC
    system alongside the existing role column.
    """

    __tablename__ = "page_admins"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    page_id = Column(String, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # OWNER has one extra power: an owner cannot be removed by a plain admin.
    role = Column(String, default="ADMIN", nullable=False)  # OWNER | ADMIN
    assigned_by = Column(String, ForeignKey("users.id"))
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    page = relationship("Page", back_populates="admins")

    __table_args__ = (
        UniqueConstraint("page_id", "user_id", name="uq_page_admin"),
        Index("ix_page_admins_user_page", "user_id", "page_id"),
    )


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

INSTITUTE_TYPES = ["School", "Coaching", "College", "University", "Training Institute"]


class PageCreate(BaseModel):
    """Main Admin creates the institute. Only identity + contact fields —
    course/notice/vacancy content is added later by the Institute Admin."""
    name: str = Field(min_length=2, max_length=200)
    type: str
    slug: Optional[str] = None          # auto-derived from name when omitted
    tagline: Optional[str] = None
    about: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    website: Optional[str] = None
    contact: Optional[str] = None
    affiliation: Optional[str] = None
    # Optional first admin, assigned as part of creation.
    admin_email: Optional[EmailStr] = None


class PageUpdate(BaseModel):
    """Partial update. Split by owner:
      - Page Admins may change presentation/contact fields.
      - `type`, `slug` and `is_enabled` are platform-owned and are rejected
        for non-admins by the router, not here."""
    name: Optional[str] = None
    tagline: Optional[str] = None
    about: Optional[str] = None
    logo_url: Optional[str] = None
    banners: Optional[List[str]] = None
    gallery: Optional[List[Dict[str, Any]]] = None
    social_links: Optional[Dict[str, Any]] = None
    content: Optional[Dict[str, Any]] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    website: Optional[str] = None
    contact: Optional[str] = None
    affiliation: Optional[str] = None
    # Platform-only fields:
    type: Optional[str] = None
    slug: Optional[str] = None
    is_enabled: Optional[bool] = None


PLATFORM_ONLY_PAGE_FIELDS = {"type", "slug", "is_enabled"}


class PageAdminResponse(BaseModel):
    id: str
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    role: str
    assigned_at: Optional[Any] = None

    class Config:
        from_attributes = True


class PageResponse(BaseModel):
    id: str
    name: str
    slug: str
    type: str
    tagline: Optional[str] = None
    about: Optional[str] = None
    logo_url: Optional[str] = None
    banners: Optional[List[str]] = None
    gallery: Optional[List[Dict[str, Any]]] = None
    social_links: Optional[Dict[str, Any]] = None
    content: Optional[Dict[str, Any]] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    website: Optional[str] = None
    contact: Optional[str] = None
    affiliation: Optional[str] = None
    is_enabled: bool = True
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True


class PageDetailResponse(PageResponse):
    """Adds the caller's own relationship to the page, so the frontend never
    has to work out permissions for itself."""
    admins: List[PageAdminResponse] = []
    is_page_admin: bool = False
    is_following: bool = False
    followers_count: int = 0


class AssignAdminRequest(BaseModel):
    email: EmailStr
    role: str = "ADMIN"  # OWNER | ADMIN
