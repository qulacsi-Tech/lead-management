from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.database import get_db
from core.deps import require_roles
from models.user import User
from models.enums import UserRole
from models.student import Student
from models.institute import Institute
from models.enquiry import (
    Enquiry, EnquiryUnlock,
    EnquiryCreate, EnquiryResponse, EnquiryInstituteResponse,
)
from routers.mentors_public import _get_student_profile
from routers.institute import _get_institute_or_404

router = APIRouter(prefix="/enquiries", tags=["Enquiries"])

require_student = require_roles(UserRole.STUDENT)
require_institute = require_roles(UserRole.INSTITUTE)

UNLOCK_COST = 10


async def _get_enquiry_or_404(db: AsyncSession, enquiry_id: str) -> Enquiry:
    result = await db.execute(select(Enquiry).where(Enquiry.id == enquiry_id))
    enquiry = result.scalars().first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return enquiry


async def _to_institute_response(
    db: AsyncSession, enquiry: Enquiry, institute: Institute, is_unlocked: bool
) -> EnquiryInstituteResponse:
    student_name = student_phone = student_email = None
    if is_unlocked:
        s_result = await db.execute(select(Student).where(Student.id == enquiry.student_id))
        student = s_result.scalars().first()
        if student:
            student_name = student.name
            student_phone = student.phone
            student_email = student.email

    return EnquiryInstituteResponse(
        id=enquiry.id,
        enquiry_type=enquiry.enquiry_type,
        state=enquiry.state,
        course=enquiry.course,
        created_at=enquiry.created_at,
        is_hot=(institute.state is not None and enquiry.state == institute.state),
        is_unlocked=is_unlocked,
        unlock_cost=UNLOCK_COST,
        student_name=student_name,
        student_phone=student_phone,
        student_email=student_email,
    )


@router.post("", response_model=EnquiryResponse, status_code=201)
async def create_enquiry(
    payload: EnquiryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    student = await _get_student_profile(db, current_user)
    enquiry = Enquiry(
        student_id=student.id,
        enquiry_type=payload.enquiry_type,
        state=payload.state,
        course=payload.course,
    )
    db.add(enquiry)
    await db.commit()
    await db.refresh(enquiry)
    return enquiry


@router.get("/me", response_model=list[EnquiryResponse])
async def list_my_enquiries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    student = await _get_student_profile(db, current_user)
    result = await db.execute(
        select(Enquiry).where(Enquiry.student_id == student.id).order_by(Enquiry.created_at.desc())
    )
    return result.scalars().all()


@router.get("", response_model=list[EnquiryInstituteResponse])
async def list_enquiries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_institute),
):
    institute = await _get_institute_or_404(db, current_user)

    unlocked_result = await db.execute(
        select(EnquiryUnlock.enquiry_id).where(EnquiryUnlock.institute_id == institute.id)
    )
    unlocked_ids = {row[0] for row in unlocked_result.all()}

    query = select(Enquiry).order_by(Enquiry.created_at.desc())
    if unlocked_ids:
        query = query.where(Enquiry.id.notin_(unlocked_ids))
    result = await db.execute(query)
    enquiries = result.scalars().all()

    responses = [await _to_institute_response(db, e, institute, False) for e in enquiries]
    responses.sort(key=lambda r: r.is_hot, reverse=True)
    return responses


@router.post("/{enquiry_id}/unlock", response_model=EnquiryInstituteResponse, status_code=201)
async def unlock_enquiry(
    enquiry_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_institute),
):
    institute = await _get_institute_or_404(db, current_user)
    enquiry = await _get_enquiry_or_404(db, enquiry_id)

    result = await db.execute(
        select(EnquiryUnlock).where(
            EnquiryUnlock.institute_id == institute.id, EnquiryUnlock.enquiry_id == enquiry.id
        )
    )
    existing = result.scalars().first()

    if not existing:
        if (institute.credits or 0) < UNLOCK_COST:
            raise HTTPException(status_code=400, detail="Not enough credits to unlock this enquiry")
        institute.credits = (institute.credits or 0) - UNLOCK_COST
        db.add(EnquiryUnlock(institute_id=institute.id, enquiry_id=enquiry.id))
        await db.commit()

    return await _to_institute_response(db, enquiry, institute, True)


@router.get("/unlocked", response_model=list[EnquiryInstituteResponse])
async def list_unlocked_enquiries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_institute),
):
    institute = await _get_institute_or_404(db, current_user)

    result = await db.execute(
        select(Enquiry)
        .join(EnquiryUnlock, EnquiryUnlock.enquiry_id == Enquiry.id)
        .where(EnquiryUnlock.institute_id == institute.id)
        .order_by(EnquiryUnlock.created_at.desc())
    )
    enquiries = result.scalars().all()
    return [await _to_institute_response(db, e, institute, True) for e in enquiries]
