"""Tests for report submission: validation, duplicate prevention, and auto-flag threshold."""

from datetime import UTC, datetime, timedelta

from app.models.job import Job
from app.models.profile import Profile
from app.services.code_generator import generate_token

# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

VALID_JOB = dict(
    job_code="repjob00001",
    email="owner@example.com",
    email_verified=True,
    job_title="Test Job",
    company_name="Acme",
    company_city="Dubai",
    company_country="UAE",
    employment_type="full_time",
    description="Test description",
    key_skills=[],
    contact_method="email",
    contact_email="owner@example.com",
    status="active",
    view_count=0,
)

VALID_PROFILE = dict(
    profile_code="repprof0001",
    person_name="Jane Smith",
    email="jane@example.com",
    email_verified=True,
    contact_number="+44 7700 900123",
    brief="Experienced engineer.",
    current_city="London",
    current_country="United Kingdom",
    years_of_experience=5,
    current_title="Engineer",
    relocation_preference="open",
    key_skills=["Python"],
    status="active",
    view_count=0,
)


async def _make_job(db_session, **overrides) -> Job:
    now = datetime.now(UTC)
    fields = {
        **VALID_JOB,
        "edit_token": generate_token(64),
        "expires_at": now + timedelta(days=60),
        "created_at": now,
        "updated_at": now,
    }
    fields.update(overrides)
    job = Job(**fields)
    db_session.add(job)
    await db_session.flush()
    return job


async def _make_profile(db_session, **overrides) -> Profile:
    now = datetime.now(UTC)
    fields = {
        **VALID_PROFILE,
        "edit_token": generate_token(64),
        "expires_at": now + timedelta(days=180),
        "created_at": now,
        "updated_at": now,
    }
    fields.update(overrides)
    profile = Profile(**fields)
    db_session.add(profile)
    await db_session.flush()
    return profile


REPORT_PAYLOAD = {
    "entity_type": "job",
    "entity_code": "repjob00001",
    "reporter_email": "reporter@example.com",
    "reason": "spam",
}

# ---------------------------------------------------------------------------
# POST /api/v1/reports — basic submission
# ---------------------------------------------------------------------------


async def test_report_job_success(client, db_session):
    await _make_job(db_session)
    response = await client.post("/api/v1/reports", json=REPORT_PAYLOAD)
    assert response.status_code == 201
    assert "message" in response.json()


async def test_report_profile_success(client, db_session):
    await _make_profile(db_session)
    payload = {
        "entity_type": "profile",
        "entity_code": "repprof0001",
        "reporter_email": "reporter2@example.com",
        "reason": "inappropriate",
    }
    response = await client.post("/api/v1/reports", json=payload)
    assert response.status_code == 201


async def test_report_nonexistent_job_returns_404(client):
    payload = {**REPORT_PAYLOAD, "entity_code": "doesnotexist"}
    response = await client.post("/api/v1/reports", json=payload)
    assert response.status_code == 404


async def test_report_missing_fields_returns_422(client):
    response = await client.post("/api/v1/reports", json={})
    assert response.status_code == 422


async def test_report_invalid_reason_returns_422(client, db_session):
    await _make_job(db_session)
    payload = {**REPORT_PAYLOAD, "reason": "notareason"}
    response = await client.post("/api/v1/reports", json=payload)
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Duplicate prevention
# ---------------------------------------------------------------------------


async def test_duplicate_report_from_same_email_rejected(client, db_session):
    await _make_job(db_session)
    await client.post("/api/v1/reports", json=REPORT_PAYLOAD)
    # Same reporter, same entity
    response = await client.post("/api/v1/reports", json=REPORT_PAYLOAD)
    assert response.status_code == 409


async def test_different_reporters_can_each_report_once(client, db_session):
    await _make_job(db_session)
    r1 = await client.post("/api/v1/reports", json={**REPORT_PAYLOAD, "reporter_email": "a@example.com"})
    r2 = await client.post("/api/v1/reports", json={**REPORT_PAYLOAD, "reporter_email": "b@example.com"})
    assert r1.status_code == 201
    assert r2.status_code == 201


# ---------------------------------------------------------------------------
# Auto-flag threshold (REPORT_THRESHOLD = 3)
# ---------------------------------------------------------------------------


async def test_job_flagged_under_review_at_threshold(client, db_session):
    from sqlalchemy import select

    job = await _make_job(db_session, job_code="flagjob0001")

    for i in range(3):
        r = await client.post(
            "/api/v1/reports",
            json={
                "entity_type": "job",
                "entity_code": "flagjob0001",
                "reporter_email": f"reporter{i}@example.com",
                "reason": "spam",
            },
        )
        assert r.status_code == 201

    await db_session.refresh(job)
    result = await db_session.execute(select(Job).where(Job.job_code == "flagjob0001"))
    updated_job = result.scalar_one()
    assert updated_job.status == "under_review"


async def test_job_not_flagged_below_threshold(client, db_session):
    from sqlalchemy import select

    await _make_job(db_session, job_code="safejob0001")

    for i in range(2):
        await client.post(
            "/api/v1/reports",
            json={
                "entity_type": "job",
                "entity_code": "safejob0001",
                "reporter_email": f"safe{i}@example.com",
                "reason": "spam",
            },
        )

    result = await db_session.execute(select(Job).where(Job.job_code == "safejob0001"))
    job = result.scalar_one()
    assert job.status == "active"


async def test_removed_job_not_reportable(client, db_session):
    await _make_job(db_session, job_code="remjob00001", status="removed")
    response = await client.post(
        "/api/v1/reports",
        json={**REPORT_PAYLOAD, "entity_code": "remjob00001"},
    )
    assert response.status_code == 404
