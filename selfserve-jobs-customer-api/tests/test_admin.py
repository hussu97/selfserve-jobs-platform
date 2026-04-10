"""Tests for admin endpoints: list pending recruiters, approve, reject."""

from unittest.mock import AsyncMock, MagicMock, patch

from app.models.recruiter import Recruiter

ADMIN_SECRET = "test-admin-secret"
ADMIN_HEADER = {"X-Admin-Secret": ADMIN_SECRET}


def _mock_settings():
    """Return a mock settings object with admin_api_secret set."""
    mock = MagicMock()
    mock.admin_api_secret = ADMIN_SECRET
    mock.is_production = False
    return mock


async def _make_recruiter(db_session, *, code: str, email: str, status: str = "pending_approval") -> Recruiter:
    recruiter = Recruiter(
        recruiter_code=code,
        email=email,
        name="Test Recruiter",
        linkedin_profile_url="https://linkedin.com/in/test",
        status=status,
    )
    db_session.add(recruiter)
    await db_session.flush()
    return recruiter


# ---------------------------------------------------------------------------
# Authentication guard
# ---------------------------------------------------------------------------


async def test_admin_endpoints_require_secret(client):
    r = await client.get("/api/v1/admin/recruiters/pending")
    assert r.status_code == 422  # missing required header → FastAPI validation error


async def test_admin_endpoints_reject_wrong_secret(client):
    with patch("app.routers.admin.settings", _mock_settings()):
        r = await client.get(
            "/api/v1/admin/recruiters/pending",
            headers={"X-Admin-Secret": "wrong-secret"},
        )
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# GET /api/v1/admin/recruiters/pending
# ---------------------------------------------------------------------------


async def test_list_pending_recruiters_empty(client):
    with patch("app.routers.admin.settings", _mock_settings()):
        r = await client.get("/api/v1/admin/recruiters/pending", headers=ADMIN_HEADER)
    assert r.status_code == 200
    assert r.json() == []


async def test_list_pending_recruiters_returns_pending_only(client, db_session):
    await _make_recruiter(db_session, code="pend000001", email="pending@example.com", status="pending_approval")
    await _make_recruiter(db_session, code="actv000001", email="active@example.com", status="active")

    with patch("app.routers.admin.settings", _mock_settings()):
        r = await client.get("/api/v1/admin/recruiters/pending", headers=ADMIN_HEADER)

    assert r.status_code == 200
    codes = [item["code"] for item in r.json()]
    assert "pend000001" in codes
    assert "actv000001" not in codes


# ---------------------------------------------------------------------------
# POST /api/v1/admin/recruiters/{code}/approve
# ---------------------------------------------------------------------------


async def test_approve_recruiter_success(client, db_session):
    recruiter = await _make_recruiter(db_session, code="appr000001", email="appr@example.com")

    with (
        patch("app.routers.admin.settings", _mock_settings()),
        patch("app.services.email_service.send_recruiter_approved_email", new_callable=AsyncMock),
    ):
        r = await client.post(
            f"/api/v1/admin/recruiters/{recruiter.recruiter_code}/approve",
            headers=ADMIN_HEADER,
        )

    assert r.status_code == 200
    assert r.json()["status"] == "active"


async def test_approve_nonexistent_recruiter_returns_404(client):
    with patch("app.routers.admin.settings", _mock_settings()):
        r = await client.post("/api/v1/admin/recruiters/doesnotexist/approve", headers=ADMIN_HEADER)
    assert r.status_code == 404


async def test_approve_already_active_recruiter_returns_400(client, db_session):
    recruiter = await _make_recruiter(db_session, code="alrdy00001", email="alrdy@example.com", status="active")

    with (
        patch("app.routers.admin.settings", _mock_settings()),
        patch("app.services.email_service.send_recruiter_approved_email", new_callable=AsyncMock),
    ):
        r = await client.post(
            f"/api/v1/admin/recruiters/{recruiter.recruiter_code}/approve",
            headers=ADMIN_HEADER,
        )

    assert r.status_code == 400


# ---------------------------------------------------------------------------
# POST /api/v1/admin/recruiters/{code}/reject
# ---------------------------------------------------------------------------


async def test_reject_recruiter_success(client, db_session):
    recruiter = await _make_recruiter(db_session, code="rej0000001", email="rej@example.com")

    with (
        patch("app.routers.admin.settings", _mock_settings()),
        patch("app.services.email_service.send_recruiter_rejected_email", new_callable=AsyncMock),
    ):
        r = await client.post(
            f"/api/v1/admin/recruiters/{recruiter.recruiter_code}/reject",
            headers=ADMIN_HEADER,
        )

    assert r.status_code == 200
    assert r.json()["status"] == "rejected"


async def test_reject_nonexistent_recruiter_returns_404(client):
    with patch("app.routers.admin.settings", _mock_settings()):
        r = await client.post("/api/v1/admin/recruiters/doesnotexist/reject", headers=ADMIN_HEADER)
    assert r.status_code == 404
