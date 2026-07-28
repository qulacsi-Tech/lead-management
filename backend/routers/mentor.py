from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, distinct

from core.database import get_db
from core.deps import require_roles
from models.user import User
from models.enums import UserRole
from models.mentor import Mentor, MentorResponse, MentorProfileUpdate, MentorStats
from models.paper import Paper, Question, PaperAttempt
from models.opportunity import JobPosting

router = APIRouter(prefix="/mentor", tags=["Mentor"])

require_mentor = require_roles(UserRole.MENTOR)


async def _get_mentor_or_404(db: AsyncSession, user: User) -> Mentor:
    result = await db.execute(select(Mentor).where(Mentor.user_id == user.id))
    mentor = result.scalars().first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor profile not found")
    return mentor


@router.get("/me", response_model=MentorResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mentor),
):
    return await _get_mentor_or_404(db, current_user)


@router.put("/me", response_model=MentorResponse)
async def update_my_profile(
    payload: MentorProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mentor),
):
    mentor = await _get_mentor_or_404(db, current_user)
    updates = payload.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(mentor, field, value)
    await db.commit()
    await db.refresh(mentor)
    return mentor


@router.get("/me/stats", response_model=MentorStats)
async def get_my_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mentor),
):
    mentor = await _get_mentor_or_404(db, current_user)

    papers_result = await db.execute(select(Paper).where(Paper.mentor_id == mentor.id))
    papers = papers_result.scalars().all()
    paper_ids = [p.id for p in papers]

    total_questions = 0
    if paper_ids:
        q_result = await db.execute(
            select(func.count()).select_from(Question).where(Question.paper_id.in_(paper_ids))
        )
        total_questions = q_result.scalar_one()

    distinct_students = 0
    if paper_ids:
        s_result = await db.execute(
            select(func.count(distinct(PaperAttempt.student_id))).where(PaperAttempt.paper_id.in_(paper_ids))
        )
        distinct_students = s_result.scalar_one()

    opportunities_result = await db.execute(select(JobPosting).where(JobPosting.mentor_id == mentor.id))
    opportunities = opportunities_result.scalars().all()

    return MentorStats(
        total_papers=len(papers),
        published_papers=sum(1 for p in papers if p.status == "published"),
        draft_papers=sum(1 for p in papers if p.status == "draft"),
        total_questions=total_questions,
        total_attempts=sum(p.downloads or 0 for p in papers),
        total_likes=sum(p.likes or 0 for p in papers),
        distinct_students_reached=distinct_students,
        total_opportunities=len(opportunities),
        open_opportunities=sum(1 for o in opportunities if o.status == "Active"),
    )
