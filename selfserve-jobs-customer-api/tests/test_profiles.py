"""Tests for profile endpoints: list, create, update, deactivate/activate, delete, token validation."""

from datetime import UTC, datetime, timedelta

from app.models.profile import Profile
from app.services.code_generator import generate_token

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
    "key_skills": ["Python", "Django", "PostgreSQL"],
}


async def _make_profile(db_session, **overrides) -> Profile:
    now = datetime.now(UTC)
    edit_token = generate_token(64)
    fields = dict(
        profile_code="testprof001",
        person_name="Jane Smith",
        email="jane@example.com",
        email_verified=True,
        contact_number="+44 7700 900123",
        brief="Experienced engineer.",
        current_city="Manchester",
        current_country="United Kingdom",
        years_of_experience=8,
        current_title="Senior Software Engineer",
        relocation_preference="open",
        key_skills=["Python"],
        status="active",
        view_count=0,
        edit_token=edit_token,
        expires_at=now + timedelta(days=180),
        created_at=now,
        updated_at=now,
    )
    fields.update(overrides)
    profile = Profile(**fields)
    db_session.add(profile)
    await db_session.flush()
    return profile


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


async def test_get_removed_profile_returns_404(client, db_session):
    await _make_profile(db_session, profile_code="removedpr1", status="removed")
    response = await client.get("/api/v1/profiles/removedpr1")
    assert response.status_code == 404


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
