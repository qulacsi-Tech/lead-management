from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from datetime import datetime
from core.database import Base
import uuid


# --- SQLAlchemy Model ---
class Institute(Base):
    __tablename__ = "institutes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    phone = Column(String)
    state = Column(String)
    district = Column(String)
    block = Column(String)
    city = Column(String)
    programs = Column(String)
    website = Column(String)
    about = Column(String)
    credits = Column(Integer, default=1240)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- Pydantic Schemas ---
class InstituteCreate(BaseModel):
    name: str
    email: EmailStr
    # The sign-in password for the institute's own admin account. The Main
    # Admin chooses it when provisioning and hands it over.
    password: str = Field(min_length=8)
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    block: Optional[str] = None
    city: Optional[str] = None
    programs: Optional[str] = None
    website: Optional[str] = None


class InstituteResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    block: Optional[str] = None
    city: Optional[str] = None
    programs: Optional[str] = None
    website: Optional[str] = None
    about: Optional[str] = None
    credits: Optional[int] = None
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True


class InstituteProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    programs: Optional[str] = None
    website: Optional[str] = None
    about: Optional[str] = None


class AdminInstituteUpdate(BaseModel):
    """What a Main Admin may change about an institute account.

    Wider than `InstituteProfileUpdate` because it reaches the *credentials* an
    institute signs in with: `email` is the login id, and `password` resets it
    outright. Both live on the linked `users` row, so the endpoint has to keep
    the two tables in step — see routers/admin_data.py.

    Every field is optional; only what is sent gets written.
    """
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    block: Optional[str] = None
    city: Optional[str] = None
    programs: Optional[str] = None
    website: Optional[str] = None
    about: Optional[str] = None
    # Omit to leave the current password alone; an empty string is rejected
    # rather than silently treated as "no change".
    password: Optional[str] = Field(default=None, min_length=8)
