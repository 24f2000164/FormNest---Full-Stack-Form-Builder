from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/forms", tags=["forms"])


class FormMovePayload(BaseModel):
    workspace_id: int


class FormCopyPayload(BaseModel):
    workspace_id: int


@router.post("", response_model=schemas.FormRead, status_code=201)
def create_form(payload: schemas.FormCreate, db: Session = Depends(get_db)):
    """Creates a new blank draft form, assigned to the selected workspace."""
    ws_id = payload.workspace_id
    if not ws_id:
        default_ws = db.query(models.Workspace).order_by(models.Workspace.id.asc()).first()
        if default_ws:
            ws_id = default_ws.id
        else:
            default_ws = models.Workspace(name="My workspace", owner_id=1)
            db.add(default_ws)
            db.flush()
            ws_id = default_ws.id

    form = models.Form(
        creator_id=1,
        title=payload.title or "New form",
        description=payload.description,
        status="draft",
        workspace_id=ws_id
    )
    db.add(form)
    db.commit()
    db.refresh(form)
    return form


@router.get("", response_model=list[schemas.FormSummary])
def list_forms(db: Session = Depends(get_db)):
    """Dashboard list: title, status, response count, updated date."""
    forms = db.query(models.Form).order_by(models.Form.updated_at.desc()).all()
    result = []
    for f in forms:
        count = db.query(func.count(models.Response.id)).filter(
            models.Response.form_id == f.id
        ).scalar()
        
        # Calculate completion rate
        completed_count = db.query(func.count(models.Response.id)).filter(
            models.Response.form_id == f.id,
            models.Response.completed == True
        ).scalar()
        started_count = db.query(func.count(models.FormView.id)).filter(
            models.FormView.form_id == f.id,
            models.FormView.started_at.isnot(None)
        ).scalar()
        
        if count > 0 and started_count == 0:
            completion_rate = 100.0
        else:
            completion_rate = round((completed_count / started_count * 100), 1) if started_count > 0 else 0.0

        result.append(schemas.FormSummary(
            id=f.id, title=f.title, status=f.status,
            response_count=count, updated_at=f.updated_at,
            workspace_id=f.workspace_id,
            completion_rate=completion_rate,
            slug=f.slug
        ))
    return result


@router.get("/{form_id}", response_model=schemas.FormRead)
def get_form(form_id: int, db: Session = Depends(get_db)):
    """Loads a form with its questions, for the Builder."""
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.patch("/{form_id}", response_model=schemas.FormRead)
def update_form(form_id: int, payload: schemas.FormUpdate, db: Session = Depends(get_db)):
    """Rename / edit description / change workspace."""
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if payload.title is not None:
        form.title = payload.title
    if payload.description is not None:
        form.description = payload.description
    if payload.settings is not None:
        form.settings = payload.settings
    if payload.workspace_id is not None:
        ws = db.query(models.Workspace).filter(models.Workspace.id == payload.workspace_id).first()
        if not ws:
            raise HTTPException(status_code=404, detail="Workspace not found")
        form.workspace_id = payload.workspace_id
    db.commit()
    db.refresh(form)
    return form


@router.delete("/{form_id}", status_code=204)
def delete_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    db.delete(form)
    db.commit()
    return None


@router.post("/{form_id}/duplicate", response_model=schemas.FormRead, status_code=201)
def duplicate_form(form_id: int, db: Session = Depends(get_db)):
    source = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Form not found")

    new_form = models.Form(
        creator_id=1, title=f"{source.title} (Copy)",
        description=source.description, status="draft",
        workspace_id=source.workspace_id, settings=source.settings
    )
    db.add(new_form)
    db.flush()  # get new_form.id before commit

    for q in source.questions:
        db.add(models.Question(
            form_id=new_form.id, type=q.type, title=q.title,
            description=q.description, required=q.required,
            order_index=q.order_index, options=q.options, settings=q.settings,
        ))
    db.commit()
    db.refresh(new_form)
    return new_form


@router.post("/{form_id}/publish", response_model=schemas.FormRead)
def publish_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if not form.questions:
        raise HTTPException(status_code=422, detail="Form must have at least one question to publish")
    form.status = "published"
    if not form.published_at:
        form.published_at = datetime.utcnow()
    db.commit()
    db.refresh(form)
    return form


@router.post("/{form_id}/unpublish", response_model=schemas.FormRead)
def unpublish_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    form.status = "draft"
    db.commit()
    db.refresh(form)
    return form


@router.post("/{form_id}/questions/reorder", response_model=List[schemas.QuestionRead])
def reorder_questions(form_id: int, payload: list[int], db: Session = Depends(get_db)):
    """Reorder questions for a form. Expects a list of question IDs in the new order."""
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    # Update order_index based on position in the list
    for index, question_id in enumerate(payload):
        question = db.query(models.Question).filter(
            models.Question.id == question_id,
            models.Question.form_id == form_id
        ).first()
        if question:
            question.order_index = index
    db.commit()
    # Return updated questions ordered by order_index
    questions = db.query(models.Question).filter(models.Question.form_id == form_id).order_by(models.Question.order_index).all()
    return questions


@router.get("/slug/{slug}", response_model=schemas.FormRead)
def get_form_by_slug(slug: str, db: Session = Depends(get_db)):
    """Public endpoint to retrieve a form by its slug (for respondent flow)."""
    form = db.query(models.Form).filter(models.Form.slug == slug).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.post("/{form_id}/move")
@router.patch("/{form_id}/move")
@router.route("/{form_id}/workspace", methods=["MOVE", "POST", "PATCH"])
def move_form(form_id: int, payload: FormMovePayload, db: Session = Depends(get_db)):
    """Move a form to another workspace."""
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    ws = db.query(models.Workspace).filter(models.Workspace.id == payload.workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    form.workspace_id = payload.workspace_id
    form.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "ok"}


@router.post("/{form_id}/copy", response_model=schemas.FormRead)
@router.route("/{form_id}", methods=["COPY"])
def copy_form(form_id: int, payload: FormCopyPayload, db: Session = Depends(get_db)):
    """Copy a form to another workspace."""
    source = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Form not found")
    ws = db.query(models.Workspace).filter(models.Workspace.id == payload.workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    new_form = models.Form(
        creator_id=1,
        title=f"{source.title} (Copy)",
        description=source.description,
        status="draft",
        workspace_id=payload.workspace_id
    )
    db.add(new_form)
    db.flush()

    for q in source.questions:
        db.add(models.Question(
            form_id=new_form.id, type=q.type, title=q.title,
            description=q.description, required=q.required,
            order_index=q.order_index, options=q.options, settings=q.settings,
        ))
    db.commit()
    db.refresh(new_form)
    return new_form
