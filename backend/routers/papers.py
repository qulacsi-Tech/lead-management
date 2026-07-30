from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from core.database import get_db
from core.deps import get_current_active_user, require_roles
from models.user import User
from models.enums import UserRole
from models.mentor import Mentor
from models.student import Student
from models.paper import (
    Paper, Question, PaperAttempt,
    PaperCreate, PaperUpdate, PaperListResponse, PaperDetailResponse,
    AttemptSubmit, AttemptResult,
)

router = APIRouter(prefix="/papers", tags=["Papers"])

require_mentor = require_roles(UserRole.MENTOR)
require_student = require_roles(UserRole.STUDENT)


async def _get_mentor_profile(db: AsyncSession, user: User) -> Mentor:
    result = await db.execute(select(Mentor).where(Mentor.user_id == user.id))
    mentor = result.scalars().first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor profile not found")
    return mentor


async def _get_student_profile(db: AsyncSession, user: User) -> Student:
    result = await db.execute(select(Student).where(Student.user_id == user.id))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


async def _get_paper_or_404(db: AsyncSession, paper_id: str) -> Paper:
    result = await db.execute(
        select(Paper).options(selectinload(Paper.questions)).where(Paper.id == paper_id)
    )
    paper = result.scalars().first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


def _to_list_response(paper: Paper, mentor_name: Optional[str] = None) -> PaperListResponse:
    return PaperListResponse(
        id=paper.id,
        mentor_id=paper.mentor_id,
        mentor_name=mentor_name,
        title=paper.title,
        subject=paper.subject,
        target_class=paper.target_class,
        description=paper.description,
        status=paper.status,
        downloads=paper.downloads,
        likes=paper.likes,
        question_count=len(paper.questions) if paper.questions is not None else 0,
        created_at=paper.created_at,
    )


@router.get("", response_model=list[PaperListResponse])
async def list_papers(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_active_user),
    subject: Optional[str] = None,
    target_class: Optional[str] = None,
    mentor_id: Optional[str] = None,
    search: Optional[str] = Query(None),
):
    query = select(Paper).options(selectinload(Paper.questions)).where(Paper.status == "published")
    if mentor_id:
        query = query.where(Paper.mentor_id == mentor_id)
    if subject:
        query = query.where(Paper.subject == subject)
    if target_class:
        query = query.where(Paper.target_class == target_class)
    if search:
        query = query.where(Paper.title.ilike(f"%{search}%"))
    query = query.order_by(Paper.created_at.desc())

    result = await db.execute(query)
    papers = result.scalars().all()

    mentor_ids = {p.mentor_id for p in papers}
    mentor_names = {}
    if mentor_ids:
        m_result = await db.execute(select(Mentor).where(Mentor.id.in_(mentor_ids)))
        mentor_names = {m.id: m.name for m in m_result.scalars().all()}

    return [_to_list_response(p, mentor_names.get(p.mentor_id)) for p in papers]


@router.get("/attempts/me", response_model=list[AttemptResult])
async def list_my_attempts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    student = await _get_student_profile(db, current_user)
    result = await db.execute(
        select(PaperAttempt)
        .where(PaperAttempt.student_id == student.id)
        .order_by(PaperAttempt.submitted_at.desc())
    )
    return result.scalars().all()


@router.get("/mentor/me", response_model=list[PaperListResponse])
async def list_my_papers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mentor),
):
    mentor = await _get_mentor_profile(db, current_user)
    result = await db.execute(
        select(Paper).options(selectinload(Paper.questions))
        .where(Paper.mentor_id == mentor.id)
        .order_by(Paper.created_at.desc())
    )
    papers = result.scalars().all()
    return [_to_list_response(p, mentor.name) for p in papers]


@router.get("/{paper_id}", response_model=PaperDetailResponse)
async def get_paper(
    paper_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_active_user),
):
    paper = await _get_paper_or_404(db, paper_id)
    m_result = await db.execute(select(Mentor).where(Mentor.id == paper.mentor_id))
    mentor = m_result.scalars().first()
    resp = PaperDetailResponse.model_validate(paper)
    resp.mentor_name = mentor.name if mentor else None
    return resp


@router.post("", response_model=PaperDetailResponse, status_code=201)
async def create_paper(
    payload: PaperCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mentor),
):
    mentor = await _get_mentor_profile(db, current_user)

    paper = Paper(
        mentor_id=mentor.id,
        title=payload.title,
        subject=payload.subject,
        target_class=payload.target_class,
        description=payload.description,
        status=payload.status or "published",
    )
    db.add(paper)
    await db.flush()

    for idx, q in enumerate(payload.questions):
        db.add(Question(
            paper_id=paper.id,
            question_text=q.question_text,
            options=q.options,
            correct_answer=q.correct_answer,
            order=idx,
        ))

    await db.commit()
    paper = await _get_paper_or_404(db, paper.id)
    resp = PaperDetailResponse.model_validate(paper)
    resp.mentor_name = mentor.name
    return resp


@router.put("/{paper_id}", response_model=PaperDetailResponse)
async def update_paper(
    paper_id: str,
    payload: PaperUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mentor),
):
    mentor = await _get_mentor_profile(db, current_user)
    paper = await _get_paper_or_404(db, paper_id)
    if paper.mentor_id != mentor.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    updates = payload.model_dump(exclude_none=True, exclude={"questions"})
    for field, value in updates.items():
        setattr(paper, field, value)

    if payload.questions is not None:
        for existing in list(paper.questions):
            await db.delete(existing)
        await db.flush()
        for idx, q in enumerate(payload.questions):
            db.add(Question(
                paper_id=paper.id,
                question_text=q.question_text,
                options=q.options,
                correct_answer=q.correct_answer,
                order=idx,
            ))

    await db.commit()
    paper = await _get_paper_or_404(db, paper_id)
    resp = PaperDetailResponse.model_validate(paper)
    resp.mentor_name = mentor.name
    return resp


@router.delete("/{paper_id}", status_code=204)
async def delete_paper(
    paper_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mentor),
):
    mentor = await _get_mentor_profile(db, current_user)
    paper = await _get_paper_or_404(db, paper_id)
    if paper.mentor_id != mentor.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    await db.delete(paper)
    await db.commit()


@router.post("/{paper_id}/attempt", response_model=AttemptResult, status_code=201)
async def submit_attempt(
    paper_id: str,
    payload: AttemptSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    student = await _get_student_profile(db, current_user)
    paper = await _get_paper_or_404(db, paper_id)

    questions = sorted(paper.questions, key=lambda q: q.order)
    score = sum(
        1 for i, q in enumerate(questions)
        if i < len(payload.answers) and payload.answers[i] == q.correct_answer
    )

    attempt = PaperAttempt(
        paper_id=paper.id,
        student_id=student.id,
        score=score,
        total=len(questions),
        answers=payload.answers,
    )
    db.add(attempt)
    paper.downloads = (paper.downloads or 0) + 1
    await db.commit()
    await db.refresh(attempt)
    return attempt
