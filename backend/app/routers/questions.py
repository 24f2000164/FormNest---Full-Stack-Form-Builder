from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/forms/{form_id}/questions", tags=["questions"])


@router.post("", response_model=schemas.QuestionRead, status_code=201)
def create_question(form_id: int, payload: schemas.QuestionCreate, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    max_order = db.query(models.Question).filter(
        models.Question.form_id == form_id
    ).count()

    question = models.Question(
        form_id=form_id,
        type=payload.type,
        title=payload.title or "",
        description=payload.description,
        required=payload.required or False,
        order_index=max_order,
        options=payload.options,
        settings=payload.settings,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}", status_code=204)
def delete_question(form_id: int, question_id: int, db: Session = Depends(get_db)):
    q = db.query(models.Question).filter(
        models.Question.id == question_id, models.Question.form_id == form_id
    ).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return None


@router.patch("/{question_id}", response_model=schemas.QuestionRead)
def update_question(form_id: int, question_id: int, payload: schemas.QuestionUpdate, db: Session = Depends(get_db)):
    q = db.query(models.Question).filter(
        models.Question.id == question_id, models.Question.form_id == form_id
    ).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    if payload.title is not None:
        q.title = payload.title
    if payload.description is not None:
        q.description = payload.description
    if payload.required is not None:
        q.required = payload.required
    if payload.options is not None:
        q.options = payload.options
    if payload.settings is not None:
        q.settings = payload.settings

    db.commit()
    db.refresh(q)
    return q