from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_session
from app.models.auth_session import AuthSession
from app.schemas.admin import (
    AdminEmailLogListResponse,
    AdminLoginRequest,
    AdminProfileActionResponse,
    AdminRecruiterListResponse,
    AdminReportListResponse,
    AdminUserEmailUpdateRequest,
    AdminUserEmailUpdateResponse,
    AdminUserListResponse,
    FlagEntityRequest,
    RejectionReasonItem,
    RejectRecruiterRequest,
)
from app.schemas.common import MessageResponse
from app.schemas.recruiter import RecruiterResponse
from app.services import admin_service, auth_service, email_service, recruiter_service

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])
settings = get_settings()


async def _get_admin_session(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_session),
) -> AuthSession:
    """Dependency: validate Bearer token and require user_type == 'admin'."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid authorization header")

    token = authorization.removeprefix("Bearer ").strip()
    session = await auth_service.validate_session(db, token)
    if not session or session.user_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return session


# ---------------------------------------------------------------------------
# Admin login (no auth required — entry point)
# ---------------------------------------------------------------------------


@router.post("/login")
async def admin_login(
    body: AdminLoginRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Send a magic link to an admin email. Returns 403 if email is not in the admin list."""
    if body.email not in settings.admin_email_list:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This email is not authorized for admin access",
        )

    token = await auth_service.create_login_token(db, body.email)

    if settings.is_production:
        background_tasks.add_task(
            email_service.send_admin_login_email,
            db=db,
            email=body.email,
            login_token=token.token,
            frontend_url=settings.frontend_url,
        )
    else:
        admin_verify_url = f"{settings.frontend_url}/admin/verify?code={token.token}"
        return {"message": "Magic link created (dev mode — not sent by email)", "url": admin_verify_url}

    return {"message": "Magic link sent. Check your email."}


# ---------------------------------------------------------------------------
# Users (talent profiles)
# ---------------------------------------------------------------------------


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    search: str | None = Query(None),
    filter_status: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    _session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> AdminUserListResponse:
    """List talent profiles."""
    return await admin_service.list_users(db, search=search, status=filter_status, page=page, per_page=per_page)


@router.post("/users/{profile_code}/resend-verification", response_model=MessageResponse)
async def resend_user_verification(
    profile_code: str,
    background_tasks: BackgroundTasks,
    session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> MessageResponse:
    """Resend a verification email for a pending talent profile."""
    profile, user, verification = await admin_service.prepare_user_verification_resend(
        db,
        admin_email=session.email,
        profile_code=profile_code,
    )

    background_tasks.add_task(
        email_service.send_verification_email,
        db=db,
        email=user.user_email,
        entity_type="profile",
        entity_code=profile.profile_code,
        verification_code=verification.verification_code,
        edit_token=profile.edit_token,
        frontend_url=settings.frontend_url,
    )

    return MessageResponse(message="Verification email sent. This user can be resent again after 5 minutes.")


@router.patch("/users/{profile_code}/email", response_model=AdminUserEmailUpdateResponse)
async def update_user_email(
    profile_code: str,
    body: AdminUserEmailUpdateRequest,
    session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> AdminUserEmailUpdateResponse:
    """Update the login email for the user attached to a talent profile."""
    return await admin_service.update_user_email(
        db,
        admin_email=session.email,
        profile_code=profile_code,
        new_email=body.email,
    )


# ---------------------------------------------------------------------------
# Recruiters
# ---------------------------------------------------------------------------


@router.get("/recruiters", response_model=AdminRecruiterListResponse)
async def list_recruiters(
    search: str | None = Query(None),
    filter_status: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    _session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> AdminRecruiterListResponse:
    """List all recruiters."""
    return await admin_service.list_recruiters(db, search=search, status=filter_status, page=page, per_page=per_page)


@router.post("/recruiters/{code}/approve", response_model=RecruiterResponse)
async def approve_recruiter(
    code: str,
    background_tasks: BackgroundTasks,
    session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> RecruiterResponse:
    """Approve a pending recruiter account."""
    recruiter = await recruiter_service.approve_recruiter(db, code)

    await admin_service.write_audit_log(
        db,
        admin_email=session.email,
        action="approve_recruiter",
        entity_type="recruiter",
        entity_code=code,
    )

    if settings.is_production:
        background_tasks.add_task(
            email_service.send_recruiter_approved_email,
            db=db,
            email=recruiter.email,
            recruiter_code=recruiter.recruiter_code,
            frontend_url=settings.frontend_url,
        )

    return RecruiterResponse.from_orm(recruiter)


@router.post("/recruiters/{code}/reject", response_model=RecruiterResponse)
async def reject_recruiter(
    code: str,
    body: RejectRecruiterRequest,
    background_tasks: BackgroundTasks,
    session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> RecruiterResponse:
    """Reject a recruiter with a reason code and optional comment."""
    recruiter, reason_name = await admin_service.reject_recruiter_with_reason(
        db, code, body.reason_code, body.comment, admin_email=session.email
    )

    if settings.is_production:
        background_tasks.add_task(
            email_service.send_recruiter_rejected_email,
            db=db,
            email=recruiter.email,
            recruiter_code=recruiter.recruiter_code,
            frontend_url=settings.frontend_url,
            reason_name=reason_name,
        )

    return RecruiterResponse.from_orm(recruiter)


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------


@router.get("/reports", response_model=AdminReportListResponse)
async def list_reports(
    search: str | None = Query(None),
    entity_type: str | None = Query(None),
    report_status: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    _session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> AdminReportListResponse:
    """List reports on jobs and profiles."""
    return await admin_service.list_reports(
        db,
        search=search,
        entity_type=entity_type,
        report_status=report_status,
        page=page,
        per_page=per_page,
    )


# ---------------------------------------------------------------------------
# Rejection reasons lookup
# ---------------------------------------------------------------------------


@router.get("/rejection-reasons", response_model=list[RejectionReasonItem])
async def get_rejection_reasons(
    _session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> list[RejectionReasonItem]:
    """Return all available recruiter rejection reason codes."""
    return await admin_service.get_rejection_reasons(db)


# ---------------------------------------------------------------------------
# Entity flagging
# ---------------------------------------------------------------------------


@router.post("/entities/{entity_type}/{entity_code}/flag", status_code=status.HTTP_200_OK)
async def flag_entity(
    entity_type: str,
    entity_code: str,
    body: FlagEntityRequest,
    session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Manually flag a job or profile for review, bypassing the 3-report threshold."""
    await admin_service.flag_entity(
        db,
        admin_email=session.email,
        entity_type=entity_type,
        entity_code=entity_code,
        reason=body.reason,
    )
    return {"message": f"{entity_type} {entity_code} flagged for review"}


@router.post("/profiles/{code}/deactivate", response_model=AdminProfileActionResponse)
async def deactivate_profile(
    code: str,
    session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> AdminProfileActionResponse:
    """Deactivate a reported profile from the admin panel."""
    profile = await admin_service.deactivate_reported_profile(
        db,
        admin_email=session.email,
        profile_code=code,
    )
    return AdminProfileActionResponse(profile_code=profile.profile_code, status=profile.status)


@router.get("/email-logs", response_model=AdminEmailLogListResponse)
async def list_email_logs(
    search: str | None = Query(None),
    email_type: str | None = Query(None),
    success: bool | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    session: AuthSession = Depends(_get_admin_session),
    db: AsyncSession = Depends(get_session),
) -> AdminEmailLogListResponse:
    """List email send attempts with optional filtering by recipient, type, and outcome."""
    return await admin_service.list_email_logs(
        db,
        search=search,
        email_type=email_type,
        success=success,
        page=page,
        per_page=per_page,
    )
