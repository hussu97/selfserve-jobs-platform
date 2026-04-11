"""Phase 7 test coverage gaps: email failures, update validators, view count, GCS errors."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

from app.models.auth_session import AuthSession
from app.models.job import Job
from app.models.profile import Profile
from app.models.recruiter import Recruiter
from app.services.code_generator import generate_token

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


async def _make_active_job(db_session, **overrides) -> Job:
    now = datetime.now(UTC)
    defaults = dict(
        job_code="gapjob00001",
        email="owner@gaptest.com",
        email_verified=True,
        job_title="Gap Test Job",
        company_name="GapCo",
        company_city="Dubai",
        company_country="UAE",
        employment_type="full_time",
        description="Test description text",
        key_skills=[],
        contact_method="email",
        contact_email="owner@gaptest.com",
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


async def _make_active_profile(db_session, **overrides) -> Profile:
    now = datetime.now(UTC)
    defaults = dict(
        profile_code="gapprof0001",
        person_name="Gap User",
        email="prof@gaptest.com",
        email_verified=True,
        contact_number="+1 555 000 0000",
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
    job = await _make_active_job(
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
                "email": job.email,
                "entity_code": job.job_code,
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
