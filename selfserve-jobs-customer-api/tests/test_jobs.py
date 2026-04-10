"""Tests for job endpoints — job creation now requires an active recruiter session."""

from unittest.mock import AsyncMock, patch

from app.models.auth_session import AuthSession
from app.models.recruiter import Recruiter

VALID_JOB_PAYLOAD = {
    "job_title": "Software Engineer",
    "company_name": "Acme Corp",
    "company_city": "London",
    "company_country": "United Kingdom",
    "employment_type": "full_time",
    "description": "We are looking for a talented software engineer to join our growing team. "
    "You will work on exciting projects and collaborate with a world-class team.",
    "contact_method": "email",
    "contact_email": "hiring@example.com",
    "key_skills": ["Python", "FastAPI"],
}


async def _create_active_recruiter_session(db_session, email="recruiter@example.com"):
    """Helper: create a recruiter + active auth session, return session_token."""
    from datetime import UTC, datetime, timedelta

    from nanoid import generate

    recruiter = Recruiter(
        recruiter_code=generate(size=12),
        email=email,
        name="Test Recruiter",
        linkedin_profile_url="https://linkedin.com/in/testrecruiter",
        status="active",
    )
    db_session.add(recruiter)
    await db_session.flush()

    session = AuthSession(
        session_token=generate(size=64),
        email=email,
        user_type="recruiter",
        recruiter_code=recruiter.recruiter_code,
        expires_at=datetime.now(UTC) + timedelta(days=30),
    )
    db_session.add(session)
    await db_session.commit()
    return session.session_token


async def test_list_jobs_empty(client):
    response = await client.get("/api/v1/jobs")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["items"] == []
    assert data["total"] == 0


async def test_create_job_unauthenticated(client):
    """Unauthenticated request returns 401."""
    response = await client.post("/api/v1/jobs", json=VALID_JOB_PAYLOAD)
    assert response.status_code == 401


async def test_create_job_missing_fields(client, db_session):
    """Missing required fields returns 422 (even when authenticated)."""
    token = await _create_active_recruiter_session(db_session)
    response = await client.post(
        "/api/v1/jobs",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 422


async def test_create_job_honeypot_rejected(client, db_session):
    """Honeypot field triggers 400."""
    token = await _create_active_recruiter_session(db_session)
    payload = {**VALID_JOB_PAYLOAD, "website": "http://spam.example.com"}
    response = await client.post(
        "/api/v1/jobs",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 400


async def test_create_job_valid(client, db_session):
    """Active recruiter can create a job that is immediately active."""
    token = await _create_active_recruiter_session(db_session)
    with patch("app.services.email_service.send_verification_email", new_callable=AsyncMock):
        response = await client.post(
            "/api/v1/jobs",
            json=VALID_JOB_PAYLOAD,
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 201
    data = response.json()
    assert "code" in data
    assert len(data["code"]) == 12
    assert "message" in data


async def test_create_job_with_salary(client, db_session):
    """Job creation with salary fields works correctly."""
    token = await _create_active_recruiter_session(db_session)
    payload = {
        **VALID_JOB_PAYLOAD,
        "salary_min": 15000,
        "salary_max": 25000,
        "salary_currency": "AED",
    }
    with patch("app.services.email_service.send_verification_email", new_callable=AsyncMock):
        response = await client.post(
            "/api/v1/jobs",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 201


async def test_create_job_salary_without_currency_rejected(client, db_session):
    """Salary range without currency returns 422."""
    token = await _create_active_recruiter_session(db_session)
    payload = {**VALID_JOB_PAYLOAD, "salary_min": 15000, "salary_max": 25000}
    with patch("app.services.email_service.send_verification_email", new_callable=AsyncMock):
        response = await client.post(
            "/api/v1/jobs",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 422


async def test_create_job_salary_min_exceeds_max_rejected(client, db_session):
    """salary_min > salary_max returns 422."""
    token = await _create_active_recruiter_session(db_session)
    payload = {
        **VALID_JOB_PAYLOAD,
        "salary_min": 30000,
        "salary_max": 20000,
        "salary_currency": "AED",
    }
    with patch("app.services.email_service.send_verification_email", new_callable=AsyncMock):
        response = await client.post(
            "/api/v1/jobs",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 422
