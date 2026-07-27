"""
Registration endpoints for Student, Mentor and Institute roles.

Each endpoint:
  1. Checks for duplicate email in the `users` table.
  2. Creates a User row (hashed password, correct role).
  3. Creates the role-specific profile row (Student / Mentor / Institute).
  4. Returns a JWT TokenResponse so the frontend can auto-log the user in
     without a second round-trip.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.database import get_db
from core.security import get_password_hash, create_access_token
from models.user import User, UserResponse, TokenResponse
from models.enums import UserRole
from models.student import Student, StudentCreate, StudentResponse  # noqa: F401
from models.mentor import Mentor, MentorCreate, MentorResponse      # noqa: F401
from models.institute import Institute, InstituteCreate, InstituteResponse  # noqa: F401

router = APIRouter(prefix="/register", tags=["Registration"])


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _check_email_unique(email: str, db: AsyncSession) -> None:
    result = await db.execute(select(User).where(User.email == email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")


def _make_token(user: User) -> TokenResponse:
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return TokenResponse(access_token=access_token, user=UserResponse.model_validate(user))


# ---------------------------------------------------------------------------
# Student Registration
# ---------------------------------------------------------------------------

@router.post("/student", response_model=TokenResponse, summary="Register a new student")
async def register_student(payload: StudentCreate, db: AsyncSession = Depends(get_db)):
    await _check_email_unique(payload.email, db)

    # 1. Create auth user
    user = User(
        email=payload.email,
        name=payload.name,
        phone=payload.phone,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.STUDENT,
        is_active=True,
    )
    db.add(user)
    await db.flush()  # populate user.id without committing yet

    # 2. Create student profile
    profile = Student(
        user_id=user.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        city=payload.city,
        target_course=payload.target_course,
        current_school=payload.current_school,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(user)

    return _make_token(user)


# ---------------------------------------------------------------------------
# Mentor Registration
# ---------------------------------------------------------------------------

@router.post("/mentor", response_model=TokenResponse, summary="Register a new mentor")
async def register_mentor(payload: MentorCreate, db: AsyncSession = Depends(get_db)):
    await _check_email_unique(payload.email, db)

    user = User(
        email=payload.email,
        name=payload.name,
        phone=payload.phone,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.MENTOR,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    profile = Mentor(
        user_id=user.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        domain=payload.domain,
        company=payload.company,
        experience_level=payload.experience_level,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(user)

    return _make_token(user)


# ---------------------------------------------------------------------------
# Institute Registration
# ---------------------------------------------------------------------------

@router.post("/institute", response_model=TokenResponse, summary="Register a new institute")
async def register_institute(payload: InstituteCreate, db: AsyncSession = Depends(get_db)):
    await _check_email_unique(payload.email, db)

    user = User(
        email=payload.email,
        name=payload.name,
        phone=payload.phone,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.INSTITUTE,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    profile = Institute(
        user_id=user.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        state=payload.state,
        district=payload.district,
        block=payload.block,
        city=payload.city or payload.district,
        programs=payload.programs,
        website=payload.website,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(user)

    return _make_token(user)
