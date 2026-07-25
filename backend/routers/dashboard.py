from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from core.database import get_db
from core.deps import get_current_active_user
from models.user import User
from models.lead import Lead
from models.task import LeadTask
from models.enums import UserRole, LeadStatus, TaskStatus

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    is_agent = current_user.role == UserRole.AGENT

    status_query = select(Lead.status, func.count(Lead.id))
    source_query = select(Lead.source, func.count(Lead.id))
    pending_tasks_query = select(func.count(LeadTask.id)).where(LeadTask.status == TaskStatus.PENDING)

    if is_agent:
        status_query = status_query.where(Lead.assigned_to == current_user.id)
        source_query = source_query.where(Lead.assigned_to == current_user.id)
        pending_tasks_query = pending_tasks_query.where(LeadTask.assigned_to == current_user.id)

    status_result = await db.execute(status_query.group_by(Lead.status))
    by_status = {s.value: 0 for s in LeadStatus}
    for status, count in status_result.all():
        by_status[status] = count
    total_leads = sum(by_status.values())

    source_result = await db.execute(source_query.group_by(Lead.source))
    by_source = dict(source_result.all())

    pending_tasks_result = await db.execute(pending_tasks_query)
    pending_tasks = pending_tasks_result.scalar_one()

    converted = by_status.get(LeadStatus.CONVERTED.value, 0)
    conversion_rate = round((converted / total_leads) * 100, 2) if total_leads else 0.0

    return {
        "total_leads": total_leads,
        "by_status": by_status,
        "by_source": by_source,
        "conversion_rate": conversion_rate,
        "pending_tasks": pending_tasks,
    }
