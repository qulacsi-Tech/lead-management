"""
Opportunity endpoints — Sell Leads (Admission Notices and Job Vacancies) owned
by the institute that publishes them.

Two surfaces:
  /pages/{page_id}/opportunities   management, page-admin authorized
  /opportunities                   public feed of published Sell Leads
"""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_active_user, get_optional_user
from core.authz import require_page_admin, assert_belongs_to_page, user_administers_page
from models.user import User
from models.page import Page
from models.course import Course
from models.opportunity import (
    Opportunity,
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityResponse,
    OPPORTUNITY_TYPES,
    OPPORTUNITY_STATUSES,
)
from models.social import Follow, Notification

router = APIRouter(prefix="/pages/{page_id}/opportunities", tags=["Opportunities"])
public_router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


async def _load(db: AsyncSession, opportunity_id: str) -> Optional[Opportunity]:
    return (
        await db.execute(select(Opportunity).where(Opportunity.id == opportunity_id))
    ).scalars().first()


async def _notify_followers(db: AsyncSession, page: Page, opp: Opportunity) -> None:
    """Fan out to this page's followers when a Sell Lead goes live. Persistence
    only — delivery is out of scope for Phase 2."""
    follower_ids = (
        await db.execute(select(Follow.user_id).where(Follow.page_id == page.id))
    ).scalars().all()
    label = "Admission Notice" if opp.type == "admission" else "Job Vacancy"
    for uid in follower_ids:
        db.add(Notification(
            user_id=uid,
            type="page_opportunity",
            title=f"{page.name} posted a new {label}",
            message=opp.title,
            ref_type="opportunity", ref_id=opp.id,
            payload={"page_slug": page.slug, "opportunity_type": opp.type},
        ))


# ---------------------------------------------------------------------------
# Management (page-scoped)
# ---------------------------------------------------------------------------

@router.get("", response_model=List[OpportunityResponse])
async def list_opportunities(
    page_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    type_filter: Optional[str] = Query(None, alias="type"),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """Non-admins only ever see Published items, whatever they ask for."""
    page = (await db.execute(select(Page).where(Page.id == page_id))).scalars().first()
    if page is None:
        raise HTTPException(status_code=404, detail="Page not found")

    is_admin_here = (
        await user_administers_page(db, current_user, page_id) if current_user else False
    )

    stmt = select(Opportunity).where(Opportunity.page_id == page_id)
    if type_filter:
        stmt = stmt.where(Opportunity.type == type_filter)
    if not is_admin_here:
        stmt = stmt.where(Opportunity.status == "Published")
    elif status_filter:
        stmt = stmt.where(Opportunity.status == status_filter)

    return list((await db.execute(stmt.order_by(Opportunity.ranking, Opportunity.created_at.desc()))).scalars().all())


@router.post("", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    payload: OpportunityCreate,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if payload.type not in OPPORTUNITY_TYPES:
        raise HTTPException(status_code=422, detail=f"type must be one of {OPPORTUNITY_TYPES}")
    if payload.status not in OPPORTUNITY_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {OPPORTUNITY_STATUSES}")

    # A linked course must belong to this same institute.
    if payload.course_id:
        course = (
            await db.execute(select(Course).where(Course.id == payload.course_id))
        ).scalars().first()
        assert_belongs_to_page(course, page.id, "Course")

    next_rank = ((await db.execute(
        select(func.coalesce(func.max(Opportunity.ranking), 0)).where(Opportunity.page_id == page.id)
    )).scalar() or 0) + 1

    opp = Opportunity(
        page_id=page.id,
        created_by=current_user.id,
        ranking=next_rank,
        published_at=datetime.now(timezone.utc) if payload.status == "Published" else None,
        **payload.model_dump(),
    )
    db.add(opp)
    await db.flush()

    if opp.status == "Published":
        await _notify_followers(db, page, opp)

    await db.commit()
    await db.refresh(opp)
    return opp


@router.patch("/{opportunity_id}", response_model=OpportunityResponse)
async def update_opportunity(
    opportunity_id: str,
    payload: OpportunityUpdate,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    opp = await _load(db, opportunity_id)
    assert_belongs_to_page(opp, page.id, "Opportunity")

    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in OPPORTUNITY_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {OPPORTUNITY_STATUSES}")
    if data.get("course_id"):
        course = (
            await db.execute(select(Course).where(Course.id == data["course_id"]))
        ).scalars().first()
        assert_belongs_to_page(course, page.id, "Course")

    became_published = data.get("status") == "Published" and opp.status != "Published"

    for field, value in data.items():
        setattr(opp, field, value)
    if became_published and opp.published_at is None:
        opp.published_at = datetime.now(timezone.utc)

    if became_published:
        await _notify_followers(db, page, opp)

    await db.commit()
    await db.refresh(opp)
    return opp


@router.post("/{opportunity_id}/push-to-top", response_model=List[OpportunityResponse])
async def push_to_top(
    opportunity_id: str,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    """Re-ranks within this institute only."""
    opp = await _load(db, opportunity_id)
    assert_belongs_to_page(opp, page.id, "Opportunity")

    siblings = list((await db.execute(
        select(Opportunity).where(Opportunity.page_id == page.id)
    )).scalars().all())

    target_rank = opp.ranking or len(siblings)
    for s in siblings:
        if s.id == opp.id:
            s.ranking = 1
        elif (s.ranking or 0) <= target_rank:
            s.ranking = (s.ranking or 0) + 1

    await db.commit()
    return list((await db.execute(
        select(Opportunity).where(Opportunity.page_id == page.id).order_by(Opportunity.ranking)
    )).scalars().all())


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opportunity(
    opportunity_id: str,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    opp = await _load(db, opportunity_id)
    assert_belongs_to_page(opp, page.id, "Opportunity")
    await db.delete(opp)
    await db.commit()


# ---------------------------------------------------------------------------
# Public feed
# ---------------------------------------------------------------------------

@public_router.get("", response_model=List[OpportunityResponse])
async def list_public_opportunities(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    type_filter: Optional[str] = Query(None, alias="type"),
    following_only: bool = Query(False),
    limit: int = Query(30, le=100),
    offset: int = Query(0, ge=0),
):
    """Backs the feed. Only Published opportunities on enabled pages, ever."""
    stmt = (
        select(Opportunity)
        .join(Page, Page.id == Opportunity.page_id)
        .where(Opportunity.status == "Published", Page.is_enabled.is_(True))
    )
    if type_filter:
        stmt = stmt.where(Opportunity.type == type_filter)
    if following_only:
        if not current_user:
            return []
        stmt = stmt.join(Follow, Follow.page_id == Page.id).where(Follow.user_id == current_user.id)

    stmt = stmt.order_by(Opportunity.published_at.desc().nullslast()).limit(limit).offset(offset)
    return list((await db.execute(stmt)).scalars().all())
