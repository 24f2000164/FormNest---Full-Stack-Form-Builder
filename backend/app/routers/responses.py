from datetime import datetime, timedelta
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any, List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/forms", tags=["responses"])


class ProgressUpdate(BaseModel):
    furthest_question_index: int


@router.post("/{form_id}/respond", response_model=schemas.ResponseRead)
def submit_response(form_id: int, payload: schemas.ResponseSubmit, db: Session = Depends(get_db)):
    """Submit a response to a form."""
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    # Create response record
    response = models.Response(
        form_id=form_id,
        completed=False,
        view_id=payload.view_id
    )
    db.add(response)
    db.flush()  # get response.id

    # Process each answer
    for answer_data in payload.answers:
        question_id = answer_data.get("question_id")
        value = answer_data.get("value")
        if question_id is None:
            continue
        question = db.query(models.Question).filter(
            models.Question.id == question_id,
            models.Question.form_id == form_id
        ).first()
        if not question:
            continue

        answer = models.Answer(
            response_id=response.id,
            question_id=question_id,
            value=value
        )
        db.add(answer)

    response.completed = True

    # Update associated FormView if exists
    if payload.view_id:
        view = db.query(models.FormView).filter(models.FormView.id == payload.view_id).first()
        if view:
            view.completed = True
            view.submitted_at = datetime.utcnow()
            if view.started_at:
                view.completion_time = int((view.submitted_at - view.started_at).total_seconds())
            else:
                view.completion_time = int((view.submitted_at - view.viewed_at).total_seconds())

    db.commit()
    db.refresh(response)

    # Build response data
    answers_with_details = []
    for answer in response.answers:
        answers_with_details.append({
            "question_id": answer.question_id,
            "value": answer.value,
            "question_type": answer.question.type,
            "question_title": answer.question.title,
        })

    return schemas.ResponseRead(
        id=response.id,
        form_id=response.form_id,
        submitted_at=response.submitted_at,
        completed=response.completed,
        view_id=response.view_id,
        answers=answers_with_details
    )


@router.get("/{form_id}/responses", response_model=list[schemas.ResponseRead])
def get_form_responses(form_id: int, db: Session = Depends(get_db)):
    """Get all responses for a form (for creator's results view)."""
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    responses = db.query(models.Response).filter(models.Response.form_id == form_id).order_by(models.Response.submitted_at.desc()).all()
    result = []
    for resp in responses:
        answers_with_details = []
        for answer in resp.answers:
            answers_with_details.append({
                "question_id": answer.question_id,
                "value": answer.value,
                "question_type": answer.question.type,
                "question_title": answer.question.title,
            })
        result.append(schemas.ResponseRead(
            id=resp.id,
            form_id=resp.form_id,
            submitted_at=resp.submitted_at,
            completed=resp.completed,
            view_id=resp.view_id,
            answers=answers_with_details
        ))
    return result


@router.get("/responses/{response_id}", response_model=schemas.ResponseRead)
def get_response(response_id: int, db: Session = Depends(get_db)):
    """Get a single response with its answers."""
    response = db.query(models.Response).filter(models.Response.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    answers_with_details = []
    for answer in response.answers:
        answers_with_details.append({
            "question_id": answer.question_id,
            "value": answer.value,
            "question_type": answer.question.type,
            "question_title": answer.question.title,
        })
    return schemas.ResponseRead(
        id=response.id,
        form_id=response.form_id,
        submitted_at=response.submitted_at,
        completed=response.completed,
        view_id=response.view_id,
        answers=answers_with_details
    )


@router.post("/slug/{slug}/view")
def record_view(slug: str, device: str = "other", db: Session = Depends(get_db)):
    """Record that a form was viewed."""
    form = db.query(models.Form).filter(models.Form.slug == slug).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    view = models.FormView(form_id=form.id, device=device)
    db.add(view)
    db.commit()
    db.refresh(view)
    return {"view_id": view.id}


@router.post("/views/{view_id}/start")
def record_start(view_id: int, db: Session = Depends(get_db)):
    """Record that a user started filling out the form."""
    view = db.query(models.FormView).filter(models.FormView.id == view_id).first()
    if not view:
        raise HTTPException(status_code=404, detail="View not found")
    if not view.started_at:
        view.started_at = datetime.utcnow()
        db.commit()
    return {"status": "ok"}


@router.patch("/views/{view_id}/progress")
def record_progress(view_id: int, payload: ProgressUpdate, db: Session = Depends(get_db)):
    """Record progress by updating the furthest question index reached."""
    view = db.query(models.FormView).filter(models.FormView.id == view_id).first()
    if not view:
        raise HTTPException(status_code=404, detail="View not found")
    if payload.furthest_question_index > view.furthest_question_index:
        view.furthest_question_index = payload.furthest_question_index
        db.commit()
    return {"status": "ok"}


@router.get("/{form_id}/insights")
def get_insights(
    form_id: int,
    device: str = "all",
    dateRange: str = "all_time",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve aggregate insights for a form, filtered by device and date range."""
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    # 1. Fetch real views
    real_views = db.query(models.FormView).filter(models.FormView.form_id == form_id).all()
    linked_response_ids = {
        v.view_id for v in db.query(models.Response).filter(
            models.Response.form_id == form_id,
            models.Response.view_id.isnot(None)
        ).all()
    }

    # 2. Fetch responses
    responses = db.query(models.Response).filter(models.Response.form_id == form_id).all()

    # 3. Synthesize virtual views for old/seeded responses that do not have a view_id
    synthesized_views = []
    for resp in responses:
        if resp.view_id is None or resp.view_id not in linked_response_ids:
            synthesized_views.append(models.FormView(
                id=-(100000 + resp.id),
                form_id=form_id,
                viewed_at=resp.submitted_at,
                started_at=resp.submitted_at,
                device="desktop",
                furthest_question_index=len(form.questions) - 1 if form.questions else 0,
                completed=resp.completed,
                submitted_at=resp.submitted_at,
                completion_time=91
            ))

    all_views = list(real_views) + synthesized_views

    # Filter by device
    if device and device.lower() != "all" and device.lower() != "all devices":
        all_views = [v for v in all_views if v.device.lower() == device.lower()]

    # Filter by date range
    now = datetime.utcnow()
    if dateRange == "last_7_days":
        cutoff = now - timedelta(days=7)
        all_views = [v for v in all_views if v.viewed_at >= cutoff]
    elif dateRange == "last_30_days":
        cutoff = now - timedelta(days=30)
        all_views = [v for v in all_views if v.viewed_at >= cutoff]
    elif dateRange == "custom" and start_date and end_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            ed = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            all_views = [v for v in all_views if sd <= v.viewed_at < ed]
        except ValueError:
            pass

    views_count = len(all_views)
    starts_count = sum(1 for v in all_views if v.started_at is not None)
    submissions_count = sum(1 for v in all_views if v.completed)
    completion_rate = (submissions_count / starts_count * 100) if starts_count > 0 else 0

    times = [v.completion_time for v in all_views if v.completed and v.completion_time is not None]
    avg_completion_time = int(sum(times) / len(times)) if times else 0

    # Device Distribution
    device_counts = {"desktop": 0, "mobile": 0, "tablet": 0, "other": 0}
    for v in all_views:
        d = v.device.lower() if v.device else "other"
        if d not in device_counts:
            d = "other"
        device_counts[d] += 1
    
    device_dist = []
    for d, c in device_counts.items():
        pct = (c / views_count * 100) if views_count > 0 else 0
        device_dist.append({"device": d.capitalize(), "count": c, "percentage": round(pct, 1)})

    # Responses Over Time (Daily completed responses)
    if all_views:
        min_date = min(v.viewed_at for v in all_views)
        max_date = max(v.viewed_at for v in all_views)
    else:
        min_date = now - timedelta(days=29)
        max_date = now

    if (max_date - min_date).days < 7:
        min_date = max_date - timedelta(days=6)

    if dateRange == "last_7_days":
        min_date = now - timedelta(days=6)
        max_date = now
    elif dateRange == "last_30_days":
        min_date = now - timedelta(days=29)
        max_date = now

    num_days = (max_date.date() - min_date.date()).days + 1
    date_list = [min_date.date() + timedelta(days=i) for i in range(num_days)]

    responses_by_date = {}
    for v in all_views:
        if v.completed and v.submitted_at:
            dt = v.submitted_at.date()
            responses_by_date[dt] = responses_by_date.get(dt, 0) + 1

    responses_over_time = []
    for d in date_list:
        date_str = d.strftime("%Y-%m-%d")
        responses_over_time.append({"date": date_str, "count": responses_by_date.get(d, 0)})

    # Response Trend
    daily_trend = []
    for i in range(15):
        d = (now - timedelta(days=14-i)).date()
        daily_trend.append({
            "label": d.strftime("%b %d"),
            "count": responses_by_date.get(d, 0)
        })

    weekly_trend = []
    completed_views = [v for v in all_views if v.completed and v.submitted_at]
    for i in range(8):
        w_start = (now - timedelta(weeks=7-i)).date()
        w_start = w_start - timedelta(days=w_start.weekday())
        w_end = w_start + timedelta(days=6)
        count = sum(1 for v in completed_views if w_start <= v.submitted_at.date() <= w_end)
        weekly_trend.append({
            "label": f"Wk {w_start.strftime('%m/%d')}",
            "count": count
        })

    monthly_trend = []
    for i in range(6):
        m_date = now.replace(day=1)
        for _ in range(5-i):
            m_date = (m_date - timedelta(days=1)).replace(day=1)
        m_start = m_date.date()
        next_month = (m_date + timedelta(days=32)).replace(day=1)
        m_end = (next_month - timedelta(days=1)).date()
        count = sum(1 for v in completed_views if m_start <= v.submitted_at.date() <= m_end)
        monthly_trend.append({
            "label": m_start.strftime("%b"),
            "count": count
        })

    response_trend = {
        "daily": daily_trend,
        "weekly": weekly_trend,
        "monthly": monthly_trend
    }

    funnel = [
        {"stage": "Views", "count": views_count, "percentage": 100},
        {"stage": "Starts", "count": starts_count, "percentage": round((starts_count / views_count * 100), 1) if views_count > 0 else 0},
        {"stage": "Completed", "count": submissions_count, "percentage": round((submissions_count / starts_count * 100), 1) if starts_count > 0 else 0}
    ]

    # Question Insights
    question_insights = []
    response_to_view = {}
    for v in all_views:
        if v.id < 0:
            resp_id = -(v.id + 100000)
            response_to_view[resp_id] = v
        else:
            resp = db.query(models.Response).filter(models.Response.view_id == v.id).first()
            if resp:
                response_to_view[resp.id] = v

    answers_by_q = {}
    for resp in responses:
        view = response_to_view.get(resp.id)
        if view and view in all_views:
            for ans in resp.answers:
                if ans.question_id not in answers_by_q:
                    answers_by_q[ans.question_id] = []
                answers_by_q[ans.question_id].append(ans)

    for idx, q in enumerate(form.questions):
        q_answers = answers_by_q.get(q.id, [])
        q_views = sum(1 for v in all_views if v.furthest_question_index >= q.order_index)
        q_dropoffs = sum(1 for v in all_views if v.furthest_question_index == q.order_index and not v.completed)
        
        def is_answered(val):
            if val is None:
                return False
            if isinstance(val, list) and len(val) == 0:
                return False
            if isinstance(val, str) and val.strip() == "":
                return False
            return True

        q_answered_list = [ans for ans in q_answers if is_answered(ans.value)]
        answered_count = len(q_answered_list)
        skipped_count = max(0, q_views - answered_count - q_dropoffs)
        
        completion_pct = round((answered_count / q_views * 100), 1) if q_views > 0 else 0
        dropoff_pct = round((q_dropoffs / q_views * 100), 1) if q_views > 0 else 0

        avg_rating = None
        avg_number = None
        avg_length = None
        recent_answers = []
        distribution = []
        most_common_answer = None

        if q.type == "rating":
            ratings = [int(ans.value) for ans in q_answered_list if ans.value is not None]
            if ratings:
                avg_rating = round(sum(ratings) / len(ratings), 1)
        elif q.type == "number":
            numbers = []
            for ans in q_answered_list:
                try:
                    numbers.append(float(ans.value))
                except (ValueError, TypeError):
                    pass
            if numbers:
                avg_number = round(sum(numbers) / len(numbers), 1)
        elif q.type in ["short_text", "long_text", "email", "phone"]:
            text_vals = [str(ans.value) for ans in q_answered_list if ans.value is not None]
            if text_vals:
                avg_length = round(sum(len(val) for val in text_vals) / len(text_vals), 1)
                recent_answers = text_vals[:5]
        elif q.type in ["multiple_choice", "checkbox", "dropdown", "yes_no"]:
            opts = q.options or []
            if q.type == "yes_no":
                opts = ["yes", "no"]
            
            counts = {o: 0 for o in opts}
            other_count = 0
            
            for ans in q_answered_list:
                val = ans.value
                if isinstance(val, list):
                    for v in val:
                        v_str = str(v)
                        if v_str in counts:
                            counts[v_str] += 1
                        else:
                            other_count += 1
                else:
                    v_str = str(val)
                    if v_str in counts:
                        counts[v_str] += 1
                    else:
                        if q.type == "yes_no" and v_str.lower() in counts:
                            counts[v_str.lower()] += 1
                        else:
                            other_count += 1
            
            total_choices = sum(counts.values()) + other_count
            for opt in opts:
                c = counts[opt]
                pct = round((c / total_choices * 100), 1) if total_choices > 0 else 0
                distribution.append({"option": opt, "count": c, "percentage": pct})
            
            if other_count > 0:
                pct = round((other_count / total_choices * 100), 1) if total_choices > 0 else 0
                distribution.append({"option": "Other", "count": other_count, "percentage": pct})

            if distribution:
                most_common = max(distribution, key=lambda x: x["count"])
                if most_common["count"] > 0:
                    most_common_answer = most_common["option"]

        question_insights.append({
            "question_id": q.id,
            "title": q.title,
            "type": q.type,
            "views": q_views,
            "answered": answered_count,
            "skipped": skipped_count,
            "dropoffs": q_dropoffs,
            "completionRate": completion_pct,
            "dropoffRate": dropoff_pct,
            "averageRating": avg_rating,
            "averageNumber": avg_number,
            "averageLength": avg_length,
            "recentAnswers": recent_answers,
            "distribution": distribution,
            "mostCommonAnswer": most_common_answer
        })

    return {
        "views": views_count,
        "starts": starts_count,
        "submissions": submissions_count,
        "completionRate": round(completion_rate, 1),
        "averageCompletionTime": avg_completion_time,
        "deviceDistribution": device_dist,
        "responsesOverTime": responses_over_time,
        "responseTrend": response_trend,
        "completionFunnel": funnel,
        "questionInsights": question_insights
    }


@router.post("/{form_id}/generate-test-response")
def generate_test_response_endpoint(form_id: int, db: Session = Depends(get_db)):
    """Generate a single realistic simulated response for testing and filling empty states."""
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if not form.questions:
        raise HTTPException(status_code=400, detail="Form must have questions to generate responses")

    device = random.choices(
        ["desktop", "mobile", "tablet", "other"],
        weights=[60, 30, 8, 2],
        k=1
    )[0]

    days_ago = random.randint(0, 29)
    hours_ago = random.randint(0, 23)
    minutes_ago = random.randint(0, 59)
    viewed_time = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
    
    started = random.random() < 0.95  # 95% start filling the form
    started_time = viewed_time + timedelta(seconds=random.randint(2, 8)) if started else None
    
    # 85% chance of completing if started
    completed = started and (random.random() < 0.85)
    
    if completed:
        furthest_index = len(form.questions) - 1
    elif started:
        furthest_index = random.randint(0, len(form.questions) - 1)
    else:
        furthest_index = 0

    completion_time = random.randint(30, 180) if completed else None
    submitted_time = started_time + timedelta(seconds=completion_time) if completed else None

    # Create FormView
    view = models.FormView(
        form_id=form_id,
        viewed_at=viewed_time,
        started_at=started_time,
        device=device,
        furthest_question_index=furthest_index,
        completed=completed,
        submitted_at=submitted_time,
        completion_time=completion_time
    )
    db.add(view)
    db.flush()

    if started:
        # Create Response
        response = models.Response(
            form_id=form_id,
            completed=completed,
            submitted_at=submitted_time if completed else viewed_time + timedelta(minutes=5),
            view_id=view.id
        )
        db.add(response)
        db.flush()

        for idx, q in enumerate(form.questions):
            if idx > furthest_index:
                break
            
            if not q.required and random.random() < 0.15:
                continue

            value = None
            if q.type == "short_text":
                value = random.choice(["Alice Smith", "Bob Jones", "Charlie Brown", "Diana Prince", "Evan Wright"])
            elif q.type == "long_text":
                value = random.choice([
                    "The service was outstanding and prompt. Will recommend!",
                    "Had some issues with loading the page, but overall good.",
                    "Excellent experience, thank you so much!",
                    "Please add more customization options in the future.",
                    "Everything went super smooth and clean."
                ])
            elif q.type == "email":
                value = f"user_{random.randint(100, 999)}@example.com"
            elif q.type == "phone":
                value = f"+1 (555) {random.randint(100, 999)}-{random.randint(1000, 9999)}"
            elif q.type == "number":
                value = random.randint(10, 100)
            elif q.type == "rating":
                max_r = q.settings.get("rating_count", q.settings.get("max_rating", 5)) if q.settings else 5
                value = random.randint(1, max_r)
            elif q.type == "yes_no":
                value = random.choice(["yes", "no"])
            elif q.type == "dropdown":
                if q.options:
                    value = random.choice(q.options)
            elif q.type == "multiple_choice":
                if q.options:
                    allow_mult = q.settings.get("allowMultiple", False) if q.settings else False
                    if allow_mult:
                        num_choices = random.randint(1, min(2, len(q.options)))
                        value = random.sample(q.options, num_choices)
                    else:
                        value = random.choice(q.options)
            elif q.type == "checkbox":
                if q.options:
                    num_choices = random.randint(1, min(3, len(q.options)))
                    value = random.sample(q.options, num_choices)

            if value is not None:
                ans = models.Answer(
                    response_id=response.id,
                    question_id=q.id,
                    value=value
                )
                db.add(ans)

    db.commit()
    return {"status": "ok", "message": "Test response generated successfully"}