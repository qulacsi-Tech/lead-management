"""
The Professional Profile screen — read/update the current user's profile
fields, and upload their profile photo / cover photo / resume.
"""

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_active_user
from core.storage import save_upload, ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES
from models.user import User, ProfileUpdate, UserResponse
from models.enums import UserRole
from models.institute import (
    Institute,
    InstituteResponse,
    OrganizationProfileUpdate,
)

router = APIRouter(prefix="/profile", tags=["Profile"])

UPLOAD_FIELD = {
    "photo": "profile_photo_url",
    "cover": "cover_photo_url",
    "resume": "resume_url",
}


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    data = payload.model_dump(exclude_unset=True)

    # Becoming an organisation is one-way. It reshapes the account — personal
    # history is dropped from the profile and an institute record is created
    # against it — so reverting would leave the two halves disagreeing about
    # what this account is. Enforced here, not just disabled in the UI, since
    # the client is not what decides.
    if data.get("is_organization") is False and current_user.is_organization:
        raise HTTPException(
            status_code=400,
            detail="An organisation account cannot be switched back to an individual.",
        )

    for field, value in data.items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/me/upload", response_model=UserResponse)
async def upload_profile_file(
    kind: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if kind not in UPLOAD_FIELD:
        raise HTTPException(status_code=400, detail="kind must be one of: photo, cover, resume")

    # Shared with institute media uploads — see core/storage.py. Files land
    # under uploads/users/{id}/ ; pre-Phase-2 uploads live at uploads/{id}/
    # and keep working, since the stored URL is absolute from /uploads.
    url = await save_upload(
        file,
        scope="users",
        owner_id=current_user.id,
        kind=kind,
        allowed_types=ALLOWED_DOC_TYPES if kind == "resume" else ALLOWED_IMAGE_TYPES,
    )

    setattr(current_user, UPLOAD_FIELD[kind], url)
    await db.commit()
    await db.refresh(current_user)
    return current_user


# ---------------------------------------------------------------------------
# Organisation details
#
# Self-registration always creates an individual. A user who is really an
# organisation flips `is_organization` (PATCH /profile/me) and then fills in
# the details below.
#
# Those details are stored in the existing `institutes` table rather than a
# second organisation table — it already holds exactly these columns, is what
# the Admin panel reads, and is linked 1:1 to a user by `user_id`. Sign-in
# email and password are deliberately not part of this: the account already
# has both.
# ---------------------------------------------------------------------------


async def _my_org(db: AsyncSession, user: User) -> Optional[Institute]:
    return (
        await db.execute(select(Institute).where(Institute.user_id == user.id))
    ).scalars().first()


@router.get("/me/organization", response_model=Optional[InstituteResponse])
async def get_my_organization(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Null rather than 404 when nothing has been filled in yet — "no details
    saved" is an ordinary state for a freshly toggled account, not an error."""
    return await _my_org(db, current_user)


@router.put("/me/organization", response_model=InstituteResponse)
async def save_my_organization(
    payload: OrganizationProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upsert. Saving details is itself the declaration that this account is an
    organisation, so `is_organization` is set here too — that keeps the flag
    and the record from disagreeing if the toggle write ever fails.
    """
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=400,
            detail="A platform admin account cannot be an organisation",
        )

    data = payload.model_dump(exclude_unset=True)
    org = await _my_org(db, current_user)

    if org is None:
        org = Institute(
            user_id=current_user.id,
            # The organisation is reachable at the account's own address; there
            # is no separate organisation login to create.
            email=current_user.email,
            name=data.get("name") or current_user.name,
            phone=data.get("phone") or current_user.phone,
        )
        db.add(org)

    for field, value in data.items():
        setattr(org, field, value)

    current_user.is_organization = True
    await db.commit()
    await db.refresh(org)
    return org
