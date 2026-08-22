"""
The Professional Profile screen — read/update the current user's profile
fields, and upload their profile photo / cover photo / resume.
"""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_active_user
from core.storage import save_upload, ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES
from models.user import User, ProfileUpdate, UserResponse

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
    for field, value in payload.model_dump(exclude_unset=True).items():
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
