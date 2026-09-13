"""
Guess paper / study material endpoints.

Two routers, because the resource has two genuinely different audiences:

  router        /pages/{page_id}/papers   — INSTITUTE-owned CRUD, nested so
                                            `require_page_admin` authorizes
                                            from the path before any handler
                                            runs (same shape as courses.py).
  public_router /papers                   — the reader's side: the download.

The download deliberately does NOT live under /pages/{page_id}/... . Nesting it
would mean a reader's request carried the institute's id as the thing being
acted on, and the natural next step for anyone maintaining it would be to hand
the handler the Page — which is exactly the object that must not learn who
downloaded. Keeping it page-free makes the privacy boundary visible in the URL.

See models/study_paper.py for the privacy contract this router implements.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_active_user, get_optional_user
from core.authz import require_page_admin, assert_belongs_to_page, user_administers_page, is_main_admin
from core.storage import save_upload, ALLOWED_DOC_TYPES
from models.user import User
from models.enums import AD_VISIBILITIES, AdVisibility
from models.page import Page
from models.study_paper import (
    StudyPaper,
    StudyPaperDownload,
    StudyPaperCreate,
    StudyPaperUpdate,
    StudyPaperResponse,
    StudyPaperDownloadResponse,
    STUDY_PAPER_STATUSES,
)

def _assert_may_set_visibility(value: Optional[str], user: User) -> None:
    """Validate the visibility value, and gate the platform-wide one.

    Running on every institute's page is inventory the PLATFORM owns, not
    something an institute grants itself — otherwise any page admin could
    promote their own vacancy onto every competitor's page for free. Main
    Admin only, mirroring PLATFORM_ONLY_PAGE_FIELDS in models/page.py.
    """
    if value is None:
        return
    if value not in AD_VISIBILITIES:
        raise HTTPException(
            status_code=422, detail=f"visibility must be one of {AD_VISIBILITIES}"
        )
    if value == AdVisibility.PLATFORM.value and not is_main_admin(user):
        raise HTTPException(
            status_code=403,
            detail="Only a Main Admin can run an ad across every institute page",
        )


router = APIRouter(prefix="/pages/{page_id}/papers", tags=["Study Papers"])
public_router = APIRouter(prefix="/papers", tags=["Study Papers"])

# Study material is a document, not a photo, and runs larger than the 5MB
# default that suits profile pictures.
MAX_PAPER_BYTES = 15 * 1024 * 1024


async def _load(db: AsyncSession, paper_id: str) -> Optional[StudyPaper]:
    return (await db.execute(select(StudyPaper).where(StudyPaper.id == paper_id))).scalars().first()


async def _mark_downloaded(
    db: AsyncSession, papers: List[StudyPaper], user: Optional[User]
) -> List[StudyPaperResponse]:
    """Attach `downloaded_by_me` to a list of papers in one query.

    This is the ONLY place a download row is read back, and it is filtered to
    the calling user's own rows. It can therefore never answer "who downloaded
    this", only "did I".
    """
    rows = [StudyPaperResponse.model_validate(p) for p in papers]
    if user is None or not rows:
        return rows

    mine = set(
        (
            await db.execute(
                select(StudyPaperDownload.paper_id).where(
                    StudyPaperDownload.user_id == user.id,
                    StudyPaperDownload.paper_id.in_([p.id for p in papers]),
                )
            )
        )
        .scalars()
        .all()
    )
    for row in rows:
        row.downloaded_by_me = row.id in mine
    return rows


# ---------------------------------------------------------------------------
# Institute-owned CRUD
# ---------------------------------------------------------------------------

@router.get("", response_model=List[StudyPaperResponse])
async def list_papers(
    page_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    status_filter: Optional[str] = Query(None, alias="status"),
    kind: Optional[str] = Query(None),
):
    """Readable by anyone; Drafts only reach people who administer the page.

    Mirrors list_courses so the publish/unpublish rule is enforced server-side
    rather than trusted to the client.
    """
    page = (await db.execute(select(Page).where(Page.id == page_id))).scalars().first()
    if page is None:
        raise HTTPException(status_code=404, detail="Page not found")

    can_see_drafts = (
        await user_administers_page(db, current_user, page_id) if current_user else False
    )

    stmt = select(StudyPaper).where(StudyPaper.page_id == page_id)
    if not can_see_drafts:
        stmt = stmt.where(StudyPaper.status == "Published")
    elif status_filter:
        stmt = stmt.where(StudyPaper.status == status_filter)
    if kind:
        stmt = stmt.where(StudyPaper.kind == kind)

    papers = list(
        (await db.execute(stmt.order_by(StudyPaper.ranking, StudyPaper.created_at.desc())))
        .scalars()
        .all()
    )
    return await _mark_downloaded(db, papers, current_user)


@router.post("", response_model=StudyPaperResponse, status_code=status.HTTP_201_CREATED)
async def create_paper(
    payload: StudyPaperCreate,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if payload.status not in STUDY_PAPER_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {STUDY_PAPER_STATUSES}")

    # A paper with no file is a broken download for every reader who clicks it,
    # so Published is only reachable once the PDF is attached. Creating as a
    # Draft first and uploading second is the normal path.
    if payload.status == "Published":
        raise HTTPException(
            status_code=422,
            detail="Upload the file before publishing — create as Draft, then POST the file.",
        )
    _assert_may_set_visibility(payload.visibility, current_user)

    # page_id comes from the authorized Page, never the payload.
    paper = StudyPaper(page_id=page.id, created_by=current_user.id, **payload.model_dump())
    db.add(paper)
    await db.commit()
    await db.refresh(paper)
    return StudyPaperResponse.model_validate(paper)


@router.post("/{paper_id}/file", response_model=StudyPaperResponse)
async def upload_paper_file(
    paper_id: str,
    file: UploadFile = File(...),
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    """Attach the PDF. PDF only — study material is meant to be read, and
    allowing arbitrary types would turn this into a general file host served
    straight off the origin."""
    paper = await _load(db, paper_id)
    assert_belongs_to_page(paper, page.id, "Paper")

    url = await save_upload(
        file,
        scope="pages",
        owner_id=page.id,
        kind="paper",
        allowed_types=ALLOWED_DOC_TYPES,
        max_bytes=MAX_PAPER_BYTES,
    )
    paper.file_url = url
    paper.file_name = file.filename
    # save_upload has already consumed the stream, so the size comes from the
    # file on disk rather than a second read of an exhausted UploadFile.
    paper.file_size = getattr(file, "size", None)

    await db.commit()
    await db.refresh(paper)
    return StudyPaperResponse.model_validate(paper)


@router.patch("/{paper_id}", response_model=StudyPaperResponse)
async def update_paper(
    paper_id: str,
    payload: StudyPaperUpdate,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    paper = await _load(db, paper_id)
    assert_belongs_to_page(paper, page.id, "Paper")

    data = payload.model_dump(exclude_unset=True)
    if "visibility" in data:
        _assert_may_set_visibility(data["visibility"], current_user)
    if "status" in data:
        if data["status"] not in STUDY_PAPER_STATUSES:
            raise HTTPException(
                status_code=422, detail=f"status must be one of {STUDY_PAPER_STATUSES}"
            )
        if data["status"] == "Published" and not paper.file_url:
            raise HTTPException(status_code=422, detail="Attach a file before publishing")
        if data["status"] == "Published" and paper.published_at is None:
            paper.published_at = func.now()

    for field, value in data.items():
        setattr(paper, field, value)

    await db.commit()
    await db.refresh(paper)
    return StudyPaperResponse.model_validate(paper)


@router.post("/{paper_id}/push-to-top", response_model=List[StudyPaperResponse])
async def push_to_top(
    paper_id: str,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    """Same affordance the opportunity lists have, so all three ad types on the
    Ads tab reorder identically."""
    paper = await _load(db, paper_id)
    assert_belongs_to_page(paper, page.id, "Paper")

    siblings = list(
        (
            await db.execute(
                select(StudyPaper)
                .where(StudyPaper.page_id == page.id)
                .order_by(StudyPaper.ranking, StudyPaper.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    reordered = [paper] + [p for p in siblings if p.id != paper.id]
    for index, row in enumerate(reordered, start=1):
        row.ranking = index

    await db.commit()
    return [StudyPaperResponse.model_validate(p) for p in reordered]


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_paper(
    paper_id: str,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    paper = await _load(db, paper_id)
    assert_belongs_to_page(paper, page.id, "Paper")
    await db.delete(paper)
    await db.commit()


# ---------------------------------------------------------------------------
# Reader-facing
# ---------------------------------------------------------------------------

@public_router.get("", response_model=List[StudyPaperResponse])
async def list_public_papers(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    page_id: Optional[str] = Query(None),
    kind: Optional[str] = Query(None),
    visibility: Optional[str] = Query(None),
    exclude_page_id: Optional[str] = Query(None),
    limit: int = Query(30, ge=1, le=100),
):
    """Published papers across enabled institutes.

    Backs both the page's own Study Material section (`page_id`) and the
    platform-wide offering on other institutes' pages
    (`visibility=platform` + `exclude_page_id`).
    """
    stmt = (
        select(StudyPaper)
        .join(Page, Page.id == StudyPaper.page_id)
        .where(StudyPaper.status == "Published", Page.is_enabled.is_(True))
    )
    if page_id:
        stmt = stmt.where(StudyPaper.page_id == page_id)
    if kind:
        stmt = stmt.where(StudyPaper.kind == kind)
    if visibility:
        stmt = stmt.where(StudyPaper.visibility == visibility)
    if exclude_page_id:
        stmt = stmt.where(StudyPaper.page_id != exclude_page_id)

    papers = list(
        (
            await db.execute(
                stmt.order_by(StudyPaper.ranking, StudyPaper.created_at.desc()).limit(limit)
            )
        )
        .scalars()
        .all()
    )
    return await _mark_downloaded(db, papers, current_user)


@public_router.post("/{paper_id}/download", response_model=StudyPaperDownloadResponse)
async def download_paper(
    paper_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Record the download and hand back the file URL.

    Sign-in is required so the count means distinct people. What the institute
    learns is *only* that the number went up: the row written here is never
    read back by any page-scoped endpoint, and `StudyPaperResponse` has no
    field that could carry it. This is the client's "download karne wali ki
    information uske pass nahi jaye" requirement — no enquiry is created, no
    notification is sent to the page, and no lead is generated.
    """
    paper = await _load(db, paper_id)
    if paper is None or paper.status != "Published":
        raise HTTPException(status_code=404, detail="Paper not found")
    if not paper.file_url:
        raise HTTPException(status_code=409, detail="This paper has no file attached yet")

    page = (await db.execute(select(Page).where(Page.id == paper.page_id))).scalars().first()
    if page is None or not page.is_enabled:
        raise HTTPException(status_code=404, detail="Paper not found")

    # First download by this account increments the counter; a repeat download
    # returns the file again but leaves the number alone. The unique constraint
    # is the authority — two concurrent first-downloads race here, and the
    # loser is caught rather than double-counted.
    already = (
        await db.execute(
            select(StudyPaperDownload.id).where(
                StudyPaperDownload.paper_id == paper.id,
                StudyPaperDownload.user_id == current_user.id,
            )
        )
    ).scalars().first()

    if already is None:
        db.add(StudyPaperDownload(paper_id=paper.id, user_id=current_user.id))
        paper.downloads_count = (paper.downloads_count or 0) + 1
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            paper = await _load(db, paper_id)
        else:
            await db.refresh(paper)

    return StudyPaperDownloadResponse(
        paper_id=paper.id,
        file_url=paper.file_url,
        file_name=paper.file_name,
        downloads_count=paper.downloads_count or 0,
    )
