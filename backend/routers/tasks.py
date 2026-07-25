from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.database import get_db
from core.deps import get_current_active_user
from models.user import User
from models.lead import Lead
from models.task import LeadTask, LeadTaskCreate, LeadTaskUpdate, LeadTaskResponse
from models.enums import UserRole, TaskStatus

lead_tasks_router = APIRouter(prefix="/leads/{lead_id}/tasks", tags=["Lead Tasks"])
tasks_router = APIRouter(prefix="/tasks", tags=["Lead Tasks"])


async def _get_lead_with_access(db: AsyncSession, lead_id: str, current_user: User) -> Lead:
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role == UserRole.AGENT and lead.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return lead


async def _get_task_with_access(db: AsyncSession, task_id: str, current_user: User) -> LeadTask:
    result = await db.execute(select(LeadTask).where(LeadTask.id == task_id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if current_user.role == UserRole.AGENT and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return task


@lead_tasks_router.get("", response_model=list[LeadTaskResponse])
async def list_lead_tasks(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await _get_lead_with_access(db, lead_id, current_user)
    result = await db.execute(
        select(LeadTask).where(LeadTask.lead_id == lead_id).order_by(LeadTask.due_date.asc().nulls_last())
    )
    return result.scalars().all()


@lead_tasks_router.post("", response_model=LeadTaskResponse, status_code=201)
async def create_lead_task(
    lead_id: str,
    payload: LeadTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await _get_lead_with_access(db, lead_id, current_user)
    task = LeadTask(
        lead_id=lead_id,
        created_by=current_user.id,
        assigned_to=payload.assigned_to or current_user.id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        due_date=payload.due_date,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@tasks_router.get("/me", response_model=list[LeadTaskResponse])
async def list_my_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    status: Optional[TaskStatus] = None,
):
    query = select(LeadTask).where(LeadTask.assigned_to == current_user.id)
    if status:
        query = query.where(LeadTask.status == status)
    query = query.order_by(LeadTask.due_date.asc().nulls_last())
    result = await db.execute(query)
    return result.scalars().all()


@tasks_router.put("/{task_id}", response_model=LeadTaskResponse)
async def update_task(
    task_id: str,
    payload: LeadTaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    task = await _get_task_with_access(db, task_id, current_user)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


@tasks_router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    task = await _get_task_with_access(db, task_id, current_user)
    await db.delete(task)
    await db.commit()
