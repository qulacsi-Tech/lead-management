"""
Member posts — what a student, mentor or professional shares on the feed.

Client request, 26 Sep 2026: posting was only possible through an institute's
Admission Notice / Job Vacancy screens, so a normal member who clicked "Start a
post" landed on "You don't administer an Institute Page yet". The ask was to
"make it enable for everyone like student and mentor can post; institute
persons can reply".

So a Post belongs to a USER, not to a page — anyone signed in may write one.
Replies are PostComments. A comment is always written by a user, but a page
admin may reply *as their institute* (`as_page_id`): the reply then shows the
institute's name and logo, which is how an institute answers "Looking for JEE
coaching in Bhopal" in its own voice. That is checked against page_admins
membership in the router, never taken on trust from the client.

`kind` is what the author is doing, so the feed can label it:
    update       — sharing news or an achievement
    question     — asking the community something
    requirement  — "looking for" a course, coaching, tutor or job

Admission notices and vacancies stay Opportunities; a post never generates a
lead or appears on an institute page.
"""

from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.sql import func

from core.database import Base

POST_KINDS = ["update", "question", "requirement"]
POST_MAX_LENGTH = 3000
COMMENT_MAX_LENGTH = 1500


class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    author_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String, nullable=False, default="update")
    body = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PostComment(Base):
    __tablename__ = "post_comments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # Set when a page admin replies on behalf of their institute.
    as_page_id = Column(String, ForeignKey("pages.id", ondelete="SET NULL"), nullable=True)
    body = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (Index("ix_post_comments_post_created", "post_id", "created_at"),)


class PostLike(Base):
    """Same rule as OpportunityLike: the liker comes from the session, and the
    unique constraint makes a double-tap idempotent."""

    __tablename__ = "post_likes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_like_user"),)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PostCreate(BaseModel):
    kind: str = "update"
    body: str = Field(min_length=1, max_length=POST_MAX_LENGTH)


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=COMMENT_MAX_LENGTH)
    # Reply as this institute. The caller must be on its admin team.
    as_page_id: Optional[str] = None


class PostAuthor(BaseModel):
    """The public face of a member — nothing that is not already on their
    profile card (no email, no phone)."""
    id: str
    name: str
    role: Optional[str] = None
    headline: Optional[str] = None
    profile_photo_url: Optional[str] = None


class CommentPage(BaseModel):
    id: str
    name: str
    type: Optional[str] = None
    logo_url: Optional[str] = None
    public_path: str


class CommentResponse(BaseModel):
    id: str
    post_id: str
    body: str
    created_at: Optional[datetime] = None
    author: PostAuthor
    page: Optional[CommentPage] = None
    can_delete: bool = False


class PostResponse(BaseModel):
    id: str
    kind: str
    body: str
    created_at: Optional[datetime] = None
    author: PostAuthor
    likes_count: int = 0
    liked_by_me: bool = False
    comments_count: int = 0
    can_delete: bool = False


class PostLikeResponse(BaseModel):
    post_id: str
    liked: bool
    likes_count: int
