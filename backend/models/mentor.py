from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from typing import Optional
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


class MentorResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    domain: Optional[str] = None
    company: Optional[str] = None
    experience_level: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
