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


class OrganizationProfileUpdate(BaseModel):
    """Organisation details a user maintains for their own account.

    These are the SAME fields Admin -> Institute Pages collects when it creates
    an institute (models/page.py PageCreate), minus the four that cannot apply
    here: the slug is derived, the logo and banner belong in the page editor,
    and there is no `admin_email` because the user filling this in *is* the
    admin. Saving writes a real Page — see routers/profile.py.

    `district`, `block` and `programs` were dropped with the rewrite: the Page
    model has no district/block (address + state + city carry the location),
    and courses are rows on the page, managed in the Institute Console rather
    than typed as a comma-separated string here.

    Every field is optional so the form can save incrementally, except that a
    `type` is required before the page can first be created — the router
    enforces that, since it also decides the public URL.
    """
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    type: Optional[str] = None
    tagline: Optional[str] = None
    contact: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    website: Optional[str] = None
    affiliation: Optional[str] = None
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
