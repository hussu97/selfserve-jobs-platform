"""Tests for admin endpoints: auth, list users/recruiters/reports, approve, reject."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

from sqlalchemy import select

from app.models.admin_audit_log import AdminAuditLog
from app.models.auth_session import AuthSession
from app.models.email_verification import EmailVerification
from app.models.job import Job
from app.models.profile import Profile
from app.models.recruiter import Recruiter
from app.models.recruiter_rejection_reason import RecruiterRejectionReason
from app.models.report import Report
from app.models.user_sensitive import UserSensitive
from app.routers.admin import _get_admin_session
from app.services import auth_service
from app.services.code_generator import generate_code

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


async def _make_profile(
    db_session,
    *,
    code: str,
    email: str,
    status: str = "under_review",
    email_verified: bool = True,
) -> Profile:
    now = datetime.now(UTC)
    user = UserSensitive(
        user_code=generate_code(12),
        user_email=email,
        user_phone="+971500000000",
    )
    db_session.add(user)
    await db_session.flush()

    profile = Profile(
        profile_code=code,
        user_code=user.user_code,
        person_name="Reported Candidate",
        email_verified=email_verified,
        brief="Experienced operator.",
        current_city="Dubai",
        current_country="UAE",
        years_of_experience=8,
        current_title="Operations Manager",
        relocation_preference="open",
        current_employment_status="full_time",
        key_skills=["Operations"],
        status=status,
        view_count=0,
        edit_token="edit-token-" + code,
        expires_at=now + timedelta(days=30),
        created_at=now,
        last_renewed_at=now,
        updated_at=now,
    )
    db_session.add(profile)
    await db_session.flush()
    return profile


async def _make_job(
    db_session,
    *,
    code: str,
    user_code: str,
    contact_email: str | None,
    status: str = "active",
) -> Job:
    now = datetime.now(UTC)
    job = Job(
        job_code=code,
        user_code=user_code,
        email_verified=True,
        job_title="Product Manager",
        company_name="Example Co",
        company_city="Dubai",
        company_country="UAE",
        employment_type="full_time",
        description="Build useful products.",
        key_skills=["Product"],
        contact_method="email" if contact_email else "url",
        contact_email=contact_email,
        contact_url=None if contact_email else "https://example.com/jobs",
        status=status,
        view_count=0,
        edit_token="edit-token-" + code,
        expires_at=now + timedelta(days=30),
        created_at=now,
        last_renewed_at=now,
        updated_at=now,
    )
    db_session.add(job)
    await db_session.flush()
    return job


async def _make_report(
    db_session,
    *,
    entity_type: str,
    entity_code: str,
    status: str = "pending",
) -> Report:
    report = Report(
        report_code=generate_code(12),
        entity_type=entity_type,
        entity_code=entity_code,
        reporter_email="reporter@example.com",
        reason="spam",
        details="Suspicious listing",
        status=status,
    )
    db_session.add(report)
    await db_session.flush()
    return report


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
# POST /api/v1/admin/users/{profile_code}/resend-verification
# ---------------------------------------------------------------------------


async def test_admin_resend_user_verification_success(client, db_session):
    profile = await _make_profile(
        db_session,
        code="resendprof1",
        email="pending-user@example.com",
        status="pending_verification",
        email_verified=False,
    )
    session = await _make_admin_session(db_session, email="admin-resend@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    with patch("app.routers.admin.email_service.send_verification_email", new_callable=AsyncMock) as mock_send:
        r = await client.post(f"/api/v1/admin/users/{profile.profile_code}/resend-verification")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200
    assert "Verification email sent" in r.json()["message"]

    verification_result = await db_session.execute(
        select(EmailVerification).where(
            EmailVerification.entity_type == "profile",
            EmailVerification.entity_code == profile.profile_code,
        )
    )
    verification = verification_result.scalar_one()
    assert verification.user_code == profile.user_code

    audit_result = await db_session.execute(
        select(AdminAuditLog).where(
            AdminAuditLog.action == "resend_user_verification",
            AdminAuditLog.entity_code == profile.profile_code,
        )
    )
    assert audit_result.scalar_one().admin_email == "admin-resend@example.com"
    mock_send.assert_awaited_once()


async def test_admin_resend_user_verification_enforces_five_minute_cooldown(client, db_session):
    now = datetime.now(UTC)
    profile = await _make_profile(
        db_session,
        code="resendprof2",
        email="cooldown-user@example.com",
        status="pending_verification",
        email_verified=False,
    )
    db_session.add(
        EmailVerification(
            verification_code="c" * 64,
            user_code=profile.user_code,
            entity_type="profile",
            entity_code=profile.profile_code,
            expires_at=now + timedelta(hours=24),
            created_at=now,
        )
    )
    await db_session.flush()
    session = await _make_admin_session(db_session, email="admin-cooldown@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    with patch("app.routers.admin.email_service.send_verification_email", new_callable=AsyncMock) as mock_send:
        r = await client.post(f"/api/v1/admin/users/{profile.profile_code}/resend-verification")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 429
    assert "Try again after" in r.json()["detail"]
    mock_send.assert_not_awaited()


async def test_admin_resend_user_verification_rejects_verified_profile(client, db_session):
    profile = await _make_profile(
        db_session,
        code="resendprof3",
        email="verified-user@example.com",
        status="active",
        email_verified=True,
    )
    session = await _make_admin_session(db_session, email="admin-verified@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.post(f"/api/v1/admin/users/{profile.profile_code}/resend-verification")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 409


async def test_admin_update_user_email_moves_profile_and_jobs_to_new_login(client, db_session):
    primary_profile = await _make_profile(
        db_session,
        code="emailprof001",
        email="old-user@example.com",
        status="active",
        email_verified=True,
    )
    user = (
        await db_session.execute(select(UserSensitive).where(UserSensitive.user_code == primary_profile.user_code))
    ).scalar_one()
    now = datetime.now(UTC)
    second_profile = Profile(
        profile_code="emailprof002",
        user_code=user.user_code,
        person_name="Second Candidate",
        email_verified=True,
        brief="Another profile.",
        current_city="Dubai",
        current_country="UAE",
        years_of_experience=5,
        current_title="Designer",
        relocation_preference="open",
        current_employment_status="full_time",
        key_skills=["Design"],
        status="active",
        view_count=0,
        edit_token="edit-token-emailprof002",
        expires_at=now + timedelta(days=30),
        created_at=now,
        last_renewed_at=now,
        updated_at=now,
    )
    db_session.add(second_profile)
    matching_contact_job = await _make_job(
        db_session,
        code="emailjob001",
        user_code=user.user_code,
        contact_email="old-user@example.com",
    )
    custom_contact_job = await _make_job(
        db_session,
        code="emailjob002",
        user_code=user.user_code,
        contact_email="custom@example.com",
    )
    admin_session = await _make_admin_session(db_session, email="admin-email-change@example.com")
    old_user_session = AuthSession(
        session_token="old-user-session",
        email="old-user@example.com",
        user_type=None,
        expires_at=now + timedelta(days=1),
    )
    db_session.add(old_user_session)

    async def _override():
        return admin_session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.patch(
        f"/api/v1/admin/users/{primary_profile.profile_code}/email",
        json={"email": " New-User@Example.com "},
    )
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200
    data = r.json()
    assert data["old_email"] == "old-user@example.com"
    assert data["email"] == "new-user@example.com"
    assert data["profiles_updated"] == 2
    assert data["jobs_updated"] == 2
    assert data["contact_email_updates"] == 1

    old_user = (
        await db_session.execute(select(UserSensitive).where(UserSensitive.user_email == "old-user@example.com"))
    ).scalar_one_or_none()
    assert old_user is None
    new_user = (
        await db_session.execute(select(UserSensitive).where(UserSensitive.user_email == "new-user@example.com"))
    ).scalar_one()
    assert new_user.user_code == user.user_code

    await db_session.refresh(primary_profile)
    await db_session.refresh(second_profile)
    await db_session.refresh(matching_contact_job)
    await db_session.refresh(custom_contact_job)
    assert primary_profile.user_code == user.user_code
    assert second_profile.user_code == user.user_code
    assert matching_contact_job.user_code == user.user_code
    assert matching_contact_job.contact_email == "new-user@example.com"
    assert custom_contact_job.contact_email == "custom@example.com"

    old_entities = await auth_service.get_entities_for_session(db_session, "old-user@example.com")
    assert old_entities == {"jobs": [], "profiles": []}
    new_entities = await auth_service.get_entities_for_session(db_session, "new-user@example.com")
    assert {p["code"] for p in new_entities["profiles"]} == {"emailprof001", "emailprof002"}
    assert {j["code"] for j in new_entities["jobs"]} == {"emailjob001", "emailjob002"}

    old_session = (
        await db_session.execute(select(AuthSession).where(AuthSession.session_token == "old-user-session"))
    ).scalar_one_or_none()
    assert old_session is None
    audit = (
        await db_session.execute(
            select(AdminAuditLog).where(
                AdminAuditLog.action == "update_user_email",
                AdminAuditLog.entity_code == primary_profile.profile_code,
            )
        )
    ).scalar_one()
    assert audit.admin_email == "admin-email-change@example.com"
    assert audit.details_json["new_email"] == "new-user@example.com"


async def test_admin_update_user_email_rejects_existing_user_email(client, db_session):
    profile = await _make_profile(
        db_session,
        code="emailconf001",
        email="original@example.com",
        status="active",
        email_verified=True,
    )
    await _make_profile(
        db_session,
        code="emailconf002",
        email="taken@example.com",
        status="active",
        email_verified=True,
    )
    session = await _make_admin_session(db_session, email="admin-email-conflict@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.patch(
        f"/api/v1/admin/users/{profile.profile_code}/email",
        json={"email": "taken@example.com"},
    )
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 409
    assert "already belongs to another user" in r.json()["detail"]


async def test_admin_update_user_email_rejects_existing_recruiter_email(client, db_session):
    profile = await _make_profile(
        db_session,
        code="emailrecr001",
        email="candidate@example.com",
        status="active",
        email_verified=True,
    )
    await _make_recruiter(db_session, code="emailrecr002", email="recruiter@example.com", status="active")
    session = await _make_admin_session(db_session, email="admin-email-recruiter@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.patch(
        f"/api/v1/admin/users/{profile.profile_code}/email",
        json={"email": "recruiter@example.com"},
    )
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 409
    assert "recruiter account" in r.json()["detail"]


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


# ---------------------------------------------------------------------------
# POST /api/v1/admin/profiles/{code}/deactivate
# ---------------------------------------------------------------------------


async def test_admin_can_deactivate_reported_profile_and_resolve_pending_reports(client, db_session):
    profile = await _make_profile(db_session, code="reportprof01", email="reported@example.com", status="under_review")
    await _make_report(db_session, entity_type="profile", entity_code=profile.profile_code, status="pending")
    await _make_report(db_session, entity_type="profile", entity_code=profile.profile_code, status="resolved")
    session = await _make_admin_session(db_session, email="admin9@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.post(f"/api/v1/admin/profiles/{profile.profile_code}/deactivate")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200
    assert r.json()["profile_code"] == profile.profile_code
    assert r.json()["status"] == "inactive"

    await db_session.refresh(profile)
    assert profile.status == "inactive"

    pending_reports = (
        (
            await db_session.execute(
                select(Report).where(Report.entity_type == "profile", Report.entity_code == profile.profile_code)
            )
        )
        .scalars()
        .all()
    )
    assert sorted(report.status for report in pending_reports) == ["resolved", "resolved"]


async def test_admin_cannot_deactivate_already_inactive_profile(client, db_session):
    profile = await _make_profile(db_session, code="reportprof02", email="inactive@example.com", status="inactive")
    session = await _make_admin_session(db_session, email="admin10@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.post(f"/api/v1/admin/profiles/{profile.profile_code}/deactivate")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 409


# ---------------------------------------------------------------------------
# Email logs
# ---------------------------------------------------------------------------


async def _make_email_log(
    db_session,
    *,
    email_type="verification",
    recipient_email="user@example.com",
    success=True,
    entity_type="job",
    entity_code="testjob0001",
    error_message=None,
    resend_id=None,
):
    from app.models.email_log import EmailLog

    log = EmailLog(
        email_type=email_type,
        recipient_email=recipient_email,
        entity_type=entity_type,
        entity_code=entity_code,
        success=success,
        resend_id=resend_id,
        error_message=error_message,
    )
    db_session.add(log)
    await db_session.flush()
    return log


async def test_admin_email_logs_returns_paginated_list(client, db_session):
    await _make_email_log(db_session, recipient_email="a@test.com", success=True, resend_id="rid-001")
    await _make_email_log(db_session, recipient_email="b@test.com", success=False, error_message="timeout")
    session = await _make_admin_session(db_session, email="admin-el1@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.get("/api/v1/admin/email-logs")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200
    data = r.json()
    assert "items" in data and "total" in data
    assert data["total"] >= 2
    assert all("email_type" in item and "success" in item for item in data["items"])


async def test_admin_email_logs_filter_by_success(client, db_session):
    await _make_email_log(db_session, email_type="login", recipient_email="c@test.com", success=True)
    await _make_email_log(db_session, email_type="login", recipient_email="d@test.com", success=False)
    session = await _make_admin_session(db_session, email="admin-el2@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.get("/api/v1/admin/email-logs?success=false&email_type=login")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200
    data = r.json()
    assert all(not item["success"] for item in data["items"])


async def test_admin_email_logs_search_by_recipient(client, db_session):
    await _make_email_log(db_session, recipient_email="unique_recipient@test.com", success=True)
    session = await _make_admin_session(db_session, email="admin-el3@example.com")

    async def _override():
        return session

    from app.main import app

    app.dependency_overrides[_get_admin_session] = _override
    r = await client.get("/api/v1/admin/email-logs?search=unique_recipient")
    app.dependency_overrides.pop(_get_admin_session, None)

    assert r.status_code == 200
    data = r.json()
    assert all("unique_recipient" in item["recipient_email"] for item in data["items"])


async def test_admin_email_logs_requires_auth(client, db_session):
    r = await client.get("/api/v1/admin/email-logs")
    assert r.status_code == 401
