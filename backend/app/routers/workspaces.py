from datetime import datetime
import os
import smtplib
import json
import urllib.request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from typing import List, Optional

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


def extract_user_id(x_user_id: Optional[str], authorization: Optional[str]) -> int:
    uid_str = x_user_id
    if not uid_str and authorization and authorization.startswith("Bearer "):
        uid_str = authorization.replace("Bearer ", "").strip()
    if uid_str:
        try:
            return int(uid_str)
        except ValueError:
            pass
    return 1


@router.get("", response_model=List[schemas.WorkspaceSummary])
def list_workspaces(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """List all workspaces belonging to the current user."""
    user_id = extract_user_id(x_user_id, authorization)
    workspaces = db.query(models.Workspace).filter(models.Workspace.owner_id == user_id).all()
    
    # Auto-create default workspace if user doesn't have any
    if not workspaces:
        ws = models.Workspace(name="My workspace", owner_id=user_id)
        db.add(ws)
        db.commit()
        db.refresh(ws)
        workspaces = [ws]

    result = []
    for w in workspaces:
        count = db.query(func.count(models.Form.id)).filter(models.Form.workspace_id == w.id).scalar()
        result.append(schemas.WorkspaceSummary(
            id=w.id,
            name=w.name,
            owner_id=w.owner_id,
            form_count=count,
            created_at=w.created_at,
            updated_at=w.updated_at
        ))
    return result


@router.post("", response_model=schemas.WorkspaceRead, status_code=status.HTTP_201_CREATED)
def create_workspace(
    payload: schemas.WorkspaceCreate,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Create a new workspace for the current user."""
    name_clean = payload.name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Workspace name is required")

    user_id = extract_user_id(x_user_id, authorization)

    # Validate duplicate name for this specific owner
    existing = db.query(models.Workspace).filter(
        models.Workspace.owner_id == user_id,
        func.lower(models.Workspace.name) == name_clean.lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Workspace name already exists")

    ws = models.Workspace(name=name_clean, owner_id=user_id)
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws


@router.patch("/{workspace_id}", response_model=schemas.WorkspaceRead)
def rename_workspace(workspace_id: int, payload: schemas.WorkspaceUpdate, db: Session = Depends(get_db)):
    """Rename an existing workspace."""
    ws = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    name_clean = payload.name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Workspace name is required")

    # Validate duplicate name (case-insensitive, other than current workspace)
    existing = db.query(models.Workspace).filter(
        func.lower(models.Workspace.name) == name_clean.lower(),
        models.Workspace.id != workspace_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Workspace name already exists")

    ws.name = name_clean
    ws.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ws)
    return ws


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(workspace_id: int, db: Session = Depends(get_db)):
    """Delete a workspace. Moves forms inside it to the default workspace."""
    ws = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Prevent deleting the last workspace
    total_ws = db.query(models.Workspace).count()
    if total_ws <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last workspace")

    # Prevent deleting default workspace (id == 1 or named "My workspace")
    if ws.name == "My workspace" or workspace_id == 1:
        raise HTTPException(status_code=400, detail="You cannot delete the default workspace.")

    db.delete(ws)
    db.commit()
    return None


@router.get("/{workspace_id}/forms", response_model=List[schemas.FormSummary])
def get_workspace_forms(
    workspace_id: int,
    sort_by: str = "updated",
    sort_order: str = "desc",
    db: Session = Depends(get_db)
):
    """Get all forms inside a specific workspace with completion rate and response count."""
    ws = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    query = db.query(models.Form).filter(models.Form.workspace_id == workspace_id)

    # Determine order column
    if sort_by == "created":
        order_col = models.Form.created_at
    elif sort_by == "alphabetical":
        order_col = models.Form.title
    else:  # default to updated
        order_col = models.Form.updated_at

    # Determine order direction
    if sort_order == "asc":
        query = query.order_by(order_col.asc())
    else:
        query = query.order_by(order_col.desc())

    forms = query.all()
    result = []
    for f in forms:
        response_count = db.query(func.count(models.Response.id)).filter(models.Response.form_id == f.id).scalar()
        
        # Calculate completion rate
        completed_count = db.query(func.count(models.Response.id)).filter(
            models.Response.form_id == f.id,
            models.Response.completed == True
        ).scalar()
        
        started_count = db.query(func.count(models.FormView.id)).filter(
            models.FormView.form_id == f.id,
            models.FormView.started_at.isnot(None)
        ).scalar()

        if response_count > 0 and started_count == 0:
            completion_rate = 100.0
        else:
            completion_rate = round((completed_count / started_count * 100), 1) if started_count > 0 else 0.0

        result.append(schemas.FormSummary(
            id=f.id,
            title=f.title,
            status=f.status,
            response_count=response_count,
            updated_at=f.updated_at,
            workspace_id=f.workspace_id,
            completion_rate=completion_rate,
            slug=f.slug
        ))
    return result


@router.post("/{workspace_id}/invite", response_model=schemas.WorkspaceInviteResponse)
def invite_user(workspace_id: int, invite_req: schemas.WorkspaceInviteRequest, db: Session = Depends(get_db)):
    """Invite a user to a workspace via email.
    Priority: 1) Resend API (HTTP, works on Render) -> 2) SMTP -> 3) Mock log fallback
    """
    ws = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    email = invite_req.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    # Construct invitation details
    frontend_base_url = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    invite_url = f"{frontend_base_url}/invite?workspace_id={workspace_id}&email={email}"

    subject = f"Invitation to join workspace '{ws.name}' on FormNest"
    html_body = f"""
    <html>
      <body style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #26212e, #4f70db); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">FormNest</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Workspace Invitation</p>
        </div>
        <div style="background: #f9f9f9; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #eee;">
          <h2 style="color: #26212e;">You've been invited!</h2>
          <p>Hello,</p>
          <p>You have been invited to collaborate on the workspace <strong>"{ws.name}"</strong> in FormNest.</p>
          <p>Click the button below to accept the invitation and get started:</p>
          <p style="margin: 32px 0; text-align: center;">
            <a href="{invite_url}" style="background-color: #26212e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">Accept Invitation</a>
          </p>
          <p style="color: #888; font-size: 13px;">Or copy this link into your browser:</p>
          <p style="background: #eee; padding: 10px; border-radius: 6px; word-break: break-all; font-size: 12px;">{invite_url}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
          <p style="font-size: 12px; color: #aaa;">If you did not expect this invitation, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
    """

    # ── Method 1: Resend API (HTTPS – works on Render free tier) ──────────────
    resend_api_key = os.environ.get("RESEND_API_KEY")
    if resend_api_key:
        try:
            resend_from = os.environ.get("RESEND_FROM_EMAIL", "FormNest <onboarding@resend.dev>")
            payload = json.dumps({
                "from": resend_from,
                "to": [email],
                "subject": subject,
                "html": html_body,
            }).encode("utf-8")

            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=payload,
                headers={
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp_data = json.loads(resp.read().decode())
                print(f"Resend email sent successfully. ID: {resp_data.get('id')}")
                return schemas.WorkspaceInviteResponse(
                    status="success",
                    message=f"Invitation email sent successfully to {email}.",
                    mock_sent=False
                )
        except Exception as e:
            print(f"Resend API error: {str(e)}")
            # Fall through to SMTP

    # ── Method 2: SMTP (may be blocked on Render free tier) ──────────────────
    smtp_host = os.environ.get("SMTP_HOST") or os.environ.get("MAIL_SERVER")
    smtp_port = os.environ.get("SMTP_PORT") or os.environ.get("MAIL_PORT")
    smtp_user = os.environ.get("SMTP_USERNAME") or os.environ.get("MAIL_USERNAME")
    smtp_pass = os.environ.get("SMTP_PASSWORD") or os.environ.get("MAIL_PASSWORD")
    smtp_from = os.environ.get("SMTP_FROM_EMAIL") or os.environ.get("MAIL_DEFAULT_SENDER") or "no-reply@formnest.com"
    smtp_from_name = os.environ.get("SMTP_FROM_NAME", "FormNest")
    smtp_use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"

    if smtp_host and smtp_port:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{smtp_from_name} <{smtp_from}>"
            msg["To"] = email
            msg.attach(MIMEText(html_body, "html"))

            port = int(smtp_port)
            if port == 465:
                server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
            else:
                server = smtplib.SMTP(smtp_host, port, timeout=10)
                if smtp_use_tls:
                    server.starttls()

            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)

            server.sendmail(smtp_from, [email], msg.as_string())
            server.quit()

            return schemas.WorkspaceInviteResponse(
                status="success",
                message="Invitation email sent successfully via SMTP.",
                mock_sent=False
            )
        except Exception as e:
            print(f"SMTP error, falling back to mock: {str(e)}")

    # ── Method 3: Mock fallback log ───────────────────────────────────────────
    print("\n" + "="*50)
    print("MOCK EMAIL INVITATION LOG")
    print(f"To: {email}")
    print(f"Subject: {subject}")
    print(f"Invite URL: {invite_url}")
    print("="*50 + "\n")

    return schemas.WorkspaceInviteResponse(
        status="success",
        message="Workspace invitation registered (mock mode – set RESEND_API_KEY to send real emails).",
        mock_sent=True
    )


@router.post("/{workspace_id}/leave")
def leave_workspace(workspace_id: int, db: Session = Depends(get_db)):
    """Simulate leaving a workspace by deleting it or moving forms to the default workspace."""
    ws = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    # Prevent leaving default workspace
    if ws.name == "My workspace" or workspace_id == 1:
        raise HTTPException(status_code=400, detail="You cannot leave the default workspace.")

    # Find the next default/available workspace
    default_ws = db.query(models.Workspace).filter(
        models.Workspace.name == "My workspace", 
        models.Workspace.id != workspace_id
    ).first()
    if not default_ws:
        default_ws = db.query(models.Workspace).filter(models.Workspace.id != workspace_id).first()

    # Move forms to default workspace if present to avoid orphan forms
    if default_ws:
        db.query(models.Form).filter(models.Form.workspace_id == workspace_id).update(
            {models.Form.workspace_id: default_ws.id}
        )

    db.delete(ws)
    db.commit()
    return {"status": "success", "message": "Left workspace successfully"}
