from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.database import get_db
from core.deps import get_current_active_user
from models.user import User
from models.lead import Lead
from models.activity import LeadActivity, LeadActivityCreate, LeadActivityResponse
from models.enums import UserRole

router = APIRouter(prefix="/leads/{lead_id}/activities", tags=["Lead Activities"])


async def _get_lead_with_access(db: AsyncSession, lead_id: str, current_user: User) -> Lead:
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role == UserRole.AGENT and lead.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return lead


@router.get("", response_model=list[LeadActivityResponse])
async def list_activities(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await _get_lead_with_access(db, lead_id, current_user)
    result = await db.execute(
        select(LeadActivity).where(LeadActivity.lead_id == lead_id).order_by(LeadActivity.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=LeadActivityResponse, status_code=201)
async def create_activity(
    lead_id: str,
    payload: LeadActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await _get_lead_with_access(db, lead_id, current_user)
    activity = LeadActivity(
        lead_id=lead_id,
        user_id=current_user.id,
        activity_type=payload.activity_type,
        description=payload.description,
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity
