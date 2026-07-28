from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.database import get_db
from core.deps import require_roles
from models.user import User
from models.enums import UserRole
from models.mentor import Mentor
from models.opportunity import JobPosting, JobPostingCreate, JobPostingUpdate, JobPostingResponse

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])

require_mentor = require_roles(UserRole.MENTOR)


async def _get_mentor_profile(db: AsyncSession, user: User) -> Mentor:
    result = await db.execute(select(Mentor).where(Mentor.user_id == user.id))
    mentor = result.scalars().first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor profile not found")
    return mentor


async def _get_posting_or_404(db: AsyncSession, posting_id: str) -> JobPosting:
    result = await db.execute(select(JobPosting).where(JobPosting.id == posting_id))
    posting = result.scalars().first()
    if not posting:
        raise HTTPException(status_code=404, detail="Job posting not found")
    return posting


@router.get("/mine", response_model=list[JobPostingResponse])
async def list_my_opportunities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mentor),
):
    mentor = await _get_mentor_profile(db, current_user)
    result = await db.execute(
        select(JobPosting).where(JobPosting.mentor_id == mentor.id).order_by(JobPosting.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=JobPostingResponse, status_code=201)
async def create_opportunity(
    payload: JobPostingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mentor),
):
    mentor = await _get_mentor_profile(db, current_user)
    posting = JobPosting(mentor_id=mentor.id, **payload.model_dump())
    db.add(posting)
    await db.commit()
    await db.refresh(posting)
    return posting


@router.put("/{posting_id}", response_model=JobPostingResponse)
async def update_opportunity(
    posting_id: str,
    payload: JobPostingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mentor),
):
    mentor = await _get_mentor_profile(db, current_user)
    posting = await _get_posting_or_404(db, posting_id)
    if posting.mentor_id != mentor.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    updates = payload.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(posting, field, value)
    await db.commit()
    await db.refresh(posting)
    return posting


@router.delete("/{posting_id}", status_code=204)
async def delete_opportunity(
    posting_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mentor),
):
    mentor = await _get_mentor_profile(db, current_user)
    posting = await _get_posting_or_404(db, posting_id)
    if posting.mentor_id != mentor.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    await db.delete(posting)
    await db.commit()
