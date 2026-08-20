"""
Page enquiry endpoints.

Submission is open (a prospective student need not have an account); reading
and working an enquiry is restricted to the receiving institute's admins. That
asymmetry is the whole point: an enquiry is created by one party and owned,
operationally, by another.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_optional_user
from core.authz import require_page_admin, assert_belongs_to_page, require_main_admin
from models.user import User
from models.page import Page, PageAdmin
from models.course import Course
from models.page_enquiry import (
    PageEnquiry,
    PageEnquiryCreate,
    PageEnquiryUpdate,
    PageEnquiryResponse,
    ENQUIRY_STATUSES,
)
from models.social import Notification

router = APIRouter(prefix="/pages/{page_id}/enquiries", tags=["Enquiries"])
admin_router = APIRouter(prefix="/enquiries", tags=["Enquiries"])


@router.post("", response_model=PageEnquiryResponse, status_code=status.HTTP_201_CREATED)
async def submit_enquiry(
    page_id: str,
    payload: PageEnquiryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Public submission from the institute's page. Anonymous visitors are
    allowed; when the submitter is signed in we record who they were."""
    page = (await db.execute(select(Page).where(Page.id == page_id))).scalars().first()
    if page is None or not page.is_enabled:
        raise HTTPException(status_code=404, detail="Institute page not found")

    if payload.course_id:
        course = (
            await db.execute(select(Course).where(Course.id == payload.course_id))
        ).scalars().first()
        assert_belongs_to_page(course, page_id, "Course")

    enquiry = PageEnquiry(
        page_id=page_id,
        user_id=current_user.id if current_user else None,
        **payload.model_dump(),
    )
    db.add(enquiry)
    await db.flush()

    # Tell the institute's admins something arrived.
    admin_ids = (
        await db.execute(select(PageAdmin.user_id).where(PageAdmin.page_id == page_id))
    ).scalars().all()
    for uid in admin_ids:
        db.add(Notification(
            user_id=uid,
            type="enquiry_received",
            title=f"New enquiry for {page.name}",
            message=f"{payload.name} enquired about {payload.course_name or 'your institute'}",
            ref_type="page_enquiry", ref_id=enquiry.id,
            payload={"page_slug": page.slug},
        ))

    await db.commit()
    await db.refresh(enquiry)
    return enquiry


@router.get("", response_model=List[PageEnquiryResponse])
async def list_page_enquiries(
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """INSTITUTE-OWNED. An institute sees only enquiries addressed to it."""
    stmt = select(PageEnquiry).where(PageEnquiry.page_id == page.id)
    if status_filter:
        stmt = stmt.where(PageEnquiry.status == status_filter)
    return list((await db.execute(stmt.order_by(PageEnquiry.created_at.desc()))).scalars().all())


@router.patch("/{enquiry_id}", response_model=PageEnquiryResponse)
async def update_page_enquiry(
    enquiry_id: str,
    payload: PageEnquiryUpdate,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    enquiry = (
        await db.execute(select(PageEnquiry).where(PageEnquiry.id == enquiry_id))
    ).scalars().first()
    assert_belongs_to_page(enquiry, page.id, "Enquiry")

    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in ENQUIRY_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {ENQUIRY_STATUSES}")

    for field, value in data.items():
        setattr(enquiry, field, value)

    await db.commit()
    await db.refresh(enquiry)
    return enquiry


@admin_router.get("/all", response_model=List[PageEnquiryResponse])
async def list_all_enquiries(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_main_admin),
    limit: int = Query(100, le=500),
):
    """PLATFORM oversight across every institute. Read-only by design — the
    platform team does not respond to enquiries on an institute's behalf."""
    return list((await db.execute(
        select(PageEnquiry).order_by(PageEnquiry.created_at.desc()).limit(limit)
    )).scalars().all())
