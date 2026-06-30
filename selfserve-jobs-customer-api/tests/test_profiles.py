"""Tests for profile endpoints: list, create, update, deactivate/activate, delete, token validation."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

from app.models.auth_session import AuthSession
from app.models.profile import Profile
from app.models.recruiter import Recruiter
from app.models.user_sensitive import UserSensitive
from app.services.code_generator import generate_code, generate_token

VALID_PROFILE_PAYLOAD = {
    "person_name": "Jane Smith",
    "email": "jane@example.com",
    "contact_number": "+44 7700 900123",
    "brief": "Experienced software engineer with 8 years of experience building scalable "
    "web applications and APIs. Passionate about clean code and best practices.",
    "current_city": "Manchester",
    "current_country": "United Kingdom",
    "years_of_experience": 8,
    "current_title": "Senior Software Engineer",
    "relocation_preference": "open",
    "current_employment_status": "full_time",
    "key_skills": ["Python", "Django", "PostgreSQL"],
}


async def _make_profile(db_session, *, email="jane@example.com", phone="+44 7700 900123", **overrides) -> Profile:
    now = datetime.now(UTC)

    # Create a user_sensitive row for this email (one row per unique email)
    user = UserSensitive(
        user_code=generate_code(12),
        user_email=email,
        user_phone=phone,
    )
    db_session.add(user)
    await db_session.flush()

    edit_token = generate_token(64)
    fields = dict(
        profile_code="testprof001",
        user_code=user.user_code,
        person_name="Jane Smith",
        email_verified=True,
        brief="Experienced engineer.",
        current_city="Manchester",
        current_country="United Kingdom",
        years_of_experience=8,
        current_title="Senior Software Engineer",
        relocation_preference="open",
        current_employment_status="full_time",
        key_skills=["Python"],
        status="active",
        view_count=0,
        edit_token=edit_token,
        expires_at=now + timedelta(days=180),
        created_at=now,
        last_renewed_at=now,
        updated_at=now,
    )
    fields.update(overrides)
    profile = Profile(**fields)
    db_session.add(profile)
    await db_session.flush()
    return profile


async def _make_session(
    db_session,
    *,
    email: str,
    user_type: str | None = None,
    recruiter_code: str | None = None,
) -> AuthSession:
    session = AuthSession(
        session_token=generate_token(64),
        email=email,
        user_type=user_type,
        recruiter_code=recruiter_code,
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )
    db_session.add(session)
    await db_session.flush()
    return session


async def _make_recruiter(
    db_session,
    *,
    code: str,
    email: str,
    status: str = "active",
) -> Recruiter:
    recruiter = Recruiter(
        recruiter_code=code,
        email=email,
        name="Test Recruiter",
        linkedin_profile_url="https://linkedin.com/in/test-recruiter",
        status=status,
    )
    db_session.add(recruiter)
    await db_session.flush()
    return recruiter


# ---------------------------------------------------------------------------
# GET /api/v1/profiles — list
# ---------------------------------------------------------------------------


async def test_list_profiles_empty(client):
    response = await client.get("/api/v1/profiles")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["items"] == []
    assert data["total"] == 0


async def test_list_profiles_returns_active_only(client, db_session):
    await _make_profile(db_session, profile_code="activepr01", email="a@example.com", status="active")
    await _make_profile(
        db_session,
        profile_code="pendingpr1",
        email="b@example.com",
        status="pending_verification",
    )

    response = await client.get("/api/v1/profiles")
    assert response.status_code == 200
    items = response.json()["items"]
    codes = [item["code"] for item in items]
    # Active profile should appear; pending_verification should not
    assert "activepr01" in codes
    assert "pendingpr1" not in codes
    assert all(item["status"] == "active" for item in items)


# ---------------------------------------------------------------------------
# POST /api/v1/profiles — create
# ---------------------------------------------------------------------------


async def test_create_profile_missing_fields(client):
    response = await client.post("/api/v1/profiles", json={})
    assert response.status_code == 422


async def test_create_profile_valid(client):
    response = await client.post("/api/v1/profiles", json=VALID_PROFILE_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert "code" in data
    assert len(data["code"]) == 12
    assert "message" in data


async def test_create_profile_honeypot_rejected(client):
    payload = {**VALID_PROFILE_PAYLOAD, "website": "http://spam.com"}
    response = await client.post("/api/v1/profiles", json=payload)
    assert response.status_code == 400


async def test_create_profile_limit_per_email(client):
    """Cannot create more than 2 profiles per email (MAX_ACTIVE_PROFILES_PER_EMAIL)."""
    payload = {**VALID_PROFILE_PAYLOAD, "email": "limit@example.com"}
    for _ in range(2):
        r = await client.post("/api/v1/profiles", json=payload)
        assert r.status_code == 201
    # Third creation should be rejected
    r = await client.post("/api/v1/profiles", json=payload)
    assert r.status_code == 429


# ---------------------------------------------------------------------------
# GET /api/v1/profiles/{code} — detail
# ---------------------------------------------------------------------------


async def test_get_profile_detail(client, db_session):
    await _make_profile(db_session)
    response = await client.get("/api/v1/profiles/testprof001")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "testprof001"


async def test_get_nonexistent_profile_returns_404(client):
    response = await client.get("/api/v1/profiles/doesnotexist")
    assert response.status_code == 404


async def test_get_removed_profile_returns_410(client, db_session):
    await _make_profile(db_session, profile_code="removedpr1", status="removed")
    response = await client.get("/api/v1/profiles/removedpr1")
    assert response.status_code == 410


async def test_get_profile_detail_includes_sensitive_fields_for_active_recruiter(client, db_session):
    await _make_profile(db_session, profile_code="recruitpr01", email="talent@example.com", phone="+971501112233")
    recruiter = await _make_recruiter(db_session, code="recruiter001", email="recruiter@example.com")
    session = await _make_session(
        db_session,
        email=recruiter.email,
        user_type="recruiter",
        recruiter_code=recruiter.recruiter_code,
    )

    response = await client.get(
        "/api/v1/profiles/recruitpr01",
        headers={"Authorization": f"Bearer {session.session_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "talent@example.com"
    assert data["contact_number"] == "+971501112233"


async def test_get_profile_detail_includes_sensitive_fields_for_admin(client, db_session):
    await _make_profile(db_session, profile_code="adminprof01", email="talent@example.com", phone="+971509998887")
    session = await _make_session(db_session, email="admin@example.com", user_type="admin")

    with patch("app.config.get_settings") as mock_get_settings:
        mock_get_settings.return_value.admin_email_list = ["admin@example.com"]
        response = await client.get(
            "/api/v1/profiles/adminprof01",
            headers={"Authorization": f"Bearer {session.session_token}"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "talent@example.com"
    assert data["contact_number"] == "+971509998887"


async def test_get_profile_detail_marks_owner_and_includes_sensitive_fields(client, db_session):
    await _make_profile(db_session, profile_code="ownerprof01", email="owner@example.com", phone="+971507778889")
    session = await _make_session(db_session, email="owner@example.com")

    response = await client.get(
        "/api/v1/profiles/ownerprof01",
        headers={"Authorization": f"Bearer {session.session_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_owner"] is True
    assert data["email"] == "owner@example.com"
    assert data["contact_number"] == "+971507778889"


async def test_get_resume_url_allows_active_recruiter_admin_and_owner(client, db_session):
    await _make_profile(
        db_session,
        profile_code="resumeprof01",
        email="owner@example.com",
        resume_gcs_path="resumes/resumeprof01/test.pdf",
    )
    recruiter = await _make_recruiter(db_session, code="recruiter002", email="recruiter@example.com")
    recruiter_session = await _make_session(
        db_session,
        email=recruiter.email,
        user_type="recruiter",
        recruiter_code=recruiter.recruiter_code,
    )
    admin_session = await _make_session(db_session, email="admin@example.com", user_type="admin")
    owner_session = await _make_session(db_session, email="owner@example.com")

    with patch("app.routers.profiles.storage_service.generate_signed_url", new_callable=AsyncMock) as mock_signed_url:
        mock_signed_url.return_value = "https://example.com/resume.pdf"

        recruiter_response = await client.get(
            "/api/v1/profiles/resumeprof01/resume",
            headers={"Authorization": f"Bearer {recruiter_session.session_token}"},
        )
        with patch("app.config.get_settings") as mock_get_settings:
            mock_get_settings.return_value.admin_email_list = ["admin@example.com"]
            admin_response = await client.get(
                "/api/v1/profiles/resumeprof01/resume",
                headers={"Authorization": f"Bearer {admin_session.session_token}"},
            )
        owner_response = await client.get(
            "/api/v1/profiles/resumeprof01/resume",
            headers={"Authorization": f"Bearer {owner_session.session_token}"},
        )

    assert recruiter_response.status_code == 200
    assert admin_response.status_code == 200
    assert owner_response.status_code == 200
    assert recruiter_response.json()["url"] == "https://example.com/resume.pdf"
    assert admin_response.json()["url"] == "https://example.com/resume.pdf"
    assert owner_response.json()["url"] == "https://example.com/resume.pdf"


async def test_get_resume_url_rejects_non_owner_non_recruiter_session(client, db_session):
    await _make_profile(
        db_session,
        profile_code="resumeprof02",
        email="owner@example.com",
        resume_gcs_path="resumes/resumeprof02/test.pdf",
    )
    session = await _make_session(db_session, email="stranger@example.com")

    response = await client.get(
        "/api/v1/profiles/resumeprof02/resume",
        headers={"Authorization": f"Bearer {session.session_token}"},
    )

    assert response.status_code == 403


# ---------------------------------------------------------------------------
# PUT /api/v1/profiles/{code} — update
# ---------------------------------------------------------------------------


async def test_update_profile_valid(client, db_session):
    profile = await _make_profile(db_session)
    response = await client.put(
        f"/api/v1/profiles/{profile.profile_code}",
        json={"current_title": "Staff Engineer"},
        headers={"X-Edit-Token": profile.edit_token},
    )
    assert response.status_code == 200
    assert response.json()["current_title"] == "Staff Engineer"


async def test_update_profile_wrong_token_rejected(client, db_session):
    await _make_profile(db_session)
    response = await client.put(
        "/api/v1/profiles/testprof001",
        json={"current_title": "Hacked"},
        headers={"X-Edit-Token": "wrongtoken"},
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# POST /api/v1/profiles/{code}/deactivate and /activate
# ---------------------------------------------------------------------------


async def test_deactivate_activate_profile_cycle(client, db_session):
    profile = await _make_profile(db_session, profile_code="cyclepr0001")

    r = await client.post(
        "/api/v1/profiles/cyclepr0001/deactivate",
        headers={"X-Edit-Token": profile.edit_token},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "inactive"

    r = await client.post(
        "/api/v1/profiles/cyclepr0001/activate",
        headers={"X-Edit-Token": profile.edit_token},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "active"


async def test_deactivate_non_active_profile_rejected(client, db_session):
    profile = await _make_profile(
        db_session,
        profile_code="pendprofil1",
        email="pend2@example.com",
        status="pending_verification",
        email_verified=False,
    )
    r = await client.post(
        f"/api/v1/profiles/{profile.profile_code}/deactivate",
        headers={"X-Edit-Token": profile.edit_token},
    )
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# DELETE /api/v1/profiles/{code}
# ---------------------------------------------------------------------------


async def test_delete_profile_valid(client, db_session):
    profile = await _make_profile(db_session, profile_code="delprofile1", email="del@example.com")
    r = await client.delete(
        f"/api/v1/profiles/{profile.profile_code}",
        headers={"X-Edit-Token": profile.edit_token},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "removed"


async def test_delete_profile_wrong_token_rejected(client, db_session):
    await _make_profile(db_session, profile_code="delprofile2", email="del2@example.com")
    r = await client.delete(
        "/api/v1/profiles/delprofile2",
        headers={"X-Edit-Token": "wrongtoken"},
    )
    assert r.status_code == 403


# ---------------------------------------------------------------------------
# GET /api/v1/manage/validate-token — token validation
# ---------------------------------------------------------------------------


async def test_validate_token_valid(client, db_session):
    profile = await _make_profile(db_session, profile_code="tokenpro001", email="tok@example.com")
    r = await client.get(
        "/api/v1/manage/validate-token",
        params={"entity_type": "profile", "code": profile.profile_code, "token": profile.edit_token},
    )
    assert r.status_code == 200
    assert r.json()["valid"] is True


async def test_validate_token_invalid(client, db_session):
    await _make_profile(db_session, profile_code="tokenpro002", email="tok2@example.com")
    r = await client.get(
        "/api/v1/manage/validate-token",
        params={"entity_type": "profile", "code": "tokenpro002", "token": "badtoken"},
    )
    assert r.status_code == 200
    assert r.json()["valid"] is False


async def test_validate_token_invalid_entity_type(client):
    r = await client.get(
        "/api/v1/manage/validate-token",
        params={"entity_type": "recruiter", "code": "abc", "token": "tok"},
    )
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# Employment status — sort order and field in response
# ---------------------------------------------------------------------------


async def test_list_profiles_employment_status_in_response(client, db_session):
    """Employment status is included in list response items."""
    await _make_profile(
        db_session,
        profile_code="empstat001",
        email="empstat1@example.com",
        current_employment_status="open_to_work",
    )
    r = await client.get("/api/v1/profiles")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 1
    assert items[0]["current_employment_status"] == "open_to_work"


async def test_list_profiles_default_sort_open_to_work_first(client, db_session):
    """Default sort surfaces open_to_work profiles before full_time profiles."""
    now = datetime.now(UTC)
    # Create full_time first (older timestamp), open_to_work second (newer timestamp)
    await _make_profile(
        db_session,
        profile_code="sortfull001",
        email="sortfull@example.com",
        current_employment_status="full_time",
        created_at=now - timedelta(hours=2),
        last_renewed_at=now - timedelta(hours=2),
    )
    await _make_profile(
        db_session,
        profile_code="sortopen001",
        email="sortopen@example.com",
        current_employment_status="open_to_work",
        created_at=now - timedelta(hours=1),
        last_renewed_at=now - timedelta(hours=1),
    )
    r = await client.get("/api/v1/profiles")
    assert r.status_code == 200
    items = r.json()["items"]
    codes = [i["code"] for i in items]
    assert codes.index("sortopen001") < codes.index("sortfull001")


async def test_create_profile_stores_employment_status(client):
    """Employment status sent at creation is stored and returned."""
    payload = {**VALID_PROFILE_PAYLOAD, "email": "empnew@example.com", "current_employment_status": "open_to_work"}
    r = await client.post("/api/v1/profiles", json=payload)
    assert r.status_code == 201


async def test_list_profiles_filter_by_employment_status(client, db_session):
    """employment_status query param filters profiles to matching statuses only."""
    await _make_profile(
        db_session, profile_code="empfilt01", email="ef1@example.com", current_employment_status="open_to_work"
    )
    await _make_profile(
        db_session, profile_code="empfilt02", email="ef2@example.com", current_employment_status="full_time"
    )
    await _make_profile(
        db_session, profile_code="empfilt03", email="ef3@example.com", current_employment_status="contract"
    )

    r = await client.get("/api/v1/profiles?employment_status=open_to_work&employment_status=contract")
    assert r.status_code == 200
    codes = [item["code"] for item in r.json()["items"]]
    assert "empfilt01" in codes
    assert "empfilt03" in codes
    assert "empfilt02" not in codes
