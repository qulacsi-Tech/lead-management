"""
USER-owned endpoints: Follow relationships and Notifications.

The defining rule for both: the acting user always comes from the JWT. There is
no endpoint here that accepts a user_id in the body, so nobody can follow a
page on someone else's behalf or read another person's notifications.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_active_user
from core.authz import follower_count
from models.user import User
from models.page import Page, PageResponse
from models.social import Follow, Notification, FollowResponse, NotificationResponse

follow_router = APIRouter(prefix="/follows", tags=["Network"])
notification_router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ---------------------------------------------------------------------------
# Follows
# ---------------------------------------------------------------------------

@follow_router.get("", response_model=List[PageResponse])
async def list_followed_pages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Page).join(Follow, Follow.page_id == Page.id).where(Follow.user_id == current_user.id)
    )
    return list(result.scalars().all())


@follow_router.post("/{page_id}", response_model=FollowResponse, status_code=status.HTTP_201_CREATED)
async def follow_page(
    page_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    page = (await db.execute(select(Page).where(Page.id == page_id))).scalars().first()
    if page is None or not page.is_enabled:
        raise HTTPException(status_code=404, detail="Institute page not found")

    existing = (
        await db.execute(
            select(Follow).where(Follow.user_id == current_user.id, Follow.page_id == page_id)
        )
    ).scalars().first()
    if not existing:
        db.add(Follow(user_id=current_user.id, page_id=page_id))
        await db.commit()

    return FollowResponse(
        page_id=page_id, is_following=True, followers_count=await follower_count(db, page_id)
    )


@follow_router.delete("/{page_id}", response_model=FollowResponse)
async def unfollow_page(
    page_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    existing = (
        await db.execute(
            select(Follow).where(Follow.user_id == current_user.id, Follow.page_id == page_id)
        )
    ).scalars().first()
    if existing:
        await db.delete(existing)
        await db.commit()

    return FollowResponse(
        page_id=page_id, is_following=False, followers_count=await follower_count(db, page_id)
    )


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

@notification_router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    unread_only: bool = Query(False),
    limit: int = Query(30, le=100),
):
    stmt = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))
    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
    return list((await db.execute(stmt)).scalars().all())


@notification_router.get("/unread-count")
async def unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    count = (
        await db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == current_user.id, Notification.is_read.is_(False)
            )
        )
    ).scalar() or 0
    return {"unread": int(count)}


@notification_router.post("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    notification = (
        await db.execute(select(Notification).where(Notification.id == notification_id))
    ).scalars().first()
    # Scoped to the caller: another user's notification is simply "not found".
    if notification is None or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification


@notification_router.post("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == current_user.id, Notification.is_read.is_(False)
        )
    )
    rows = list(result.scalars().all())
    for n in rows:
        n.is_read = True
    await db.commit()
    return {"marked_read": len(rows)}
