from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import Base, engine, SessionLocal
from app import models, schemas
from app.routers import forms, questions, responses, share, workspaces, auth
import json

def migrate_db():
    # Base.metadata.create_all only creates missing tables - it never alters
    # existing ones. typeform.db may already exist from before the Share
    # feature added `published_at`, so add it by hand if it's missing
    # rather than requiring people to delete their local database.
    with engine.connect() as conn:
        cols = [row[1] for row in conn.execute(text("PRAGMA table_info(forms)"))]
        if "published_at" not in cols:
            conn.execute(text("ALTER TABLE forms ADD COLUMN published_at DATETIME"))
            conn.commit()
        if "settings" not in cols:
            conn.execute(text("ALTER TABLE forms ADD COLUMN settings JSON"))
            conn.commit()

        cols_creators = [row[1] for row in conn.execute(text("PRAGMA table_info(creators)"))]
        if "email" not in cols_creators:
            conn.execute(text("ALTER TABLE creators ADD COLUMN email VARCHAR"))
            conn.commit()
        if "password_hash" not in cols_creators:
            conn.execute(text("ALTER TABLE creators ADD COLUMN password_hash VARCHAR"))
            conn.commit()

        cols_responses = [row[1] for row in conn.execute(text("PRAGMA table_info(responses)"))]
        if "view_id" not in cols_responses:
            conn.execute(text("ALTER TABLE responses ADD COLUMN view_id INTEGER"))
            conn.commit()
        if "workspace_id" not in cols:
            # Check if default workspace exists, otherwise create one
            res = conn.execute(text("SELECT id FROM workspaces LIMIT 1")).fetchone()
            if not res:
                conn.execute(text("INSERT INTO workspaces (name, owner_id, created_at, updated_at) VALUES ('My workspace', 1, datetime('now'), datetime('now'))"))
                conn.commit()
                res = conn.execute(text("SELECT id FROM workspaces LIMIT 1")).fetchone()
            default_ws_id = res[0]
            conn.execute(text("ALTER TABLE forms ADD COLUMN workspace_id INTEGER"))
            conn.execute(text(f"UPDATE forms SET workspace_id = {default_ws_id}"))
            conn.commit()

def init_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    migrate_db()

    # Seed initial data if empty
    db = SessionLocal()
    try:
        # Check if we already have forms
        if db.query(models.Form).count() == 0:
            # Create a default creator (id=1) if not exists
            if db.query(models.Creator).count() == 0:
                creator = models.Creator(name="Default Creator")
                db.add(creator)
                db.commit()

            # Form 1: Simple contact form
            form1 = models.Form(
                creator_id=1,
                title="Contact Form",
                description="Please fill out your contact information",
                status="published",
            )
            db.add(form1)
            db.flush()

            # Questions for form1
            q1 = models.Question(
                form_id=form1.id,
                type="short_text",
                title="Name",
                description="Your full name",
                required=True,
                order_index=0,
            )
            q2 = models.Question(
                form_id=form1.id,
                type="email",
                title="Email",
                description="Your email address",
                required=True,
                order_index=1,
            )
            q3 = models.Question(
                form_id=form1.id,
                type="long_text",
                title="Message",
                description="Your message to us",
                required=False,
                order_index=2,
            )
            db.add_all([q1, q2, q3])
            db.flush()

            # Form 2: Survey with multiple choice and rating
            form2 = models.Form(
                creator_id=1,
                title="Customer Satisfaction Survey",
                description="Help us improve our service",
                status="published",
            )
            db.add(form2)
            db.flush()

            q4 = models.Question(
                form_id=form2.id,
                type="multiple_choice",
                title="How satisfied are you with our product?",
                description="Please select one option",
                required=True,
                order_index=0,
                options=["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"],
            )
            q5 = models.Question(
                form_id=form2.id,
                type="rating",
                title="How likely are you to recommend us to a friend?",
                description="0 = Not at all likely, 10 = Extremely likely",
                required=True,
                order_index=1,
                settings={"max_rating": 10},
            )
            q6 = models.Question(
                form_id=form2.id,
                type="yes_no",
                title="Would you purchase again?",
                required=False,
                order_index=2,
            )
            db.add_all([q4, q5, q6])
            db.flush()

            # Add some sample responses for form1
            resp1 = models.Response(form_id=form1.id, completed=True)
            db.add(resp1)
            db.flush()
            ans1 = models.Answer(response_id=resp1.id, question_id=q1.id, value="John Doe")
            ans2 = models.Answer(response_id=resp1.id, question_id=q2.id, value="john@example.com")
            ans3 = models.Answer(response_id=resp1.id, question_id=q3.id, value="Hello, I have a question about your product.")
            db.add_all([ans1, ans2, ans3])

            resp2 = models.Response(form_id=form1.id, completed=True)
            db.add(resp2)
            db.flush()
            ans4 = models.Answer(response_id=resp2.id, question_id=q1.id, value="Jane Smith")
            ans5 = models.Answer(response_id=resp2.id, question_id=q2.id, value="jane@example.com")
            ans6 = models.Answer(response_id=resp2.id, question_id=q3.id, value="Great service!")
            db.add_all([ans4, ans5, ans6])

            # Add some sample responses for form2
            resp3 = models.Response(form_id=form2.id, completed=True)
            db.add(resp3)
            db.flush()
            ans7 = models.Answer(response_id=resp3.id, question_id=q4.id, value="Satisfied")
            ans8 = models.Answer(response_id=resp3.id, question_id=q5.id, value=8)
            ans9 = models.Answer(response_id=resp3.id, question_id=q6.id, value="Yes")
            db.add_all([ans7, ans8, ans9])

            resp4 = models.Response(form_id=form2.id, completed=True)
            db.add(resp4)
            db.flush()
            ans10 = models.Answer(response_id=resp4.id, question_id=q4.id, value="Very satisfied")
            ans11 = models.Answer(response_id=resp4.id, question_id=q5.id, value=9)
            ans12 = models.Answer(response_id=resp4.id, question_id=q6.id, value="Yes")
            db.add_all([ans10, ans11, ans12])

            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

def start_app():
    init_db()

# For uvicorn: we want to call init_db when the app starts
# We'll call it after creating the app
app = FastAPI(title="Typeform Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(responses.router)
app.include_router(share.router)
app.include_router(workspaces.router)
app.include_router(auth.router)

# Initialize database and seed data
init_db()


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    from fastapi.responses import Response
    return Response(status_code=204)