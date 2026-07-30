from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
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
    credits = Column(Integer, default=1240)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- Pydantic Schemas ---
class InstituteCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
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
    credits: Optional[int] = None
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True
