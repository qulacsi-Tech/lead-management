"""
Institute media uploads — logo, banner images and gallery photos.

Reuses `core.storage`, the same service behind profile photo/resume uploads, so
the application has one upload path rather than two. The owner directory is
taken from the Page object returned by `require_page_admin`, which means a
caller can only ever write into an institute they actually administer.
"""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.authz import require_page_admin
from core.storage import save_upload, ALLOWED_IMAGE_TYPES
from models.page import Page, PageResponse

router = APIRouter(prefix="/pages/{page_id}/media", tags=["Institute Pages"])

MAX_BANNERS = 3


@router.post("", response_model=PageResponse)
async def upload_page_media(
    kind: str = Form(...),          # logo | banner | gallery
    caption: str = Form(""),
    file: UploadFile = File(...),
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    if kind not in ("logo", "banner", "gallery"):
        raise HTTPException(status_code=400, detail="kind must be one of: logo, banner, gallery")

    url = await save_upload(
        file, scope="pages", owner_id=page.id, kind=kind, allowed_types=ALLOWED_IMAGE_TYPES
    )

    if kind == "logo":
        page.logo_url = url
    elif kind == "banner":
        banners = list(page.banners or [])
        if len(banners) >= MAX_BANNERS:
            raise HTTPException(status_code=400, detail=f"At most {MAX_BANNERS} banners")
        page.banners = banners + [url]
    else:
        gallery = list(page.gallery or [])
        gallery.append({"id": url.rsplit("/", 1)[-1], "url": url, "caption": caption})
        page.gallery = gallery

    await db.commit()
    await db.refresh(page)
    return page


@router.delete("", response_model=PageResponse)
async def remove_page_media(
    kind: str,
    url: str,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    """Detaches media from the page record. The file itself is left on disk —
    deleting bytes is a separate housekeeping concern and removing them here
    would break any response already referencing the URL."""
    if kind == "logo":
        page.logo_url = None
    elif kind == "banner":
        page.banners = [b for b in (page.banners or []) if b != url]
    elif kind == "gallery":
        page.gallery = [g for g in (page.gallery or []) if g.get("url") != url]
    else:
        raise HTTPException(status_code=400, detail="kind must be one of: logo, banner, gallery")

    await db.commit()
    await db.refresh(page)
    return page
