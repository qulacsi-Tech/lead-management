from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from core.database import Base
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.enums import ActivityType
import uuid

# --- SQLAlchemy Model ---
class LeadActivity(Base):
    """Timeline entry for a lead: calls, emails, notes, status changes."""
    __tablename__ = "lead_activities"

    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id      = Column(String, ForeignKey("leads.id"), nullable=False, index=True)
    user_id      = Column(String, ForeignKey("users.id"), nullable=True)
    activity_type = Column(String, default=ActivityType.NOTE)
    description  = Column(Text, nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

# --- Pydantic Schemas ---
class LeadActivityCreate(BaseModel):
    activity_type: ActivityType = ActivityType.NOTE
    description: str

class LeadActivityResponse(BaseModel):
    id: str
    lead_id: str
    user_id: Optional[str]
    activity_type: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True
