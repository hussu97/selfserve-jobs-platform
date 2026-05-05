import math
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import ADMIN_VERIFICATION_RESEND_COOLDOWN_MINUTES
from app.models.admin_audit_log import AdminAuditLog
from app.models.auth_session import AuthSession
from app.models.email_verification import EmailVerification
from app.models.job import Job
from app.models.profile import Profile
from app.models.recruiter import Recruiter
from app.models.recruiter_rejection_reason import RecruiterRejectionReason
from app.models.report import Report
from app.models.user_sensitive import UserSensitive
from app.schemas.admin import (
    AdminRecruiterItem,
    AdminRecruiterListResponse,
    AdminReportItem,
    AdminReportListResponse,
    AdminUserItem,
    AdminUserListResponse,
    RejectionReasonItem,
)
from app.services import verification_service


async def list_users(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> AdminUserListResponse:
    """List talent profiles with optional search and status filter."""
    # Join with user_sensitive to enable email search and to include email in the response
    base = select(Profile, UserSensitive).join(UserSensitive, Profile.user_code == UserSensitive.user_code)
    if search:
        term = f"%{search.strip()}%"
        base = base.where(or_(Profile.person_name.ilike(term), UserSensitive.user_email.ilike(term)))
    if status:
        base = base.where(Profile.status == status)

    count_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * per_page
    result = await db.execute(base.order_by(Profile.created_at.desc()).offset(offset).limit(per_page))
    rows = result.all()

    items = [
        AdminUserItem(
            profile_code=profile.profile_code,
            person_name=profile.person_name,
            email=user.user_email,
            email_verified=profile.email_verified,
            status=profile.status,
            current_title=profile.current_title,
            created_at=profile.created_at,
            view_count=profile.view_count,
        )
        for profile, user in rows
    ]

    return AdminUserListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total else 1,
    )


async def prepare_user_verification_resend(
    db: AsyncSession,
    *,
    admin_email: str,
    profile_code: str,
) -> tuple[Profile, UserSensitive, EmailVerification]:
    """Create a new verification code for a pending profile, enforcing a per-user cooldown."""
    result = await db.execute(
        select(Profile, UserSensitive)
        .join(UserSensitive, Profile.user_code == UserSensitive.user_code)
        .where(Profile.profile_code == profile_code)
        .with_for_update()
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    profile, user = row
    if profile.email_verified or profile.status != "pending_verification":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending, unverified profiles can receive a verification resend",
        )

    await verification_service.check_user_resend_cooldown(
        db,
        user_code=profile.user_code,
        cooldown_minutes=ADMIN_VERIFICATION_RESEND_COOLDOWN_MINUTES,
    )
    verification = await verification_service.create_verification(
        db,
        entity_type="profile",
        entity_code=profile.profile_code,
        user_code=profile.user_code,
    )
    await write_audit_log(
        db,
        admin_email=admin_email,
        action="resend_user_verification",
        entity_type="profile",
        entity_code=profile.profile_code,
        details={"email": user.user_email},
    )
    return profile, user, verification


async def list_recruiters(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> AdminRecruiterListResponse:
    """List all recruiters with optional search and status filter."""
    query = select(Recruiter)
    if search:
        term = f"%{search.strip()}%"
        query = query.where(or_(Recruiter.name.ilike(term), Recruiter.email.ilike(term)))
    if status:
        query = query.where(Recruiter.status == status)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * per_page
    result = await db.execute(query.order_by(Recruiter.created_at.desc()).offset(offset).limit(per_page))
    recruiters = result.scalars().all()

    return AdminRecruiterListResponse(
        items=[AdminRecruiterItem.model_validate(r) for r in recruiters],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total else 1,
    )


async def list_reports(
    db: AsyncSession,
    search: str | None = None,
    entity_type: str | None = None,
    report_status: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> AdminReportListResponse:
    """List reports with optional search and filter."""
    query = select(Report)
    if search:
        term = f"%{search.strip()}%"
        query = query.where(or_(Report.entity_code.ilike(term), Report.reporter_email.ilike(term)))
    if entity_type:
        query = query.where(Report.entity_type == entity_type)
    if report_status:
        query = query.where(Report.status == report_status)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * per_page
    result = await db.execute(query.order_by(Report.created_at.desc()).offset(offset).limit(per_page))
    reports = result.scalars().all()

    # Batch-fetch entity titles to avoid N+1 queries
    job_codes = [r.entity_code for r in reports if r.entity_type == "job"]
    profile_codes = [r.entity_code for r in reports if r.entity_type == "profile"]

    job_titles: dict[str, str] = {}
    if job_codes:
        job_rows = await db.execute(select(Job.job_code, Job.job_title).where(Job.job_code.in_(job_codes)))
        job_titles = dict(job_rows.all())

    profile_names: dict[str, str] = {}
    if profile_codes:
        profile_rows = await db.execute(
            select(Profile.profile_code, Profile.person_name).where(Profile.profile_code.in_(profile_codes))
        )
        profile_names = dict(profile_rows.all())

    items: list[AdminReportItem] = []
    for r in reports:
        entity_title: str | None = None
        if r.entity_type == "job":
            entity_title = job_titles.get(r.entity_code)
        elif r.entity_type == "profile":
            entity_title = profile_names.get(r.entity_code)

        item = AdminReportItem.model_validate(r)
        item.entity_title = entity_title
        items.append(item)

    return AdminReportListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total else 1,
    )


async def write_audit_log(
    db: AsyncSession,
    admin_email: str,
    action: str,
    entity_type: str | None = None,
    entity_code: str | None = None,
    details: dict | None = None,
) -> None:
    """Append a row to admin_audit_log."""
    log_entry = AdminAuditLog(
        admin_email=admin_email,
        action=action,
        entity_type=entity_type,
        entity_code=entity_code,
        details_json=details,
    )
    db.add(log_entry)
    await db.flush()


async def flag_entity(
    db: AsyncSession,
    admin_email: str,
    entity_type: str,
    entity_code: str,
    reason: str,
) -> None:
    """Flag a job or profile for removal by setting status to 'under_review'."""
    if entity_type not in ("job", "profile"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="entity_type must be 'job' or 'profile'")

    now = datetime.now(UTC)
    if entity_type == "job":
        result = await db.execute(select(Job).where(Job.job_code == entity_code))
        entity = result.scalar_one_or_none()
        if not entity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        if entity.status in ("removed",):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Entity is already removed")
        entity.status = "under_review"
        entity.updated_at = now
    else:
        result = await db.execute(select(Profile).where(Profile.profile_code == entity_code))
        entity = result.scalar_one_or_none()
        if not entity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        if entity.status in ("removed",):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Entity is already removed")
        entity.status = "under_review"
        entity.updated_at = now

    await db.flush()
    await write_audit_log(
        db,
        admin_email=admin_email,
        action="flag_entity",
        entity_type=entity_type,
        entity_code=entity_code,
        details={"reason": reason},
    )


async def deactivate_reported_profile(
    db: AsyncSession,
    admin_email: str,
    profile_code: str,
) -> Profile:
    """Deactivate a reported profile from the admin panel and resolve pending reports."""
    result = await db.execute(select(Profile).where(Profile.profile_code == profile_code))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    if profile.status not in ("active", "under_review"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only active or under-review profiles can be deactivated",
        )

    now = datetime.now(UTC)
    profile.status = "inactive"
    profile.updated_at = now

    await db.execute(
        update(Report)
        .where(
            Report.entity_type == "profile",
            Report.entity_code == profile_code,
            Report.status == "pending",
        )
        .values(status="resolved", updated_at=now)
    )

    await db.flush()
    await write_audit_log(
        db,
        admin_email=admin_email,
        action="deactivate_profile",
        entity_type="profile",
        entity_code=profile_code,
        details={"source": "reports_table"},
    )
    return profile


async def get_rejection_reasons(db: AsyncSession) -> list[RejectionReasonItem]:
    result = await db.execute(select(RecruiterRejectionReason).order_by(RecruiterRejectionReason.id))
    reasons = result.scalars().all()
    return [RejectionReasonItem.model_validate(r) for r in reasons]


async def reject_recruiter_with_reason(
    db: AsyncSession,
    code: str,
    reason_code: str,
    comment: str | None,
    admin_email: str = "",
) -> tuple[Recruiter, str]:
    """Set recruiter status to rejected with reason. Returns (recruiter, reason_name)."""
    # Validate reason code exists
    reason_result = await db.execute(
        select(RecruiterRejectionReason).where(RecruiterRejectionReason.code == reason_code)
    )
    reason = reason_result.scalar_one_or_none()
    if not reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown rejection reason code: {reason_code}",
        )

    # Fetch recruiter
    result = await db.execute(select(Recruiter).where(Recruiter.recruiter_code == code))
    recruiter = result.scalar_one_or_none()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter not found")

    recruiter.status = "rejected"
    recruiter.rejection_reason_code = reason_code
    recruiter.rejection_comment = comment
    recruiter.reviewed_at = datetime.now(UTC)
    # Invalidate all active sessions for the rejected recruiter
    await db.execute(delete(AuthSession).where(AuthSession.email == recruiter.email))
    await db.flush()

    await write_audit_log(
        db,
        admin_email=admin_email,
        action="reject_recruiter",
        entity_type="recruiter",
        entity_code=code,
        details={"reason_code": reason_code, "comment": comment},
    )

    return recruiter, reason.name
