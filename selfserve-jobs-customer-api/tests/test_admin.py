"""Tests for admin endpoints: auth, list users/recruiters/reports, approve, reject."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

from app.models.auth_session import AuthSession
from app.models.recruiter import Recruiter
from app.models.recruiter_rejection_reason import RecruiterRejectionReason
from app.routers.admin import _get_admin_session

ADMIN_EMAIL = "admin@example.com"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _make_admin_session(db_session, email: str = ADMIN_EMAIL) -> AuthSession:
    session = AuthSession(
        session_token="admin-test-token-" + email.replace("@", "-"),
        email=email,
        user_type="admin",
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )
    db_session.add(session)
    await db_session.flush()
    return session


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


async def _make_rejection_reason(
    db_session, code: str = "policy_violation", name: str = "Policy Violation"
) -> RecruiterRejectionReason:
    reason = RecruiterRejectionReason(code=code, name=name)
    db_session.add(reason)
    await db_session.flush()
    return reason


def _admin_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Authentication guard
# ---------------------------------------------------------------------------


async def test_admin_endpoints_reject_missing_auth(client):
    r = await client.get("/api/v1/admin/recruiters")
    assert r.status_code == 401


async def test_admin_endpoints_reject_non_admin_session(client, db_session):
    # Create a regular (non-admin) session
    session = AuthSession(
        session_token="regular-token",
        email="user@example.com",
        user_type=None,
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )
    db_session.add(session)
    await db_session.flush()

    r = await client.get("/api/v1/admin/recruiters", headers={"Authorization": "Bearer regular-token"})
    assert r.status_code == 403


# ---------------------------------------------------------------------------
# POST /api/v1/admin/login
# ---------------------------------------------------------------------------


async def test_admin_login_rejects_non_admin_email(client):
    with patch("app.routers.admin.settings") as mock_settings:
        mock_settings.admin_email_list = [ADMIN_EMAIL]
        mock_settings.is_production = False
        r = await client.post("/api/v1/admin/login", json={"email": "notadmin@example.com"})
    assert r.status_code == 403


async def test_admin_login_dev_mode_returns_url(client, db_session):
    with (
        patch("app.routers.admin.settings") as mock_settings,
        patch("app.routers.admin.auth_service.create_login_token", new_callable=AsyncMock) as mock_token,
    ):
        mock_token_obj = AsyncMock()
        mock_token_obj.token = "fake-token-value"
        mock_token.return_value = mock_token_obj
        mock_settings.admin_email_list = [ADMIN_EMAIL]
        mock_settings.is_production = False
        mock_settings.frontend_url = "http://localhost:3000"

        r = await client.post("/api/v1/admin/login", json={"email": ADMIN_EMAIL})

    assert r.status_code == 200
    data = r.json()
    assert "url" in data
    assert "/admin/verify" in data["url"]


# ---------------------------------------------------------------------------
# GET /api/v1/admin/recruiters
# ---------------------------------------------------------------------------


async def test_list_recruiters_requires_auth(client):
    r = await client.get("/api/v1/admin/recruiters")
    assert r.status_code == 401


async def test_list_recruiters_empty(client, db_session):
    session = await _make_admin_session(db_session)

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.get("/api/v1/admin/recruiters")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data


async def test_list_recruiters_returns_all_statuses(client, db_session):
    await _make_recruiter(db_session, code="pend000001", email="pending@example.com", status="pending_approval")
    await _make_recruiter(db_session, code="actv000001", email="active@example.com", status="active")
    session = await _make_admin_session(db_session)

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.get("/api/v1/admin/recruiters")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200
    codes = [item["recruiter_code"] for item in r.json()["items"]]
    assert "pend000001" in codes
    assert "actv000001" in codes


async def test_list_recruiters_status_filter(client, db_session):
    await _make_recruiter(db_session, code="pend000002", email="pend2@example.com", status="pending_approval")
    await _make_recruiter(db_session, code="actv000002", email="actv2@example.com", status="active")
    session = await _make_admin_session(db_session, email="admin2@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.get("/api/v1/admin/recruiters?status=pending_approval")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200
    codes = [item["recruiter_code"] for item in r.json()["items"]]
    assert "pend000002" in codes
    assert "actv000002" not in codes


# ---------------------------------------------------------------------------
# POST /api/v1/admin/recruiters/{code}/approve
# ---------------------------------------------------------------------------


async def test_approve_recruiter_success(client, db_session):
    recruiter = await _make_recruiter(db_session, code="appr000001", email="appr@example.com")
    session = await _make_admin_session(db_session, email="admin3@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override

    with patch("app.services.email_service.send_recruiter_approved_email", new_callable=AsyncMock):
        r = await client.post(f"/api/v1/admin/recruiters/{recruiter.recruiter_code}/approve")

    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200
    assert r.json()["status"] == "active"


async def test_approve_nonexistent_recruiter_returns_404(client, db_session):
    session = await _make_admin_session(db_session, email="admin4@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.post("/api/v1/admin/recruiters/doesnotexist/approve")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/v1/admin/recruiters/{code}/reject
# ---------------------------------------------------------------------------


async def test_reject_recruiter_success(client, db_session):
    reason = await _make_rejection_reason(db_session)
    recruiter = await _make_recruiter(db_session, code="rej0000001", email="rej@example.com")
    session = await _make_admin_session(db_session, email="admin5@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override

    with patch("app.services.email_service.send_recruiter_rejected_email", new_callable=AsyncMock):
        r = await client.post(
            f"/api/v1/admin/recruiters/{recruiter.recruiter_code}/reject",
            json={"reason_code": reason.code, "comment": "Test comment"},
        )

    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200
    assert r.json()["status"] == "rejected"


async def test_reject_with_unknown_reason_code_returns_400(client, db_session):
    recruiter = await _make_recruiter(db_session, code="rej0000002", email="rej2@example.com")
    session = await _make_admin_session(db_session, email="admin6@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.post(
        f"/api/v1/admin/recruiters/{recruiter.recruiter_code}/reject",
        json={"reason_code": "nonexistent_code"},
    )
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 400


async def test_reject_nonexistent_recruiter_returns_404(client, db_session):
    await _make_rejection_reason(db_session, code="policy_violation_2", name="PV2")
    session = await _make_admin_session(db_session, email="admin7@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.post(
        "/api/v1/admin/recruiters/doesnotexist/reject",
        json={"reason_code": "policy_violation_2"},
    )
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 404


# ---------------------------------------------------------------------------
# GET /api/v1/admin/rejection-reasons
# ---------------------------------------------------------------------------


async def test_get_rejection_reasons(client, db_session):
    await _make_rejection_reason(db_session, code="spam_r", name="Spam")
    session = await _make_admin_session(db_session, email="admin8@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.get("/api/v1/admin/rejection-reasons")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200
    codes = [item["code"] for item in r.json()]
    assert "spam_r" in codes
