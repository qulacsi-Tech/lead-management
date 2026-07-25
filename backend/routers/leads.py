from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_
from datetime import datetime, timezone

from core.database import get_db
from core.deps import get_current_active_user, require_roles
from models.user import User
from models.lead import Lead, LeadCreate, LeadUpdate, LeadAssign, LeadResponse, LeadListResponse
from models.activity import LeadActivity
from models.enums import UserRole, LeadStatus, ActivityType

router = APIRouter(prefix="/leads", tags=["Leads"])

require_admin_or_manager = require_roles(UserRole.ADMIN, UserRole.MANAGER)


async def _get_lead_or_404(db: AsyncSession, lead_id: str) -> Lead:
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


def _authorize_lead_access(lead: Lead, current_user: User):
    """Agents may only view/edit leads assigned to them; Admin/Manager see everything."""
    if current_user.role == UserRole.AGENT and lead.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")


@router.get("", response_model=LeadListResponse)
async def list_leads(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    status: Optional[LeadStatus] = None,
    source: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = Query(None, description="Search by parent/student name, phone or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    query = select(Lead)

    # Agents only ever see their own leads
    if current_user.role == UserRole.AGENT:
        query = query.where(Lead.assigned_to == current_user.id)
    elif assigned_to:
        query = query.where(Lead.assigned_to == assigned_to)

    if status:
        query = query.where(Lead.status == status)
    if source:
        query = query.where(Lead.source == source)
    if search:
        like = f"%{search}%"
        query = query.where(
            or_(
                Lead.parent_name.ilike(like),
                Lead.student_name.ilike(like),
                Lead.phone.ilike(like),
                Lead.email.ilike(like),
            )
        )

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.order_by(Lead.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return LeadListResponse(total=total, page=page, page_size=page_size, items=items)


@router.post("", response_model=LeadResponse, status_code=201)
async def create_lead(
    payload: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    lead = Lead(**payload.model_dump(), created_by=current_user.id)
    db.add(lead)
    await db.commit()
    await db.refresh(lead)

    db.add(LeadActivity(
        lead_id=lead.id,
        user_id=current_user.id,
        activity_type=ActivityType.NOTE,
        description=f"Lead created (source: {lead.source})",
    ))
    await db.commit()
    return lead


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    lead = await _get_lead_or_404(db, lead_id)
    _authorize_lead_access(lead, current_user)
    return lead


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    lead = await _get_lead_or_404(db, lead_id)
    _authorize_lead_access(lead, current_user)

    updates = payload.model_dump(exclude_none=True)
    old_status = lead.status
    for field, value in updates.items():
        setattr(lead, field, value)
    await db.commit()
    await db.refresh(lead)

    if "status" in updates and updates["status"] != old_status:
        db.add(LeadActivity(
            lead_id=lead.id,
            user_id=current_user.id,
            activity_type=ActivityType.STATUS_CHANGE,
            description=f"Status changed from {old_status} to {updates['status']}",
        ))
        await db.commit()

    return lead


@router.post("/{lead_id}/assign", response_model=LeadResponse)
async def assign_lead(
    lead_id: str,
    payload: LeadAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    lead = await _get_lead_or_404(db, lead_id)

    result = await db.execute(select(User).where(User.id == payload.assigned_to))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Assignee not found")

    lead.assigned_to = payload.assigned_to
    await db.commit()
    await db.refresh(lead)

    db.add(LeadActivity(
        lead_id=lead.id,
        user_id=current_user.id,
        activity_type=ActivityType.NOTE,
        description=f"Lead assigned to {agent.name}",
    ))
    await db.commit()
    return lead


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin_or_manager),
):
    lead = await _get_lead_or_404(db, lead_id)
    await db.delete(lead)
    await db.commit()
