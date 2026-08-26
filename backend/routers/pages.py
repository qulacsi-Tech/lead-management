"""
Institute Page endpoints.

Ownership split enforced here:
  POST   /pages                    Main Admin only  — create the institute
  GET    /pages                    Main Admin       — platform-wide list
  GET    /pages/mine               Any user         — pages I administer
  GET    /pages/slug/{slug}        Public           — public page view
  GET    /pages/{page_id}          Page Admin       — full record incl. drafts
  PATCH  /pages/{page_id}          Page Admin       — content; platform-only
                                                      fields rejected
  DELETE /pages/{page_id}          Main Admin       — remove institute
  GET    /pages/{page_id}/admins   Page Admin
  POST   /pages/{page_id}/admins   Main Admin       — assign an admin
  DELETE /pages/{page_id}/admins/{user_id}   Main Admin
"""

import re
import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Query, status

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_active_user, get_optional_user
from core.authz import (
    require_main_admin,
    require_page_admin,
    user_administers_page,
    pages_administered_by,
    follower_count,
    is_main_admin,
)
from models.user import User
from models.page import (
    Page,
    PageAdmin,
    PageCreate,
    PageUpdate,
    PageResponse,
    PageDetailResponse,
    PageAdminResponse,
    AssignAdminRequest,
    INSTITUTE_TYPES,
    PLATFORM_ONLY_PAGE_FIELDS,
)
from models.social import Follow, Notification

router = APIRouter(prefix="/pages", tags=["Institute Pages"])


def slugify(value: str) -> str:
    value = (value or "").lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return re.sub(r"(^-|-$)", "", value)


# Reserved because the frontend router serves these as literal paths; an
# institute claiming one would shadow a real screen.
RESERVED_SLUGS = {
    "feed", "profile", "dashboard", "search", "purchased", "admin", "institute",
    "page", "create-page", "signup", "login", "api", "uploads",
}


async def _unique_slug(db: AsyncSession, desired: str, fallback: str) -> str:
    base = slugify(desired or fallback) or f"institute-{uuid.uuid4().hex[:6]}"
    if base in RESERVED_SLUGS:
        base = f"{base}-institute"
    candidate, n = base, 2
    while True:
        exists = (await db.execute(select(Page.id).where(Page.slug == candidate))).scalars().first()
        if not exists:
            return candidate
        candidate = f"{base}-{n}"
        n += 1


async def _admin_rows(db: AsyncSession, page_id: str) -> List[PageAdminResponse]:
    result = await db.execute(
        select(PageAdmin, User).join(User, User.id == PageAdmin.user_id).where(PageAdmin.page_id == page_id)
    )
    return [
        PageAdminResponse(
            id=pa.id, user_id=pa.user_id, name=u.name, email=u.email,
            role=pa.role, assigned_at=pa.assigned_at,
        )
        for pa, u in result.all()
    ]


# ---------------------------------------------------------------------------
# Create / list
# ---------------------------------------------------------------------------

@router.post("", response_model=PageDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_page(
    payload: PageCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """PLATFORM-OWNED. Establishes the institute and optionally assigns its
    first Institute Admin in the same call."""
    if payload.type not in INSTITUTE_TYPES:
        raise HTTPException(status_code=422, detail=f"type must be one of {INSTITUTE_TYPES}")

    slug = await _unique_slug(db, payload.slug, payload.name)

    page = Page(
        name=payload.name,
        slug=slug,
        type=payload.type,
        tagline=payload.tagline,
        about=payload.about,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        website=payload.website,
        contact=payload.contact,
        affiliation=payload.affiliation,
        banners=[], gallery=[], social_links={}, content={},
        created_by=admin.id,
    )
    db.add(page)
    await db.flush()

    if payload.admin_email:
        target = (
            await db.execute(select(User).where(func.lower(User.email) == payload.admin_email.lower()))
        ).scalars().first()
        if target is None:
            raise HTTPException(
                status_code=404,
                detail=f"No user account exists for {payload.admin_email}. Create the account first.",
            )
        db.add(PageAdmin(page_id=page.id, user_id=target.id, role="OWNER", assigned_by=admin.id))
        db.add(Notification(
            user_id=target.id,
            type="page_admin_assigned",
            title=f"You are now an admin of {page.name}",
            message="You can manage its courses, notices, vacancies and enquiries.",
            ref_type="page", ref_id=page.id,
        ))

    await db.commit()
    await db.refresh(page)

    return PageDetailResponse(
        **PageResponse.model_validate(page).model_dump(),
        admins=await _admin_rows(db, page.id),
        is_page_admin=True,
        followers_count=0,
    )


@router.get("", response_model=List[PageResponse])
async def list_pages(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_main_admin),
    q: Optional[str] = Query(None),
):
    """PLATFORM-OWNED oversight list."""
    stmt = select(Page).order_by(Page.created_at.desc())
    if q:
        stmt = stmt.where(Page.name.ilike(f"%{q}%"))
    return list((await db.execute(stmt)).scalars().all())


@router.get("/mine", response_model=List[PageResponse])
async def list_my_pages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Backs the Institute Console: which institutes may I manage?"""
    return await pages_administered_by(db, current_user)


@router.get("/public", response_model=List[PageResponse])
async def list_public_pages(
    db: AsyncSession = Depends(get_db),
    q: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
):
    """Enabled institutes, readable without a session.

    The oversight list above is Main-Admin only, so the public feed had no way
    to name the institute behind a notice or offer pages to follow. Declared
    before /{page_id} because FastAPI matches in registration order and would
    otherwise read "public" as an id.
    """
    stmt = select(Page).where(Page.is_enabled.is_(True))
    if q:
        stmt = stmt.where(Page.name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Page.created_at.desc()).limit(limit)
    return list((await db.execute(stmt)).scalars().all())


@router.get("/slug/{slug}", response_model=PageDetailResponse)
async def get_page_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Public institute page — readable without a session. A disabled page
    404s for everyone except the people who administer it."""
    page = (await db.execute(select(Page).where(Page.slug == slug))).scalars().first()
    if page is None:
        raise HTTPException(status_code=404, detail="Institute page not found")

    is_admin_here = (
        await user_administers_page(db, current_user, page.id) if current_user else False
    )
    if not page.is_enabled and not is_admin_here:
        raise HTTPException(status_code=404, detail="Institute page not found")

    following = False
    if current_user:
        following = (
            await db.execute(
                select(Follow.id).where(Follow.user_id == current_user.id, Follow.page_id == page.id)
            )
        ).scalars().first() is not None

    return PageDetailResponse(
        **PageResponse.model_validate(page).model_dump(),
        admins=await _admin_rows(db, page.id) if is_admin_here else [],
        is_page_admin=is_admin_here,
        is_following=following,
        followers_count=await follower_count(db, page.id),
    )


@router.get("/{page_id}", response_model=PageDetailResponse)
async def get_page(
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    """Management view — only for people who administer this page."""
    return PageDetailResponse(
        **PageResponse.model_validate(page).model_dump(),
        admins=await _admin_rows(db, page.id),
        is_page_admin=True,
        followers_count=await follower_count(db, page.id),
    )


# ---------------------------------------------------------------------------
# Update / delete
# ---------------------------------------------------------------------------

@router.patch("/{page_id}", response_model=PageResponse)
async def update_page(
    payload: PageUpdate,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """INSTITUTE-OWNED content update.

    `type`, `slug` and `is_enabled` establish the institute's platform identity,
    so a Page Admin cannot change them even though they may edit everything
    else on the same record.
    """
    data = payload.model_dump(exclude_unset=True)

    attempted_platform_fields = PLATFORM_ONLY_PAGE_FIELDS & data.keys()
    if attempted_platform_fields and not is_main_admin(current_user):
        raise HTTPException(
            status_code=403,
            detail=f"Only a Main Admin may change: {', '.join(sorted(attempted_platform_fields))}",
        )

    if "type" in data and data["type"] not in INSTITUTE_TYPES:
        raise HTTPException(status_code=422, detail=f"type must be one of {INSTITUTE_TYPES}")

    if "slug" in data and data["slug"]:
        data["slug"] = await _unique_slug(db, data["slug"], page.name)

    for field, value in data.items():
        setattr(page, field, value)

    await db.commit()
    await db.refresh(page)
    return page


@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(
    page_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_main_admin),
):
    """PLATFORM-OWNED. Institute Admins can never delete their own institute."""
    page = (await db.execute(select(Page).where(Page.id == page_id))).scalars().first()
    if page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    await db.delete(page)
    await db.commit()


# ---------------------------------------------------------------------------
# Page admins  (PLATFORM-OWNED assignment)
# ---------------------------------------------------------------------------

@router.get("/{page_id}/admins", response_model=List[PageAdminResponse])
async def list_page_admins(
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    return await _admin_rows(db, page.id)


@router.post("/{page_id}/admins", response_model=List[PageAdminResponse], status_code=status.HTTP_201_CREATED)
async def assign_page_admin(
    page_id: str,
    payload: AssignAdminRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """Only a Main Admin assigns institute administrators. An Institute Admin
    cannot recruit co-admins, and — critically — cannot add themselves to
    another institute."""
    page = (await db.execute(select(Page).where(Page.id == page_id))).scalars().first()
    if page is None:
        raise HTTPException(status_code=404, detail="Page not found")

    if payload.role not in ("OWNER", "ADMIN"):
        raise HTTPException(status_code=422, detail="role must be OWNER or ADMIN")

    target = (
        await db.execute(select(User).where(func.lower(User.email) == payload.email.lower()))
    ).scalars().first()
    if target is None:
        raise HTTPException(
            status_code=404,
            detail=f"No user account exists for {payload.email}. Create the account first.",
        )

    existing = (
        await db.execute(
            select(PageAdmin).where(PageAdmin.page_id == page_id, PageAdmin.user_id == target.id)
        )
    ).scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="That user already administers this institute")

    db.add(PageAdmin(page_id=page_id, user_id=target.id, role=payload.role, assigned_by=admin.id))
    db.add(Notification(
        user_id=target.id,
        type="page_admin_assigned",
        title=f"You are now an admin of {page.name}",
        message="You can manage its courses, notices, vacancies and enquiries.",
        ref_type="page", ref_id=page_id,
    ))
    await db.commit()
    return await _admin_rows(db, page_id)


@router.delete("/{page_id}/admins/{user_id}", response_model=List[PageAdminResponse])
async def revoke_page_admin(
    page_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_main_admin),
):
    membership = (
        await db.execute(
            select(PageAdmin).where(PageAdmin.page_id == page_id, PageAdmin.user_id == user_id)
        )
    ).scalars().first()
    if membership is None:
        raise HTTPException(status_code=404, detail="That user does not administer this institute")

    if membership.role == "OWNER":
        remaining_owners = (
            await db.execute(
                select(func.count(PageAdmin.id)).where(
                    PageAdmin.page_id == page_id, PageAdmin.role == "OWNER"
                )
            )
        ).scalar() or 0
        if remaining_owners <= 1:
            raise HTTPException(
                status_code=409,
                detail="Cannot remove the only owner — assign another owner first",
            )

    await db.delete(membership)
    await db.commit()
    return await _admin_rows(db, page_id)


# ---------------------------------------------------------------------------
# Section Item Operations (Add, Edit, Delete, Disable/Enable)
# ---------------------------------------------------------------------------

class SectionItemRequest(BaseModel):
    item: Dict[str, Any]


class ToggleStatusRequest(BaseModel):
    is_enabled: bool


@router.patch("/{page_id}/status", response_model=PageResponse)
async def toggle_page_status(
    payload: ToggleStatusRequest,
    page_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Enable or disable an Institute Page."""
    page = (await db.execute(select(Page).where(Page.id == page_id))).scalars().first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    is_admin = await user_administers_page(db, current_user, page.id)
    if not is_admin and not is_main_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to change status of this page")

    page.is_enabled = payload.is_enabled
    await db.commit()
    await db.refresh(page)
    return page


@router.post("/{page_id}/sections/{section_name}/items", response_model=PageResponse)
async def add_section_item(
    page_id: str,
    section_name: str,
    payload: SectionItemRequest,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    """Add an item to a specific section inside content or gallery."""
    item = payload.item or {}
    if not item.get("id"):
        item["id"] = f"item_{uuid.uuid4().hex[:8]}"

    content_data = dict(page.content or {})

    if section_name == "gallery":
        gallery_list = list(page.gallery or [])
        gallery_list.append(item)
        page.gallery = gallery_list
    elif section_name in ["whyChooseUs", "why_choose_us"]:
        current_list = list(content_data.get("whyChooseUs") or [])
        val = item.get("value") or item.get("text") or item.get("title") or str(item)
        current_list.append(val)
        content_data["whyChooseUs"] = current_list
        page.content = content_data
    else:
        current_list = list(content_data.get(section_name) or [])
        current_list.append(item)
        content_data[section_name] = current_list
        page.content = content_data

    await db.commit()
    await db.refresh(page)
    return page


@router.patch("/{page_id}/sections/{section_name}/items/{item_id}", response_model=PageResponse)
async def update_section_item(
    page_id: str,
    section_name: str,
    item_id: str,
    payload: SectionItemRequest,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    """Edit an item within a section by item_id."""
    updated_item = payload.item or {}
    content_data = dict(page.content or {})

    if section_name == "gallery":
        gallery_list = list(page.gallery or [])
        for idx, g in enumerate(gallery_list):
            if isinstance(g, dict) and g.get("id") == item_id:
                gallery_list[idx] = {**g, **updated_item}
                break
        page.gallery = gallery_list
    else:
        current_list = list(content_data.get(section_name) or [])
        for idx, it in enumerate(current_list):
            if isinstance(it, dict) and it.get("id") == item_id:
                current_list[idx] = {**it, **updated_item}
                break
        content_data[section_name] = current_list
        page.content = content_data

    await db.commit()
    await db.refresh(page)
    return page


@router.delete("/{page_id}/sections/{section_name}/items/{item_id}", response_model=PageResponse)
async def delete_section_item(
    page_id: str,
    section_name: str,
    item_id: str,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete an item from a section by item_id (or string match)."""
    content_data = dict(page.content or {})

    if section_name == "gallery":
        page.gallery = [g for g in (page.gallery or []) if isinstance(g, dict) and g.get("id") != item_id]
    elif section_name in ["whyChooseUs", "why_choose_us"]:
        content_data["whyChooseUs"] = [
            w for w in (content_data.get("whyChooseUs") or [])
            if (isinstance(w, dict) and w.get("id") != item_id) and w != item_id
        ]
        page.content = content_data
    else:
        current_list = list(content_data.get(section_name) or [])
        content_data[section_name] = [
            it for it in current_list
            if not (isinstance(it, dict) and (it.get("id") == item_id or it.get("key") == item_id))
        ]
        page.content = content_data

    await db.commit()
    await db.refresh(page)
    return page

