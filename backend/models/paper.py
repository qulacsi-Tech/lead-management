from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, Any, List
from core.database import Base
import uuid


# --- SQLAlchemy Models ---
class Paper(Base):
    __tablename__ = "papers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    mentor_id = Column(String, ForeignKey("mentors.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    target_class = Column(String)
    description = Column(Text)
    status = Column(String, default="published")  # draft | published
    downloads = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    questions = relationship("Question", back_populates="paper", cascade="all, delete-orphan", order_by="Question.order")


class Question(Base):
    __tablename__ = "paper_questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String, ForeignKey("papers.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # list[str]
    correct_answer = Column(Integer, nullable=False)  # index into options
    order = Column(Integer, default=0)

    paper = relationship("Paper", back_populates="questions")


class PaperAttempt(Base):
    __tablename__ = "paper_attempts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String, ForeignKey("papers.id"), nullable=False, index=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False, index=True)
    score = Column(Integer, nullable=False)
    total = Column(Integer, nullable=False)
    answers = Column(JSON)  # list[int]
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())


# --- Pydantic Schemas ---
class QuestionIn(BaseModel):
    question_text: str
    options: List[str]
    correct_answer: int


class QuestionResponse(BaseModel):
    id: str
    question_text: str
    options: List[Any]
    order: int

    class Config:
        from_attributes = True


class QuestionWithAnswerResponse(QuestionResponse):
    correct_answer: int


class PaperCreate(BaseModel):
    title: str
    subject: str
    target_class: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "published"
    questions: List[QuestionIn] = []


class PaperUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    target_class: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    questions: Optional[List[QuestionIn]] = None


class PaperListResponse(BaseModel):
    id: str
    mentor_id: str
    mentor_name: Optional[str] = None
    title: str
    subject: str
    target_class: Optional[str] = None
    description: Optional[str] = None
    status: str
    downloads: int
    likes: int
    question_count: int = 0
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True


class PaperDetailResponse(BaseModel):
    id: str
    mentor_id: str
    mentor_name: Optional[str] = None
    title: str
    subject: str
    target_class: Optional[str] = None
    description: Optional[str] = None
    status: str
    downloads: int
    likes: int
    created_at: Optional[Any] = None
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True


class AttemptSubmit(BaseModel):
    answers: List[int]


class AttemptResult(BaseModel):
    id: str
    paper_id: str
    score: int
    total: int
    submitted_at: Optional[Any] = None

    class Config:
        from_attributes = True
