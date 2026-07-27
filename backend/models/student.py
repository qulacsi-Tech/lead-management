from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from typing import Optional
from core.database import Base
import uuid


# --- SQLAlchemy Model ---
class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    phone = Column(String)
    city = Column(String)
    target_course = Column(String)
    current_school = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- Pydantic Schemas ---
class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    city: Optional[str] = None
    target_course: Optional[str] = None
    current_school: Optional[str] = None


class StudentResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    target_course: Optional[str] = None
    current_school: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
