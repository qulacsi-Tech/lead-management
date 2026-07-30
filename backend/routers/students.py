from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from core.database import get_db
from core.deps import require_roles
from models.user import User
from models.enums import UserRole
from models.student import Student, StudentResponse
from models.mentor import Mentor, MentorPublicResponse
from models.follow import MentorFollow
from routers.mentors_public import _get_student_profile

router = APIRouter(prefix="/students", tags=["Students"])

require_student = require_roles(UserRole.STUDENT)


@router.get("/me", response_model=StudentResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return await _get_student_profile(db, current_user)


@router.get("/me/following", response_model=list[MentorPublicResponse])
async def list_my_following(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    student = await _get_student_profile(db, current_user)

    result = await db.execute(
        select(Mentor)
        .join(MentorFollow, MentorFollow.mentor_id == Mentor.id)
        .where(MentorFollow.student_id == student.id)
        .order_by(MentorFollow.created_at.desc())
    )
    mentors = result.scalars().all()

    followers_counts = {}
    if mentors:
        c_result = await db.execute(
            select(MentorFollow.mentor_id, func.count())
            .where(MentorFollow.mentor_id.in_([m.id for m in mentors]))
            .group_by(MentorFollow.mentor_id)
        )
        followers_counts = dict(c_result.all())

    return [
        MentorPublicResponse(
            id=m.id,
            name=m.name,
            domain=m.domain,
            company=m.company,
            title=m.title,
            location=m.location,
            about=m.about,
            status=m.status,
            subjects=m.subjects,
            highlights=m.highlights,
            followers_count=followers_counts.get(m.id, 0),
            is_following=True,
            created_at=m.created_at,
        )
        for m in mentors
    ]
