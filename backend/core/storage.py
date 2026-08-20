"""
Single file-storage service for the whole application.

Both user files (profile photo, cover, resume) and institute media (logo,
banners, gallery) go through this module, so there is one upload architecture
rather than two incompatible ones. The pattern was already proven by the
profile uploads; page media reuses it verbatim.

    UploadFile
        -> validate (MIME + size)
        -> write to  uploads/{scope}/{owner_id}/{kind}-{rand}{ext}
        -> return    /uploads/{scope}/{owner_id}/{kind}-{rand}{ext}
        -> caller stores that relative URL on its own model column
        -> served by the StaticFiles mount in main.py

Storage is the local filesystem, matching what already exists. `UPLOAD_ROOT` is
the one place to change when this moves to object storage — no caller
constructs a path itself.
"""

import os
import uuid
from typing import Iterable, Optional

from fastapi import HTTPException, UploadFile

UPLOAD_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_DOC_TYPES = {"application/pdf"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5MB

_EXT_FALLBACK = {"application/pdf": ".pdf"}


async def save_upload(
    file: UploadFile,
    *,
    scope: str,
    owner_id: str,
    kind: str,
    allowed_types: Optional[Iterable[str]] = None,
    max_bytes: int = MAX_UPLOAD_BYTES,
) -> str:
    """Validate and persist one uploaded file; return its public URL path.

    `scope` separates namespaces on disk ("users", "pages") so a page id can
    never collide with a user id. `owner_id` is always supplied by the caller
    from an *authorized* object — never from request input — which is what
    stops a caller writing into another owner's directory.
    """
    allowed = set(allowed_types or ALLOWED_IMAGE_TYPES)
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type for {kind}: {file.content_type}",
        )

    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File too large (max {max_bytes // (1024 * 1024)}MB)")

    target_dir = os.path.join(UPLOAD_ROOT, scope, owner_id)
    os.makedirs(target_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1].lower()
    if not ext:
        ext = _EXT_FALLBACK.get(file.content_type or "", ".jpg")

    dest_name = f"{kind}-{uuid.uuid4().hex[:8]}{ext}"
    with open(os.path.join(target_dir, dest_name), "wb") as fh:
        fh.write(contents)

    return f"/uploads/{scope}/{owner_id}/{dest_name}"
