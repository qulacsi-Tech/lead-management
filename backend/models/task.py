from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from core.database import Base
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.enums import TaskStatus, TaskPriority
import uuid

# --- SQLAlchemy Model ---
class LeadTask(Base):
    """A follow-up task/reminder tied to a lead."""
    __tablename__ = "lead_tasks"

    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id      = Column(String, ForeignKey("leads.id"), nullable=False, index=True)
    assigned_to  = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    created_by   = Column(String, ForeignKey("users.id"), nullable=True)
    title        = Column(String, nullable=False)
    description  = Column(Text)
    priority     = Column(String, default=TaskPriority.MEDIUM)
    status       = Column(String, default=TaskStatus.PENDING, index=True)
    due_date     = Column(DateTime(timezone=True))
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

# --- Pydantic Schemas ---
class LeadTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None

class LeadTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None

class LeadTaskResponse(BaseModel):
    id: str
    lead_id: str
    assigned_to: Optional[str]
    created_by: Optional[str]
    title: str
    description: Optional[str]
    priority: str
    status: str
    due_date: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
