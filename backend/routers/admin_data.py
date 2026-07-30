"""
Admin-only endpoints to list registered students, mentors and institutes
from the database.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from core.database import get_db
from core.deps import get_current_active_user
from models.user import User
from models.enums import UserRole
from models.student import Student, StudentResponse
from models.mentor import Mentor, MentorResponse
from models.institute import Institute, InstituteResponse
from models.enquiry import Enquiry, EnquiryAdminResponse
from fastapi import HTTPException

router = APIRouter(prefix="/admin", tags=["Admin Data"])


def _require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/students", response_model=List[StudentResponse], summary="List all registered students")
async def list_students(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_require_admin),
):
    result = await db.execute(select(Student).order_by(Student.created_at.desc()))
    return result.scalars().all()


@router.get("/mentors", response_model=List[MentorResponse], summary="List all registered mentors")
async def list_mentors(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_require_admin),
):
    result = await db.execute(select(Mentor).order_by(Mentor.created_at.desc()))
    return result.scalars().all()


@router.get("/institutes", response_model=List[InstituteResponse], summary="List all registered institutes")
async def list_institutes(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_require_admin),
):
    result = await db.execute(select(Institute).order_by(Institute.created_at.desc()))
    return result.scalars().all()


@router.get("/enquiries", response_model=List[EnquiryAdminResponse], summary="List all student enquiries")
async def list_enquiries(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_require_admin),
):
    result = await db.execute(select(Enquiry).order_by(Enquiry.created_at.desc()))
    enquiries = result.scalars().all()

    student_ids = {e.student_id for e in enquiries}
    students = {}
    if student_ids:
        s_result = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        students = {s.id: s.name for s in s_result.scalars().all()}

    responses = []
    for e in enquiries:
        count_result = await db.execute(
            select(func.count()).select_from(Institute).where(Institute.state == e.state)
        )
        responses.append(EnquiryAdminResponse(
            id=e.id,
            student_name=students.get(e.student_id, "Unknown"),
            enquiry_type=e.enquiry_type,
            state=e.state,
            course=e.course,
            created_at=e.created_at,
            matching_institutes=count_result.scalar_one(),
        ))
    return responses
