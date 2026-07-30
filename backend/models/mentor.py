from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from typing import Optional, Any, List
from datetime import datetime
from core.database import Base
import uuid


# --- SQLAlchemy Model ---
class Mentor(Base):
    __tablename__ = "mentors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    phone = Column(String)
    domain = Column(String)
    company = Column(String)
    experience_level = Column(String)
    title = Column(String)
    location = Column(String)
    about = Column(String)
    status = Column(String, default="Available for Private Tuition")
    subjects = Column(JSON, default=list)  # list[str]
    classes_taught = Column(JSON, default=list)  # list[{title, meta}]
    highlights = Column(JSON, default=list)  # list[{title, org_period, description}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- Pydantic Schemas ---
class MentorCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    domain: Optional[str] = None
    company: Optional[str] = None
    experience_level: Optional[str] = None


class ClassTaught(BaseModel):
    title: str
    meta: Optional[str] = None


class CareerHighlight(BaseModel):
    title: str
    org_period: Optional[str] = None
    description: Optional[str] = None


class MentorResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    domain: Optional[str] = None
    company: Optional[str] = None
    experience_level: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    about: Optional[str] = None
    status: Optional[str] = None
    subjects: Optional[List[str]] = None
    classes_taught: Optional[List[ClassTaught]] = None
    highlights: Optional[List[CareerHighlight]] = None
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True


class MentorProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    domain: Optional[str] = None
    company: Optional[str] = None
    experience_level: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    about: Optional[str] = None
    status: Optional[str] = None
    subjects: Optional[List[str]] = None
    classes_taught: Optional[List[ClassTaught]] = None
    highlights: Optional[List[CareerHighlight]] = None


class MentorPublicResponse(BaseModel):
    id: str
    name: str
    domain: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    about: Optional[str] = None
    status: Optional[str] = None
    subjects: Optional[List[str]] = None
    highlights: Optional[List[CareerHighlight]] = None
    followers_count: int = 0
    is_following: bool = False
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True


class MentorStats(BaseModel):
    total_papers: int
    published_papers: int
    draft_papers: int
    total_questions: int
    total_attempts: int
    total_likes: int
    distinct_students_reached: int
    total_opportunities: int
    open_opportunities: int
