"""Phase 7 test coverage gaps: email failures, update validators, view count, rate limits, GCS errors."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

from app.models.auth_session import AuthSession
from app.models.job import Job
from app.models.profile import Profile
from app.models.recruiter import Recruiter
from app.models.user_sensitive import UserSensitive
from app.services.code_generator import generate_code, generate_token

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _make_recruiter_session(db_session, email="recruiter@test.com"):
    from nanoid import generate

    recruiter = Recruiter(
        recruiter_code=generate(size=12),
        email=email,
        name="Test Recruiter",
        linkedin_profile_url="https://linkedin.com/in/test",
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


async def _make_user(db_session, *, email: str, phone: str | None = None) -> UserSensitive:
    """Get-or-create a UserSensitive row. Safe to call multiple times with the same email."""
    from sqlalchemy import select

    result = await db_session.execute(select(UserSensitive).where(UserSensitive.user_email == email))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    user = UserSensitive(user_code=generate_code(12), user_email=email, user_phone=phone)
    db_session.add(user)
    await db_session.flush()
    return user


async def _make_active_job(db_session, *, email="owner@gaptest.com", **overrides) -> Job:
    now = datetime.now(UTC)
    user = await _make_user(db_session, email=email)
    defaults = dict(
        job_code="gapjob00001",
        user_code=user.user_code,
        email_verified=True,
        job_title="Gap Test Job",
        company_name="GapCo",
        company_city="Dubai",
        company_country="UAE",
        employment_type="full_time",
        description="Test description text",
        key_skills=[],
        contact_method="email",
        contact_email=email,
        status="active",
        view_count=0,
        edit_token=generate_token(64),
        expires_at=now + timedelta(days=60),
        created_at=now,
        updated_at=now,
    )
    defaults.update(overrides)
    job = Job(**defaults)
    db_session.add(job)
    await db_session.flush()
    return job


async def _make_active_profile(
    db_session, *, email="prof@gaptest.com", phone="+1 555 000 0000", **overrides
) -> Profile:
    now = datetime.now(UTC)
    user = await _make_user(db_session, email=email, phone=phone)
    defaults = dict(
        profile_code="gapprof0001",
        user_code=user.user_code,
        person_name="Gap User",
        email_verified=True,
        brief="A sufficient professional brief that easily passes the length check.",
        current_city="London",
        current_country="United Kingdom",
        years_of_experience=5,
        current_title="Engineer",
        relocation_preference="open",
        key_skills=[],
        status="active",
        view_count=0,
        edit_token=generate_token(64),
        expires_at=now + timedelta(days=60),
        created_at=now,
        updated_at=now,
    )
    defaults.update(overrides)
    profile = Profile(**defaults)
    db_session.add(profile)
    await db_session.flush()
    return profile


async def test_verification_resend_returns_200_regardless_of_email_outcome(client, db_session):
    """POST /verify/resend returns 200 even if the Resend API call fails.
    The email is sent as a background task after the response, so delivery
    failures cannot block or fail the endpoint.
    """
    await _make_active_job(
        db_session,
        job_code="emailfail01",
        email="emailfail@test.com",
        email_verified=False,
        status="pending_verification",
    )

    with patch("app.services.email_service.send_verification_email", new_callable=AsyncMock, return_value=False):
        response = await client.post(
            "/api/v1/verify/resend",
            json={
                "entity_type": "job",
                "email": "emailfail@test.com",
                "entity_code": "emailfail01",
            },
        )
    assert response.status_code == 200


async def test_profile_creation_in_production_mode_returns_201_even_if_email_fails(client, db_session):
    """In production mode, profile creation returns 201 regardless of email send outcome.
    The verification email is sent as a background task after the response, so a Resend
    failure cannot block or fail the request.
    """
    payload = {
        "person_name": "Email Fail User",
        "email": "profilefail@test.com",
        "brief": "A sufficiently long professional brief that passes the minimum length validation check.",
        "current_city": "Dubai",
        "current_country": "UAE",
        "years_of_experience": 3,
        "current_title": "Engineer",
        "notice_period": "immediate",
        "relocation_preference": "open",
        "key_skills": ["Python"],
        "contact_number": "+971 50 000 0000",
    }
    with (
        patch("app.routers.profiles.settings") as mock_settings,
        patch("app.services.email_service.send_verification_email", new_callable=AsyncMock, return_value=False),
    ):
        mock_settings.is_production = True
        mock_settings.frontend_url = "http://localhost:3000"
        response = await client.post("/api/v1/profiles", json=payload)
    assert response.status_code == 201


# ---------------------------------------------------------------------------
# Update validators — contact_method consistency
# ---------------------------------------------------------------------------


async def test_job_update_contact_method_email_without_contact_email_returns_422(client, db_session):
    """Setting contact_method=email without contact_email on update returns 422."""
    job = await _make_active_job(db_session, job_code="validjob001")

    response = await client.put(
        f"/api/v1/jobs/{job.job_code}",
        json={"contact_method": "email", "contact_email": None},
        headers={"X-Edit-Token": job.edit_token},
    )
    assert response.status_code == 422


async def test_job_update_contact_method_url_without_contact_url_returns_422(client, db_session):
    """Setting contact_method=url without contact_url on update returns 422."""
    job = await _make_active_job(db_session, job_code="validjob002")

    response = await client.put(
        f"/api/v1/jobs/{job.job_code}",
        json={"contact_method": "url", "contact_url": None},
        headers={"X-Edit-Token": job.edit_token},
    )
    assert response.status_code == 422


async def test_job_update_with_valid_contact_succeeds(client, db_session):
    """Valid contact update succeeds (200)."""
    job = await _make_active_job(db_session, job_code="validjob003")

    response = await client.put(
        f"/api/v1/jobs/{job.job_code}",
        json={"contact_method": "email", "contact_email": "new@example.com"},
        headers={"X-Edit-Token": job.edit_token},
    )
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# View count — GET detail increments count
# ---------------------------------------------------------------------------


async def test_get_job_detail_increments_view_count(client, db_session):
    """Each GET /jobs/{code} increments the view count by 1."""
    from sqlalchemy import select

    job = await _make_active_job(db_session, job_code="viewjob0001", view_count=0)
    initial_count = job.view_count

    await client.get(f"/api/v1/jobs/{job.job_code}")

    await db_session.refresh(job)
    result = await db_session.execute(select(Job).where(Job.job_code == job.job_code))
    updated = result.scalar_one()
    assert updated.view_count == initial_count + 1


async def test_get_profile_detail_increments_view_count(client, db_session):
    """Each GET /profiles/{code} increments the view count by 1."""
    from sqlalchemy import select

    profile = await _make_active_profile(db_session, profile_code="viewprof001", view_count=0)

    await client.get(f"/api/v1/profiles/{profile.profile_code}")

    result = await db_session.execute(select(Profile).where(Profile.profile_code == profile.profile_code))
    updated = result.scalar_one()
    assert updated.view_count == 1


# ---------------------------------------------------------------------------
# Admin rejection invalidates sessions
# ---------------------------------------------------------------------------


async def test_reject_recruiter_invalidates_all_sessions(client, db_session):
    """After admin rejects a recruiter, all their auth sessions are deleted."""
    from sqlalchemy import select

    from app.models.recruiter_rejection_reason import RecruiterRejectionReason
    from app.routers.admin import _get_admin_session

    # Setup rejection reason
    reason = RecruiterRejectionReason(code="session_test_reason", name="Session Test Reason")
    db_session.add(reason)
    await db_session.flush()

    # Create recruiter with active sessions
    recruiter = Recruiter(
        recruiter_code="rejsess0001",
        email="rejsess@example.com",
        name="Test Recruiter",
        linkedin_profile_url="https://linkedin.com/in/test",
        status="pending_approval",
    )
    db_session.add(recruiter)
    await db_session.flush()

    # Add two sessions for this recruiter
    for i in range(2):
        sess = AuthSession(
            session_token=f"recruiter-session-token-{i}",
            email=recruiter.email,
            user_type="recruiter",
            recruiter_code=recruiter.recruiter_code,
            expires_at=datetime.now(UTC) + timedelta(days=30),
        )
        db_session.add(sess)
    await db_session.flush()

    # Setup admin override
    admin_session = AuthSession(
        session_token="admin-reject-session-tok",
        email="rejectadmin@example.com",
        user_type="admin",
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )
    db_session.add(admin_session)
    await db_session.flush()

    from app.main import app

    async def _override():
        return admin_session

    app.dependency_overrides[_get_admin_session] = _override

    with patch("app.services.email_service.send_recruiter_rejected_email", new_callable=AsyncMock):
        r = await client.post(
            f"/api/v1/admin/recruiters/{recruiter.recruiter_code}/reject",
            json={"reason_code": "session_test_reason"},
        )

    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200

    # All sessions for this recruiter should be gone
    remaining = await db_session.execute(select(AuthSession).where(AuthSession.email == recruiter.email))
    assert remaining.scalars().all() == []


# ---------------------------------------------------------------------------
# GCS delete failure — graceful handling on profile removal
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Rate limiting — IP-based limits on create/submit endpoints
# ---------------------------------------------------------------------------


_VALID_JOB_PAYLOAD = {
    "job_title": "Software Engineer",
    "company_name": "Acme Corp",
    "company_city": "London",
    "company_country": "United Kingdom",
    "employment_type": "full_time",
    "description": "A great opportunity for a talented software engineer.",
    "contact_method": "email",
    "contact_email": "hiring@example.com",
    "key_skills": ["Python", "FastAPI"],
}


async def test_verify_ip_rate_limit(client):
    """POST /verify is limited to 5 requests per minute per IP.

    Sends 5 requests with invalid codes (all return 400) then asserts
    the 6th is rejected with 429 by the slowapi middleware.
    """
    for _ in range(5):
        await client.post("/api/v1/verify", json={"code": "invalid-code-that-does-not-exist-00"})

    r = await client.post("/api/v1/verify", json={"code": "another-invalid-code-xxxxxxxxxxxxxx"})
    assert r.status_code == 429


async def test_create_job_ip_rate_limit(client, db_session):
    """POST /jobs is limited to 10 requests per hour per IP.

    After 10 requests (first 5 succeed; requests 6-10 fail with 409 due to
    the max-active-jobs-per-email business rule), the 11th is rejected with
    429 by the slowapi middleware.  The rate limiter counts all requests
    regardless of their HTTP response status.
    """
    token = await _make_recruiter_session(db_session, email="rljobs@ratelimitgap.com")

    for _ in range(10):
        await client.post(
            "/api/v1/jobs",
            json=_VALID_JOB_PAYLOAD,
            headers={"Authorization": f"Bearer {token}"},
        )

    r = await client.post(
        "/api/v1/jobs",
        json=_VALID_JOB_PAYLOAD,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 429


async def test_report_ip_rate_limit(client, db_session):
    """POST /reports is limited to 10 requests per hour per IP.

    Submits 10 reports against a single job from different reporter emails
    (each is accepted; after the REPORT_THRESHOLD the job is under_review
    but still reportable).  The 11th request is rejected with 429.
    """
    job = await _make_active_job(db_session, job_code="rljob000001")

    for i in range(10):
        await client.post(
            "/api/v1/reports",
            json={
                "entity_type": "job",
                "entity_code": job.job_code,
                "reporter_email": f"rl_reporter{i}@example.com",
                "reason": "spam",
            },
        )

    r = await client.post(
        "/api/v1/reports",
        json={
            "entity_type": "job",
            "entity_code": job.job_code,
            "reporter_email": "rl_reporter10@example.com",
            "reason": "spam",
        },
    )
    assert r.status_code == 429


# ---------------------------------------------------------------------------
# View count — multiple sequential increments accumulate correctly
# ---------------------------------------------------------------------------


async def test_view_count_accumulates_over_multiple_requests(client, db_session):
    """Multiple sequential GET /jobs/{code} requests each add 1 to view_count.

    This test verifies that the atomic UPDATE ensures no increments are lost.
    Full concurrency testing (asyncio.gather) is deferred to integration tests
    that run against PostgreSQL where true parallel write semantics apply.
    """
    from sqlalchemy import select

    N = 5
    job = await _make_active_job(db_session, job_code="accumview001", view_count=0)

    for _ in range(N):
        r = await client.get(f"/api/v1/jobs/{job.job_code}")
        assert r.status_code == 200

    result = await db_session.execute(select(Job).where(Job.job_code == job.job_code))
    updated = result.scalar_one()
    assert updated.view_count == N


async def test_profile_removal_succeeds_even_if_gcs_delete_fails(client, db_session):
    """Profile removal completes (200) even when GCS file deletion throws an exception."""
    from sqlalchemy import select

    profile = await _make_active_profile(
        db_session,
        profile_code="gcsfail0001",
        resume_gcs_path="resumes/gcsfail0001/resume.pdf",
    )

    with patch(
        "app.services.storage_service.delete_file",
        new_callable=AsyncMock,
        side_effect=Exception("GCS unavailable"),
    ):
        response = await client.delete(
            f"/api/v1/profiles/{profile.profile_code}",
            headers={"X-Edit-Token": profile.edit_token},
        )

    assert response.status_code == 200

    # Profile should still be marked as removed in DB
    result = await db_session.execute(select(Profile).where(Profile.profile_code == profile.profile_code))
    updated = result.scalar_one()
    assert updated.status == "removed"
