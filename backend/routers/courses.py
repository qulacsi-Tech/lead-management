"""
Course endpoints — INSTITUTE-owned, nested under their page.

The nesting is deliberate: every route carries the page_id in its path, so
`require_page_admin` can authorize before the handler runs. The course's own
page_id is then re-checked against the path via `assert_belongs_to_page`, which
closes the "page I own + course I don't" pairing.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_optional_user
from core.authz import require_page_admin, assert_belongs_to_page, user_administers_page
from models.user import User
from models.page import Page
from models.course import Course, CourseCreate, CourseUpdate, CourseResponse, COURSE_STATUSES

router = APIRouter(prefix="/pages/{page_id}/courses", tags=["Courses"])


async def _load_course(db: AsyncSession, course_id: str) -> Optional[Course]:
    return (await db.execute(select(Course).where(Course.id == course_id))).scalars().first()


@router.get("", response_model=List[CourseResponse])
async def list_courses(
    page_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """Readable by anyone, but Draft courses are only returned to people who
    administer the page — the publish/unpublish distinction is enforced here,
    not left to the client to respect."""
    page = (await db.execute(select(Page).where(Page.id == page_id))).scalars().first()
    if page is None:
        raise HTTPException(status_code=404, detail="Page not found")

    can_see_drafts = (
        await user_administers_page(db, current_user, page_id) if current_user else False
    )

    stmt = select(Course).where(Course.page_id == page_id)
    if not can_see_drafts:
        stmt = stmt.where(Course.status == "Published")
    elif status_filter:
        stmt = stmt.where(Course.status == status_filter)

    return list((await db.execute(stmt.order_by(Course.created_at))).scalars().all())


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreate,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    if payload.status not in COURSE_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {COURSE_STATUSES}")

    # page_id comes from the authorized Page object, never from the payload —
    # a client cannot create a course on an institute it doesn't administer.
    course = Course(page_id=page.id, **payload.model_dump())
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    page_id: str,
    course_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    course = await _load_course(db, course_id)
    assert_belongs_to_page(course, page_id, "Course")

    if course.status != "Published":
        allowed = await user_administers_page(db, current_user, page_id) if current_user else False
        if not allowed:
            raise HTTPException(status_code=404, detail="Course not found on this institute")
    return course


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    payload: CourseUpdate,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    course = await _load_course(db, course_id)
    assert_belongs_to_page(course, page.id, "Course")

    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in COURSE_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {COURSE_STATUSES}")

    for field, value in data.items():
        setattr(course, field, value)

    await db.commit()
    await db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: str,
    page: Page = Depends(require_page_admin),
    db: AsyncSession = Depends(get_db),
):
    course = await _load_course(db, course_id)
    assert_belongs_to_page(course, page.id, "Course")
    await db.delete(course)
    await db.commit()
