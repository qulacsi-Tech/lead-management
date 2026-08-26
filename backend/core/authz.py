"""
Centralised authorization for Connectedus.

Every ownership decision in the application flows through this module. No
router re-implements "is this user allowed to touch this page" — they depend on
one of the helpers below, so there is exactly one definition of each rule and
one place to audit.

The three tiers, matching the product's ownership model:

    require_main_admin      -> platform-level actions (create pages, assign
                               admins, platform config, oversight)
    require_page_admin      -> actions on ONE page, by someone the platform
                               assigned to it (or any Main Admin)
    get_current_active_user -> user-owned actions (own profile, own follows)

Critically, `require_page_admin` resolves the page from the PATH parameter and
verifies membership in the `page_admins` table against the JWT-derived user.
Nothing is read from the request body, and nothing is taken on trust from the
client.
"""

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_active_user
from models.enums import UserRole
from models.user import User
from models.page import Page, PageAdmin


# ---------------------------------------------------------------------------
# Role tier
# ---------------------------------------------------------------------------

async def require_main_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """Platform administrator. The only tier that may create pages, assign page
    admins, or reach across institute boundaries."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Main Admin access required",
        )
    return current_user


def is_main_admin(user: User) -> bool:
    return user.role == UserRole.ADMIN


# ---------------------------------------------------------------------------
# Page ownership
# ---------------------------------------------------------------------------

async def user_administers_page(db: AsyncSession, user: User, page_id: str) -> bool:
    """The authoritative answer to 'is this user an administrator of this
    page?' — a database relationship check, never a slug or email comparison
    performed in the browser."""
    if is_main_admin(user):
        return True
    result = await db.execute(
        select(PageAdmin.id).where(
            (PageAdmin.page_id == page_id),
            PageAdmin.user_id == user.id,
        )
    )
    return result.scalars().first() is not None


async def load_page_or_404(db: AsyncSession, page_id: str) -> Page:
    page = (await db.execute(select(Page).where(Page.id == page_id))).scalars().first()
    if page is None:
        page = (await db.execute(select(Page).where(Page.slug == page_id))).scalars().first()
    if page is None:
        from models.institute import Institute
        inst = (await db.execute(select(Institute).where(Institute.id == page_id))).scalars().first()
        if inst:
            page_admin = (await db.execute(select(PageAdmin).where(PageAdmin.user_id == inst.user_id))).scalars().first()
            if page_admin:
                page = (await db.execute(select(Page).where(Page.id == page_admin.page_id))).scalars().first()
            if page is None:
                page = (await db.execute(select(Page).where(func.lower(Page.name) == inst.name.lower()))).scalars().first()
            if page is None:
                import re
                base_slug = re.sub(r"[^a-z0-9]+", "-", inst.name.lower()).strip("-") or f"inst-{inst.id[:6]}"
                page = Page(
                    id=inst.id,
                    name=inst.name,
                    slug=base_slug,
                    type="Coaching",
                    address=getattr(inst, "address", None),
                    city=inst.city,
                    state=inst.state,
                    website=inst.website,
                    contact=inst.phone,
                    about=inst.about,
                    banners=[], gallery=[], social_links={}, content={},
                )
                db.add(page)
                db.add(PageAdmin(page_id=page.id, user_id=inst.user_id, role="OWNER"))
                await db.commit()
                await db.refresh(page)

    if page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


async def require_page_admin(
    page_id: str = Path(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Page:
    """Guard for every write to page-owned content."""
    page = await load_page_or_404(db, page_id)
    if not await user_administers_page(db, current_user, page.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not administer this institute",
        )
    return page



async def require_page_owner(
    page_id: str = Path(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Page:
    """Stricter variant for destructive actions on the page itself. A plain
    ADMIN of the page cannot delete it or remove its OWNER; only the page's
    OWNER or a Main Admin can."""
    page = await load_page_or_404(db, page_id)
    if is_main_admin(current_user):
        return page
    membership = (
        await db.execute(
            select(PageAdmin).where(
                PageAdmin.page_id == page_id,
                PageAdmin.user_id == current_user.id,
            )
        )
    ).scalars().first()
    if membership is None or membership.role != "OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Page owner access required",
        )
    return page


# ---------------------------------------------------------------------------
# Child-resource ownership
# ---------------------------------------------------------------------------

def assert_belongs_to_page(resource, page_id: str, label: str = "Resource") -> None:
    """Guards against a caller pairing a page they *do* administer with a child
    resource belonging to a page they do not.

    Without this, `PATCH /pages/{my_page}/courses/{someone_elses_course}` would
    pass the page-admin check and then happily edit the wrong institute's
    course. 404 rather than 403: from this page's perspective that resource
    simply does not exist.
    """
    if resource is None or resource.page_id != page_id:
        raise HTTPException(status_code=404, detail=f"{label} not found on this institute")


async def pages_administered_by(db: AsyncSession, user: User) -> list[Page]:
    """Every page the user may administer — backs the Institute Console's page
    switcher and its 'you administer nothing' empty state."""
    if is_main_admin(user):
        return list((await db.execute(select(Page).order_by(Page.name))).scalars().all())
    result = await db.execute(
        select(Page)
        .join(PageAdmin, PageAdmin.page_id == Page.id)
        .where(PageAdmin.user_id == user.id)
        .order_by(Page.name)
    )
    return list(result.scalars().all())


async def follower_count(db: AsyncSession, page_id: str) -> int:
    from models.social import Follow

    return int(
        (await db.execute(select(func.count(Follow.id)).where(Follow.page_id == page_id))).scalar() or 0
    )
