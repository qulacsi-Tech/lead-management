from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from core.database import Base
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from models.enums import UserRole
import uuid

# --- SQLAlchemy Model ---
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.AGENT)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # --- Profile fields (Professional Profile screen) ---
    headline = Column(String)
    about = Column(String)
    category = Column(String)
    # education: { tenth_year, twelfth_year, graduation: {college, course, year} | null,
    #              post_graduation: {college, course, year} | null }
    education = Column(JSON)
    # work_experience: [{ id, company, designation, joining_date, leaving_date,
    #                      location, industry, is_current }, ...] — a career
    # doesn't have to be education-sector-only, see
    # docs/CLIENT_FEEDBACK_2026-08-12.md Section 2.
    work_experience = Column(JSON)
    subjects = Column(JSON)
    skills = Column(JSON)
    profile_photo_url = Column(String)
    cover_photo_url = Column(String)
    resume_url = Column(String)

# --- Pydantic Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.AGENT

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class ProfileUpdate(BaseModel):
    """Partial update for the Professional Profile screen — every field is
    optional so the frontend can PATCH just what changed."""
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    headline: Optional[str] = None
    about: Optional[str] = None
    category: Optional[str] = None
    education: Optional[Dict[str, Any]] = None
    work_experience: Optional[List[Dict[str, Any]]] = None
    subjects: Optional[List[str]] = None
    skills: Optional[List[str]] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    headline: Optional[str] = None
    about: Optional[str] = None
    category: Optional[str] = None
    education: Optional[Dict[str, Any]] = None
    work_experience: Optional[List[Dict[str, Any]]] = None
    subjects: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    profile_photo_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    resume_url: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
