import uuid
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base


def gen_slug():
    return uuid.uuid4().hex[:10]


class Creator(Base):
    __tablename__ = "creators"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, default="Default Creator")

    forms = relationship("Form", back_populates="creator")
    workspaces = relationship("Workspace", back_populates="owner")


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("creators.id"), nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("Creator", back_populates="workspaces")
    forms = relationship("Form", back_populates="workspace", cascade="all, delete-orphan")


class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=False, default=1)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    slug = Column(String, nullable=False, unique=True, index=True, default=gen_slug)
    status = Column(String, nullable=False, default="draft")  # draft | published
    published_at = Column(DateTime, nullable=True)
    settings = Column(JSON, nullable=True)  # Store form-wide rules, tags, outcomes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("Creator", back_populates="forms")
    workspace = relationship("Workspace", back_populates="forms")
    questions = relationship(
        "Question", back_populates="form",
        cascade="all, delete-orphan", order_by="Question.order_index"
    )
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")
    views = relationship("FormView", back_populates="form", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    type = Column(String, nullable=False)
    # short_text | long_text | multiple_choice | dropdown | email | number | yes_no | rating
    title = Column(String, nullable=False, default="")
    description = Column(Text, nullable=True)
    required = Column(Boolean, nullable=False, default=False)
    order_index = Column(Integer, nullable=False, default=0)
    options = Column(JSON, nullable=True)   # e.g. ["Yes","No"] or ["A","B","C"]
    settings = Column(JSON, nullable=True)  # e.g. {"max_rating": 5}

    form = relationship("Form", back_populates="questions")
    answers = relationship("Answer", back_populates="question")


class FormView(Base):
    __tablename__ = "form_views"

    id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    device = Column(String, default="other")  # desktop | mobile | tablet | other
    furthest_question_index = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    submitted_at = Column(DateTime, nullable=True)
    completion_time = Column(Integer, nullable=True)  # in seconds

    form = relationship("Form", back_populates="views")
    responses = relationship("Response", back_populates="view")


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    completed = Column(Boolean, default=False)
    view_id = Column(Integer, ForeignKey("form_views.id", ondelete="SET NULL"), nullable=True)

    form = relationship("Form", back_populates="responses")
    view = relationship("FormView", back_populates="responses")
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    response_id = Column(Integer, ForeignKey("responses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    value = Column(JSON, nullable=True)  # string, number, or list depending on type

    response = relationship("Response", back_populates="answers")
    question = relationship("Question", back_populates="answers")

