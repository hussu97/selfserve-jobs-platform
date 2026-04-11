"""Tests for auth endpoints: login, verify, logout, me, entities, activate/deactivate."""

from datetime import UTC, datetime, timedelta

from app.models.auth_session import AuthSession
from app.models.job import Job
from app.models.login_token import LoginToken
from app.models.user_sensitive import UserSensitive
from app.services.code_generator import generate_code, generate_token


async def _make_user(db_session, *, email: str) -> UserSensitive:
    from sqlalchemy import select

    result = await db_session.execute(select(UserSensitive).where(UserSensitive.user_email == email))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    user = UserSensitive(user_code=generate_code(12), user_email=email)
    db_session.add(user)
    await db_session.flush()
    return user


# ---------------------------------------------------------------------------
# POST /auth/login (non-production auto-login)
# ---------------------------------------------------------------------------


async def test_login_non_production_returns_session_token(client):
    """Non-production: login with email returns session_token immediately."""
    response = await client.post("/api/v1/auth/login", json={"email": "user@example.com"})
    assert response.status_code == 200
    data = response.json()
    assert "session_token" in data
    assert data["session_token"] is not None


async def test_login_normalizes_email(client):
    response = await client.post("/api/v1/auth/login", json={"email": "  User@Example.COM  "})
    assert response.status_code == 200
    data = response.json()
    assert data["session_token"] is not None


async def test_login_invalid_email_rejected(client):
    response = await client.post("/api/v1/auth/login", json={"email": "not-an-email"})
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# POST /auth/verify — login token flow
# ---------------------------------------------------------------------------


async def test_verify_valid_login_token(client, db_session):
    """Consuming a valid login token creates a session."""
    now = datetime.now(UTC)
    token = LoginToken(
        token=generate_token(64),
        email="tok@example.com",
        used=False,
        expires_at=now + timedelta(minutes=15),
    )
    db_session.add(token)
    await db_session.flush()

    response = await client.post(f"/api/v1/auth/verify?token={token.token}")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "tok@example.com"
    assert "session_token" in data


async def test_verify_expired_token_rejected(client, db_session):
    now = datetime.now(UTC)
    token = LoginToken(
        token=generate_token(64),
        email="exp@example.com",
        used=False,
        expires_at=now - timedelta(minutes=1),  # already expired
    )
    db_session.add(token)
    await db_session.flush()

    response = await client.post(f"/api/v1/auth/verify?token={token.token}")
    assert response.status_code == 400


async def test_verify_used_token_rejected(client, db_session):
    now = datetime.now(UTC)
    token = LoginToken(
        token=generate_token(64),
        email="used@example.com",
        used=True,
        expires_at=now + timedelta(minutes=15),
    )
    db_session.add(token)
    await db_session.flush()

    response = await client.post(f"/api/v1/auth/verify?token={token.token}")
    assert response.status_code == 400


async def test_verify_token_marked_used(client, db_session):
    """After consuming a login token it should be marked used."""
    from sqlalchemy import select

    now = datetime.now(UTC)
    token_str = generate_token(64)
    token = LoginToken(
        token=token_str,
        email="mark@example.com",
        used=False,
        expires_at=now + timedelta(minutes=15),
    )
    db_session.add(token)
    await db_session.flush()

    await client.post(f"/api/v1/auth/verify?token={token_str}")

    result = await db_session.execute(select(LoginToken).where(LoginToken.token == token_str))
    stored = result.scalar_one()
    assert stored.used is True


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------


async def test_me_with_valid_session(client, db_session):
    now = datetime.now(UTC)
    session = AuthSession(
        session_token=generate_token(64),
        email="me@example.com",
        expires_at=now + timedelta(days=30),
    )
    db_session.add(session)
    await db_session.flush()

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {session.session_token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


async def test_me_without_session_unauthorized(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


async def test_me_expired_session_unauthorized(client, db_session):
    now = datetime.now(UTC)
    session = AuthSession(
        session_token=generate_token(64),
        email="exp@example.com",
        expires_at=now - timedelta(days=1),
    )
    db_session.add(session)
    await db_session.flush()

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {session.session_token}"},
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# POST /auth/logout
# ---------------------------------------------------------------------------


async def test_logout_deletes_session(client, db_session):
    from sqlalchemy import select

    now = datetime.now(UTC)
    session = AuthSession(
        session_token=generate_token(64),
        email="logout@example.com",
        expires_at=now + timedelta(days=30),
    )
    db_session.add(session)
    await db_session.flush()
    token = session.session_token

    response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200

    result = await db_session.execute(select(AuthSession).where(AuthSession.session_token == token))
    assert result.scalar_one_or_none() is None


# ---------------------------------------------------------------------------
# GET /auth/entities
# ---------------------------------------------------------------------------


async def test_entities_returns_jobs_and_profiles(client, db_session):
    """Entities endpoint returns jobs and profiles for the session's email."""
    now = datetime.now(UTC)
    session = AuthSession(
        session_token=generate_token(64),
        email="owner@example.com",
        expires_at=now + timedelta(days=30),
    )
    db_session.add(session)

    user = await _make_user(db_session, email="owner@example.com")
    job = Job(
        job_code="testjob0001",
        user_code=user.user_code,
        email_verified=True,
        job_title="Test Engineer",
        company_name="Acme",
        company_city="Dubai",
        company_country="UAE",
        employment_type="full_time",
        description="Test desc",
        key_skills=["Python"],
        contact_method="email",
        contact_email="owner@example.com",
        status="active",
        view_count=0,
        expires_at=now + timedelta(days=60),
        edit_token=generate_token(64),
        created_at=now,
        updated_at=now,
    )
    db_session.add(job)
    await db_session.flush()

    response = await client.get(
        "/api/v1/auth/entities",
        headers={"Authorization": f"Bearer {session.session_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["jobs"]) == 1
    assert data["jobs"][0]["code"] == "testjob0001"
    assert data["jobs"][0]["edit_token"] == job.edit_token
    assert data["profiles"] == []


# ---------------------------------------------------------------------------
# Job deactivate / activate
# ---------------------------------------------------------------------------


async def test_job_deactivate_activate_cycle(client, db_session):
    now = datetime.now(UTC)
    edit_token = generate_token(64)
    user = await _make_user(db_session, email="toggle@example.com")
    job = Job(
        job_code="togglejob01",
        user_code=user.user_code,
        email_verified=True,
        job_title="Toggle Job",
        company_name="Co",
        company_city="Dubai",
        company_country="UAE",
        employment_type="full_time",
        description="Toggle",
        key_skills=[],
        contact_method="email",
        contact_email="toggle@example.com",
        status="active",
        view_count=0,
        expires_at=now + timedelta(days=60),
        edit_token=edit_token,
        created_at=now,
        updated_at=now,
    )
    db_session.add(job)
    await db_session.flush()

    # Deactivate
    r = await client.post(
        f"/api/v1/jobs/{job.job_code}/deactivate",
        headers={"X-Edit-Token": edit_token},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "inactive"

    # Activate
    r = await client.post(
        f"/api/v1/jobs/{job.job_code}/activate",
        headers={"X-Edit-Token": edit_token},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "active"


async def test_deactivate_non_active_job_rejected(client, db_session):
    now = datetime.now(UTC)
    edit_token = generate_token(64)
    user = await _make_user(db_session, email="pend@example.com")
    job = Job(
        job_code="pendingj001",
        user_code=user.user_code,
        email_verified=False,
        job_title="Pending Job",
        company_name="Co",
        company_city="Dubai",
        company_country="UAE",
        employment_type="full_time",
        description="Pending",
        key_skills=[],
        contact_method="email",
        contact_email="pend@example.com",
        status="pending_verification",
        view_count=0,
        expires_at=now + timedelta(days=60),
        edit_token=edit_token,
        created_at=now,
        updated_at=now,
    )
    db_session.add(job)
    await db_session.flush()

    r = await client.post(
        f"/api/v1/jobs/{job.job_code}/deactivate",
        headers={"X-Edit-Token": edit_token},
    )
    assert r.status_code == 400
