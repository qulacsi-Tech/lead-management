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
from models.institute import Institute, OrganizationProfileUpdate
from models.page import Page, PageAdmin, PageResponse, INSTITUTE_TYPES
from models.social import Notification
from routers.pages import _unique_slug

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
# THIS WRITES A REAL INSTITUTE PAGE. It previously wrote a row to the legacy
# `institutes` table and nothing else, which is why a self-registered
# organisation never appeared in the Admin console, never got an Institute
# Console, and had no public page: those are all driven by `pages` and
# `page_admins`, and neither was ever written. Reported by the client, 02 Sep
# 2026 — "organization doesnt get created or it shows in super admin panel".
#
# The flow now mirrors Admin -> Institute Pages exactly: create the Page, make
# the caller its OWNER in `page_admins`, and let them fill in courses, notices,
# vacancies and the richer content afterwards in the Institute Console.
# ---------------------------------------------------------------------------

# Fields that map straight through from the form onto the Page.
_ORG_PAGE_FIELDS = (
    "name", "type", "tagline", "contact", "address",
    "state", "city", "website", "affiliation", "about",
)


async def _my_page(db: AsyncSession, user: User) -> Optional[Page]:
    """The page this account administers, if any.

    "Do they have one" is a relationship question — a row in `page_admins` —
    not a name match. Same rule backfill_pages.py uses.
    """
    return (
        await db.execute(
            select(Page)
            .join(PageAdmin, PageAdmin.page_id == Page.id)
            .where(PageAdmin.user_id == user.id)
            .order_by(Page.created_at)
        )
    ).scalars().first()


async def _legacy_org(db: AsyncSession, user: User) -> Optional[Institute]:
    """A row from the old `institutes` table, if this account filled the form
    before it wrote pages. Used only to seed the new page so that earlier input
    is not silently lost."""
    return (
        await db.execute(select(Institute).where(Institute.user_id == user.id))
    ).scalars().first()


@router.get("/me/organization", response_model=Optional[PageResponse])
async def get_my_organization(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Null rather than 404 when nothing has been filled in yet — "no details
    saved" is an ordinary state for a freshly toggled account, not an error."""
    return await _my_page(db, current_user)


@router.put("/me/organization", response_model=PageResponse)
async def save_my_organization(
    payload: OrganizationProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upsert the caller's Institute Page.

    Saving details is itself the declaration that this account is an
    organisation, so `is_organization` is set here too — that keeps the flag
    and the record from disagreeing if the toggle write ever fails.
    """
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=400,
            detail="A platform admin account cannot be an organisation",
        )

    data = payload.model_dump(exclude_unset=True)
    page = await _my_page(db, current_user)

    if page is None:
        legacy = await _legacy_org(db, current_user)

        # Type decides the public URL (/college/<name>/<city>) and is not
        # inferable, so it cannot be left blank at creation. Everything else
        # can be filled in later.
        page_type = data.get("type")
        if page_type not in INSTITUTE_TYPES:
            raise HTTPException(
                status_code=422,
                detail=f"Choose an institute type — one of {INSTITUTE_TYPES}.",
            )

        name = (data.get("name") or (legacy.name if legacy else "") or current_user.name or "").strip()
        if not name:
            raise HTTPException(status_code=422, detail="An organisation name is required.")

        city = data.get("city") or (legacy.city if legacy else None)
        page = Page(
            name=name,
            slug=await _unique_slug(db, "", name, page_type=page_type, city=city),
            type=page_type,
            # Seeded from the legacy row where the form did not supply a value,
            # so details entered before this endpoint wrote pages survive.
            tagline=data.get("tagline"),
            about=data.get("about") or (legacy.about if legacy else None),
            address=data.get("address") or ((legacy.block or legacy.district) if legacy else None),
            city=city,
            state=data.get("state") or (legacy.state if legacy else None),
            website=data.get("website") or (legacy.website if legacy else None),
            contact=data.get("contact") or (legacy.phone if legacy else None) or current_user.phone,
            affiliation=data.get("affiliation"),
            banners=[], gallery=[], social_links={}, content={},
            created_by=current_user.id,
        )
        db.add(page)
        await db.flush()

        # The account that created the organisation administers its page. This
        # single row is what grants the Institute Console.
        db.add(PageAdmin(
            page_id=page.id, user_id=current_user.id,
            role="OWNER", assigned_by=current_user.id,
        ))
        db.add(Notification(
            user_id=current_user.id,
            type="page_admin_assigned",
            title=f"{page.name} is live",
            message="Add your courses, admission notices and vacancies in the Institute Console.",
            ref_type="page", ref_id=page.id,
        ))
    else:
        if "type" in data and data["type"] not in INSTITUTE_TYPES:
            raise HTTPException(
                status_code=422,
                detail=f"type must be one of {INSTITUTE_TYPES}",
            )
        for field in _ORG_PAGE_FIELDS:
            if field in data:
                setattr(page, field, data[field])

        # Name, type or city changing moves the public URL, so the slug is
        # re-checked against its new neighbourhood.
        if {"name", "type", "city"} & data.keys():
            page.slug = await _unique_slug(
                db, page.slug, page.name,
                page_type=page.type, city=page.city, exclude_id=page.id,
            )

    current_user.is_organization = True
    await db.commit()
    await db.refresh(page)
    return page
