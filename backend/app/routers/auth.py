import hashlib
import secrets
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from typing import Optional

import json
import urllib.request

router = APIRouter(prefix="/auth", tags=["auth"])


def hash_password(password: str) -> str:
    """Hash password using SHA-256 for simple secure storage."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_google_token(credential: str) -> dict:
    """Verify Google ID token via Google's tokeninfo API."""
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"Google token verification error: {e}")
    return {}


def get_current_user_optional(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[models.Creator]:
    """Helper to extract user from X-User-Id or Bearer token header."""
    user_id_str = x_user_id
    if not user_id_str and authorization and authorization.startswith("Bearer "):
        user_id_str = authorization.replace("Bearer ", "").strip()
    
    if user_id_str:
        try:
            uid = int(user_id_str)
            user = db.query(models.Creator).filter(models.Creator.id == uid).first()
            if user:
                return user
        except ValueError:
            pass
    return None


@router.post("/signup", response_model=schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user and auto-create a default workspace for them."""
    email_clean = payload.email.strip().lower()
    name_clean = payload.name.strip()
    
    if not email_clean or not name_clean:
        raise HTTPException(status_code=400, detail="Name and email are required.")
        
    # Check if user already exists
    existing = db.query(models.Creator).filter(
        func.lower(models.Creator.email) == email_clean
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
    # Create new Creator/User
    pw_hash = hash_password(payload.password)
    user = models.Creator(
        name=name_clean,
        email=email_clean,
        password_hash=pw_hash
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically create a default "My workspace" for this user
    workspace = models.Workspace(
        name="My workspace",
        owner_id=user.id
    )
    db.add(workspace)
    db.commit()

    return schemas.AuthResponse(
        status="success",
        user=schemas.UserRead(id=user.id, name=user.name, email=user.email),
        token=str(user.id)
    )


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with email & password."""
    email_clean = payload.email.strip().lower()
    user = db.query(models.Creator).filter(
        func.lower(models.Creator.email) == email_clean
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Check password match
    pw_hash = hash_password(payload.password)
    if user.password_hash and user.password_hash != pw_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return schemas.AuthResponse(
        status="success",
        user=schemas.UserRead(id=user.id, name=user.name, email=user.email or email_clean),
        token=str(user.id)
    )


@router.post("/google", response_model=schemas.AuthResponse)
def google_auth(payload: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or register user using Google OAuth ID token."""
    token_info = verify_google_token(payload.credential)
    email = token_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google OAuth token or email not verified."
        )

    email_clean = email.strip().lower()
    name_clean = token_info.get("name") or email_clean.split("@")[0]

    # Find or create user
    user = db.query(models.Creator).filter(
        func.lower(models.Creator.email) == email_clean
    ).first()

    if not user:
        # Register new user from Google OAuth
        user = models.Creator(
            name=name_clean,
            email=email_clean,
            password_hash=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create default workspace
        workspace = models.Workspace(
            name="My workspace",
            owner_id=user.id
        )
        db.add(workspace)
        db.commit()

    return schemas.AuthResponse(
        status="success",
        user=schemas.UserRead(id=user.id, name=user.name, email=user.email or email_clean),
        token=str(user.id)
    )


@router.get("/me", response_model=schemas.UserRead)
def get_me(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Retrieve current logged in user profile."""
    user = get_current_user_optional(x_user_id, authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return schemas.UserRead(id=user.id, name=user.name, email=user.email or "")
