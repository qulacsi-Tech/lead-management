"""
The Professional Profile screen — read/update the current user's profile
fields, and upload their profile photo / cover photo / resume.
"""

import os
import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_active_user
from models.user import User, ProfileUpdate, UserResponse

router = APIRouter(prefix="/profile", tags=["Profile"])

UPLOAD_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_RESUME_TYPES = {"application/pdf"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5MB

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

    allowed_types = ALLOWED_RESUME_TYPES if kind == "resume" else ALLOWED_IMAGE_TYPES
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported file type for {kind}: {file.content_type}")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    user_dir = os.path.join(UPLOAD_ROOT, current_user.id)
    os.makedirs(user_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1].lower() or (".pdf" if kind == "resume" else ".jpg")
    dest_name = f"{kind}-{uuid.uuid4().hex[:8]}{ext}"
    with open(os.path.join(user_dir, dest_name), "wb") as f:
        f.write(contents)

    setattr(current_user, UPLOAD_FIELD[kind], f"/uploads/{current_user.id}/{dest_name}")
    await db.commit()
    await db.refresh(current_user)
    return current_user
