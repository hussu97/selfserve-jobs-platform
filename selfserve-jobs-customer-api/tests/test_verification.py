"""Tests for verification endpoints: verify code, resend, rate limiting."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

from app.models.email_verification import EmailVerification
from app.models.job import Job
from app.models.profile import Profile
from app.models.user_sensitive import UserSensitive
from app.services.code_generator import generate_code, generate_token, generate_verification_code


async def _make_user(db_session, *, email: str, phone: str | None = None) -> UserSensitive:
    """Get-or-create a UserSensitive row for *email*. Safe to call multiple times with the same email."""
    from sqlalchemy import select

    result = await db_session.execute(select(UserSensitive).where(UserSensitive.user_email == email))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    user = UserSensitive(
        user_code=generate_code(12),
        user_email=email,
        user_phone=phone,
    )
    db_session.add(user)
    await db_session.flush()
    return user


async def _make_active_job(db_session, *, job_code="verifyjob01", email="owner@example.com") -> Job:
    now = datetime.now(UTC)
    user = await _make_user(db_session, email=email)
    job = Job(
        job_code=job_code,
        user_code=user.user_code,
        email_verified=False,
        job_title="Verify Test Job",
        company_name="Co",
        company_city="Dubai",
        company_country="UAE",
        employment_type="full_time",
        description="Test",
        key_skills=[],
        contact_method="email",
        contact_email=email,
        status="pending_verification",
        view_count=0,
        expires_at=now + timedelta(days=60),
        edit_token=generate_token(64),
        created_at=now,
        updated_at=now,
    )
    db_session.add(job)
    await db_session.flush()
    return job


async def _make_pending_profile(db_session, *, profile_code="verifyprof1", email="profile@example.com") -> Profile:
    now = datetime.now(UTC)
    user = await _make_user(db_session, email=email, phone="+1 555 000 0000")
    profile = Profile(
        profile_code=profile_code,
        user_code=user.user_code,
        person_name="Verify User",
        email_verified=False,
        brief="Test profile brief text that is long enough to pass validation.",
        current_city="London",
        current_country="United Kingdom",
        years_of_experience=3,
        current_title="Engineer",
        relocation_preference="open",
        key_skills=[],
        status="pending_verification",
        view_count=0,
        edit_token=generate_token(64),
        expires_at=now + timedelta(days=180),
        created_at=now,
        updated_at=now,
    )
    db_session.add(profile)
    await db_session.flush()
    return profile


async def _make_verification(
    db_session,
    *,
    entity_type: str,
    entity_code: str,
    user_code: str | None = None,
    expired: bool = False,
) -> EmailVerification:
    now = datetime.now(UTC)
    delta = timedelta(hours=-1) if expired else timedelta(hours=24)
    verification = EmailVerification(
        verification_code=generate_verification_code(64),
        user_code=user_code,
        entity_type=entity_type,
        entity_code=entity_code,
        expires_at=now + delta,
    )
    db_session.add(verification)
    await db_session.flush()
    return verification


# ---------------------------------------------------------------------------
# POST /api/v1/verify — verify code
# ---------------------------------------------------------------------------


async def test_verify_invalid_code(client):
    response = await client.post("/api/v1/verify", json={"code": "this-code-does-not-exist-at-all-12345678"})
    assert response.status_code == 400


async def test_verify_expired_code_rejected(client, db_session):
    job = await _make_active_job(db_session, job_code="expjob00001", email="exp@example.com")
    verification = await _make_verification(
        db_session, entity_type="job", entity_code=job.job_code, user_code=job.user_code, expired=True
    )
    response = await client.post("/api/v1/verify", json={"code": verification.verification_code})
    assert response.status_code == 400


async def test_verify_job_activates_all_pending_for_email(client, db_session):
    """Verifying one code activates ALL pending listings for that user_code."""
    from sqlalchemy import select

    email = "multiverify@example.com"
    # Both jobs share the same user — _make_user is idempotent for the same email
    job1 = await _make_active_job(db_session, job_code="multijob001", email=email)
    job2 = await _make_active_job(db_session, job_code="multijob002", email=email)

    # Both jobs share the same user_code (same email)
    assert job1.user_code == job2.user_code

    # Only one verification code needed
    verification = await _make_verification(
        db_session, entity_type="job", entity_code=job1.job_code, user_code=job1.user_code
    )

    response = await client.post("/api/v1/verify", json={"code": verification.verification_code})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "session_token" in data

    # Both jobs should now be active
    for code in (job1.job_code, job2.job_code):
        result = await db_session.execute(select(Job).where(Job.job_code == code))
        j = result.scalar_one()
        assert j.status == "active", f"Expected active for {code}, got {j.status}"


async def test_verify_profile_code_activates_profile(client, db_session):
    from sqlalchemy import select

    email = "profverify@example.com"
    profile = await _make_pending_profile(db_session, email=email)
    verification = await _make_verification(
        db_session, entity_type="profile", entity_code=profile.profile_code, user_code=profile.user_code
    )

    response = await client.post("/api/v1/verify", json={"code": verification.verification_code})
    assert response.status_code == 200
    assert response.json()["success"] is True

    result = await db_session.execute(select(Profile).where(Profile.profile_code == profile.profile_code))
    p = result.scalar_one()
    assert p.status == "active"


async def test_verify_code_cannot_be_used_twice(client, db_session):
    email = "onetimev@example.com"
    job = await _make_active_job(db_session, job_code="onetimej01", email=email)
    verification = await _make_verification(
        db_session, entity_type="job", entity_code=job.job_code, user_code=job.user_code
    )

    r1 = await client.post("/api/v1/verify", json={"code": verification.verification_code})
    assert r1.status_code == 200

    r2 = await client.post("/api/v1/verify", json={"code": verification.verification_code})
    assert r2.status_code == 400


# ---------------------------------------------------------------------------
# POST /api/v1/verify/resend
# ---------------------------------------------------------------------------


async def test_resend_missing_fields(client):
    response = await client.post("/api/v1/verify/resend", json={})
    assert response.status_code == 422


async def test_resend_job_not_found_returns_404(client):
    with patch("app.services.email_service.send_verification_email", new_callable=AsyncMock):
        response = await client.post(
            "/api/v1/verify/resend",
            json={
                "entity_type": "job",
                "email": "nobody@example.com",
            },
        )
    assert response.status_code == 404


async def test_resend_profile_not_found_returns_404(client):
    with patch("app.services.email_service.send_verification_email", new_callable=AsyncMock):
        response = await client.post(
            "/api/v1/verify/resend",
            json={
                "entity_type": "profile",
                "email": "nobody@example.com",
            },
        )
    assert response.status_code == 404


async def test_resend_job_success(client, db_session):
    await _make_active_job(db_session, job_code="resendj0001", email="resend@example.com")

    with patch("app.services.email_service.send_verification_email", new_callable=AsyncMock) as mock_send:
        response = await client.post(
            "/api/v1/verify/resend",
            json={
                "entity_type": "job",
                "email": "resend@example.com",
                "entity_code": "resendj0001",
            },
        )

    assert response.status_code == 200
    mock_send.assert_called_once()


async def test_resend_rate_limit_exceeded(client, db_session):
    """After 3 resend attempts, the 4th should be rejected with 429."""
    from app.constants import RESEND_LIMIT_PER_ENTITY

    await _make_active_job(db_session, job_code="ratelimitj1", email="ratelimit@example.com")

    with patch("app.services.email_service.send_verification_email", new_callable=AsyncMock):
        for _ in range(RESEND_LIMIT_PER_ENTITY):
            r = await client.post(
                "/api/v1/verify/resend",
                json={"entity_type": "job", "email": "ratelimit@example.com", "entity_code": "ratelimitj1"},
            )
            assert r.status_code == 200

        # One over the limit
        r = await client.post(
            "/api/v1/verify/resend",
            json={"entity_type": "job", "email": "ratelimit@example.com", "entity_code": "ratelimitj1"},
        )
    assert r.status_code == 429
