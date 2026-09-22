"""
Opportunity application endpoints.

Client feedback 22 Sep 2026, row 5: "Apply Details - When the user clicks on
'Apply' we should not redirect them to any other page, our task is to ensure
that if the user is new they should be able to create their profile here
itself."

That requirement is what shapes `apply` below. Submitting is open to anyone,
and an applicant without an account gets one minted in the same request, with
an access token returned so the browser can sign them in without navigating
away. Reading and working an application is restricted to the receiving
institute's admins — the same asymmetry as routers/page_enquiries.py.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_optional_user
from core.authz import require_page_admin, assert_belongs_to_page
from core.security import get_password_hash, create_access_token
from models.user import User, UserResponse
from models.enums import UserRole
from models.page import Page, PageAdmin
from models.opportunity import Opportunity
from models.social import Notification
from models.application import (
    OpportunityApplication,
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApplicationSubmitResponse,
    APPLICATION_STATUSES,
)

router = APIRouter(prefix="/opportunities/{opportunity_id}/applications", tags=["Applications"])
page_router = APIRouter(prefix="/pages/{page_id}/applications", tags=["Applications"])


@router.post("", response_model=ApplicationSubmitResponse, status_code=status.HTTP_201_CREATED)
async def apply(
    opportunity_id: str,
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Apply to an admission notice or a job vacancy, without leaving the page.

    Three cases, in order:
      - signed in                     -> apply as that user
      - new email + password supplied -> create the profile, apply, return a token
      - existing email, not signed in -> 409, so the dialog can offer sign-in
                                         rather than silently applying as
                                         someone who has not authenticated
    """
    opportunity = (
        await db.execute(select(Opportunity).where(Opportunity.id == opportunity_id))
    ).scalars().first()
    if opportunity is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Only a live ad accepts applications. A Draft, Expired or Closed one is
    # not something a visitor could legitimately have been looking at.
    if opportunity.status != "Published":
        raise HTTPException(status_code=400, detail="This opportunity is no longer accepting applications")

    page = (await db.execute(select(Page).where(Page.id == opportunity.page_id))).scalars().first()
    if page is None or not page.is_enabled:
        raise HTTPException(status_code=404, detail="Institute page not found")

    account_created = False
    access_token = None
    user = current_user

    if user is None:
        if not payload.email or not payload.name:
            raise HTTPException(status_code=422, detail="Name and email are required to apply")

        existing = (
            await db.execute(select(User).where(User.email == payload.email))
        ).scalars().first()
        if existing is not None:
            raise HTTPException(
                status_code=409,
                detail="An account already exists for this email. Please sign in to apply.",
            )
        if not payload.password:
            raise HTTPException(status_code=422, detail="Choose a password to create your profile")

        # The profile is created here rather than by redirecting to /signup —
        # that redirect is precisely what the client asked us to remove.
        user = User(
            email=payload.email,
            name=payload.name,
            phone=payload.phone,
            hashed_password=get_password_hash(payload.password),
            # An applicant to a vacancy is a teaching professional; an
            # applicant to an admission notice is a student. Deriving it from
            # the ad means the inline form does not have to ask.
            role=UserRole.PROFESSIONAL if opportunity.type == "job" else UserRole.STUDENT,
        )
        db.add(user)
        await db.flush()
        account_created = True
        access_token = create_access_token(data={"sub": user.email, "role": user.role})

    duplicate = (
        await db.execute(
            select(OpportunityApplication).where(
                OpportunityApplication.opportunity_id == opportunity_id,
                OpportunityApplication.user_id == user.id,
            )
        )
    ).scalars().first()
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="You have already applied to this post")

    application = OpportunityApplication(
        opportunity_id=opportunity_id,
        page_id=opportunity.page_id,
        user_id=user.id,
        # Fall back to the account's own details so a signed-in applicant can
        # apply in one click with an empty payload.
        name=payload.name or user.name or user.email,
        email=payload.email or user.email,
        phone=payload.phone or user.phone,
        city=payload.city,
        state=payload.state,
        qualification=payload.qualification,
        experience=payload.experience,
        current_institute=payload.current_institute,
        resume_url=payload.resume_url,
        message=payload.message,
    )
    db.add(application)
    await db.flush()

    admin_ids = (
        await db.execute(select(PageAdmin.user_id).where(PageAdmin.page_id == opportunity.page_id))
    ).scalars().all()
    for uid in admin_ids:
        db.add(Notification(
            user_id=uid,
            type="application_received",
            title=f"New application for {opportunity.title}",
            message=f"{application.name} applied to your {'vacancy' if opportunity.type == 'job' else 'admission notice'}",
            ref_type="opportunity_application", ref_id=application.id,
            payload={"page_slug": page.slug, "opportunity_id": opportunity_id},
        ))

    await db.commit()
    await db.refresh(application)
    return ApplicationSubmitResponse(
        application=ApplicationResponse.model_validate(application),
        access_token=access_token,
        user=UserResponse.model_validate(user) if account_created else None,
        account_created=account_created,
    )


@router.get("/mine", response_model=Optional[ApplicationResponse])
async def my_application(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Has the caller already applied? Lets the Apply button render as
    "Applied" instead of failing on submit. Anonymous callers get null."""
    if current_user is None:
        return None
    return (
        await db.execute(
            select(OpportunityApplication).where(
                OpportunityApplication.opportunity_id == opportunity_id,
                OpportunityApplication.user_id == current_user.id,
            )
        )
    ).scalars().first()


@page_router.get("", response_model=List[ApplicationResponse])
async def list_page_applications(
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
    opportunity_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """INSTITUTE-OWNED. An institute sees only applications made to its own ads."""
    stmt = select(OpportunityApplication).where(OpportunityApplication.page_id == page.id)
    if opportunity_id:
        stmt = stmt.where(OpportunityApplication.opportunity_id == opportunity_id)
    if status_filter:
        stmt = stmt.where(OpportunityApplication.status == status_filter)
    return list(
        (await db.execute(stmt.order_by(OpportunityApplication.created_at.desc()))).scalars().all()
    )


@page_router.patch("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: str,
    payload: ApplicationUpdate,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    application = (
        await db.execute(
            select(OpportunityApplication).where(OpportunityApplication.id == application_id)
        )
    ).scalars().first()
    assert_belongs_to_page(application, page.id, "Application")

    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in APPLICATION_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {APPLICATION_STATUSES}")

    for field, value in data.items():
        setattr(application, field, value)

    await db.commit()
    await db.refresh(application)
    return application
