from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from core.database import get_db
from core.deps import get_current_active_user, require_roles
from models.user import User
from models.enums import UserRole
from models.student import Student
from models.mentor import Mentor, MentorPublicResponse
from models.follow import MentorFollow

router = APIRouter(prefix="/mentors", tags=["Mentors (Public)"])

require_student = require_roles(UserRole.STUDENT)


async def _get_student_profile(db: AsyncSession, user: User) -> Student:
    result = await db.execute(select(Student).where(Student.user_id == user.id))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


async def _get_mentor_or_404(db: AsyncSession, mentor_id: str) -> Mentor:
    result = await db.execute(select(Mentor).where(Mentor.id == mentor_id))
    mentor = result.scalars().first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return mentor


async def _followers_count(db: AsyncSession, mentor_id: str) -> int:
    result = await db.execute(
        select(func.count()).select_from(MentorFollow).where(MentorFollow.mentor_id == mentor_id)
    )
    return result.scalar_one()


async def _current_student_following_ids(db: AsyncSession, current_user: User) -> set:
    if current_user.role != UserRole.STUDENT:
        return set()
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalars().first()
    if not student:
        return set()
    f_result = await db.execute(select(MentorFollow.mentor_id).where(MentorFollow.student_id == student.id))
    return {row[0] for row in f_result.all()}


def _to_public_response(mentor: Mentor, followers_count: int, is_following: bool) -> MentorPublicResponse:
    return MentorPublicResponse(
        id=mentor.id,
        name=mentor.name,
        domain=mentor.domain,
        company=mentor.company,
        title=mentor.title,
        location=mentor.location,
        about=mentor.about,
        status=mentor.status,
        subjects=mentor.subjects,
        highlights=mentor.highlights,
        followers_count=followers_count,
        is_following=is_following,
        created_at=mentor.created_at,
    )


@router.get("", response_model=list[MentorPublicResponse])
async def list_mentors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    domain: Optional[str] = None,
    search: Optional[str] = Query(None),
):
    query = select(Mentor)
    if domain:
        query = query.where(Mentor.domain == domain)
    if search:
        query = query.where(Mentor.name.ilike(f"%{search}%"))
    query = query.order_by(Mentor.created_at.desc())

    result = await db.execute(query)
    mentors = result.scalars().all()

    following_ids = await _current_student_following_ids(db, current_user)

    return [
        _to_public_response(m, await _followers_count(db, m.id), m.id in following_ids)
        for m in mentors
    ]


@router.get("/{mentor_id}", response_model=MentorPublicResponse)
async def get_mentor(
    mentor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    mentor = await _get_mentor_or_404(db, mentor_id)
    following_ids = await _current_student_following_ids(db, current_user)
    return _to_public_response(mentor, await _followers_count(db, mentor.id), mentor.id in following_ids)


@router.post("/{mentor_id}/follow", response_model=MentorPublicResponse, status_code=201)
async def follow_mentor(
    mentor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    mentor = await _get_mentor_or_404(db, mentor_id)
    student = await _get_student_profile(db, current_user)

    result = await db.execute(
        select(MentorFollow).where(
            MentorFollow.student_id == student.id, MentorFollow.mentor_id == mentor.id
        )
    )
    existing = result.scalars().first()
    if not existing:
        db.add(MentorFollow(student_id=student.id, mentor_id=mentor.id))
        await db.commit()

    return _to_public_response(mentor, await _followers_count(db, mentor.id), True)


@router.delete("/{mentor_id}/follow", status_code=204)
async def unfollow_mentor(
    mentor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    student = await _get_student_profile(db, current_user)
    result = await db.execute(
        select(MentorFollow).where(
            MentorFollow.student_id == student.id, MentorFollow.mentor_id == mentor_id
        )
    )
    existing = result.scalars().first()
    if existing:
        await db.delete(existing)
        await db.commit()
