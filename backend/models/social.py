"""
USER-owned relationship and messaging entities: Follow and Notification.

Note on `mentor_follows`: an orphaned `mentor_follows` table survives in the
database from the deleted mentor feature. It models student -> mentor, whereas
the current product needs user -> page. Different target entity, different
semantics; a new `follows` table is created rather than overloading it.
"""

from sqlalchemy import Column, String, Boolean, DateTime, JSON, ForeignKey, UniqueConstraint, Index
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, Any, Dict
import uuid

from core.database import Base


class Follow(Base):
    """A user follows a Page. The follower is always taken from the
    authenticated session — never from the request body — so a user cannot
    create follow records on someone else's behalf."""

    __tablename__ = "follows"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    page_id = Column(String, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "page_id", name="uq_follow_user_page"),
        Index("ix_follows_page_user", "page_id", "user_id"),
    )


class OpportunityLike(Base):
    """A user likes a published admission notice or job vacancy.

    Same rule as Follow: the liker is taken from the authenticated session and
    never from the request body, so nobody can like on someone else's behalf.
    The unique constraint makes a double-tap idempotent at the database level
    rather than relying on the client to keep count.
    """

    __tablename__ = "opportunity_likes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    opportunity_id = Column(
        String, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "opportunity_id", name="uq_like_user_opportunity"),
        Index("ix_opportunity_likes_opp_user", "opportunity_id", "user_id"),
    )


NOTIFICATION_TYPES = [
    "opportunity_match",   # a Sell Lead matched the user's desired criteria
    "page_opportunity",    # a page the user follows published something
    "enquiry_received",    # someone enquired on a page you administer
    "profile_unlocked",    # an institute unlocked your profile
    "page_admin_assigned", # you were made an admin of a page
    "system",
]


class Notification(Base):
    """Persistence foundation only — delivery (push/email/websocket) is out of
    scope for Phase 2. Rows are written by the services that cause them and
    read back by the recipient."""

    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String)

    # Loose reference to whatever caused this, e.g. ("opportunity", "<id>").
    # Deliberately not a FK: notifications outlive the entities they mention.
    ref_type = Column(String)
    ref_id = Column(String)
    payload = Column(JSON, default=dict)

    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (Index("ix_notifications_user_read", "user_id", "is_read"),)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class FollowResponse(BaseModel):
    page_id: str
    is_following: bool
    followers_count: int


class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    message: Optional[str] = None
    ref_type: Optional[str] = None
    ref_id: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: Optional[str] = None
    ref_type: Optional[str] = None
    ref_id: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True


class LikeResponse(BaseModel):
    """What the client needs to render the button after a toggle: whether this
    user likes it now, and the new total."""
    opportunity_id: str
    liked: bool
    likes_count: int
