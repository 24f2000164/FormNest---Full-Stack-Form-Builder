import os
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/forms", tags=["share"])

# Used only as a fallback for the `public_url` field returned by the API.
# The frontend always recomputes the link from window.location.origin so it
# reflects whatever host the app is actually running on; this env var just
# keeps the API response self-contained (e.g. for tests/curl).
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")

# Public link slugs: lowercase letters, digits, and hyphens only. No leading/
# trailing/double hyphens, matching Typeform-style custom links.
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def _to_share_info(form: models.Form) -> schemas.ShareInfo:
    return schemas.ShareInfo(
        id=form.id,
        title=form.title,
        description=form.description,
        slug=form.slug,
        status=form.status,
        public_url=f"{FRONTEND_BASE_URL}/f/{form.slug}",
        published_at=form.published_at,
    )


def _get_form_or_404(form_id: int, db: Session) -> models.Form:
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.get("/{form_id}/share", response_model=schemas.ShareInfo)
def get_share_info(form_id: int, db: Session = Depends(get_db)):
    """Everything the Share page needs to render: slug, public URL, and
    publish state. Read-only - does not change the form."""
    form = _get_form_or_404(form_id, db)
    return _to_share_info(form)


@router.patch("/{form_id}/slug", response_model=schemas.ShareInfo)
def update_slug(form_id: int, payload: schemas.SlugUpdate, db: Session = Depends(get_db)):
    """Renames a form's public-link slug. Rejects anything but lowercase
    letters/digits/hyphens, and rejects slugs already used by another form."""
    form = _get_form_or_404(form_id, db)

    new_slug = payload.slug.strip()
    if not SLUG_PATTERN.match(new_slug):
        raise HTTPException(
            status_code=422,
            detail="Slug can only contain lowercase letters, numbers, and hyphens.",
        )

    existing = (
        db.query(models.Form)
        .filter(models.Form.slug == new_slug, models.Form.id != form_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="This link is already taken.")

    form.slug = new_slug
    db.commit()
    db.refresh(form)
    return _to_share_info(form)
