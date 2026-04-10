import math
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import Job
from app.models.profile import Profile
from app.models.recruiter import Recruiter
from app.models.recruiter_rejection_reason import RecruiterRejectionReason
from app.models.report import Report
from app.schemas.admin import (
    AdminRecruiterItem,
    AdminRecruiterListResponse,
    AdminReportItem,
    AdminReportListResponse,
    AdminUserItem,
    AdminUserListResponse,
    RejectionReasonItem,
)


async def list_users(
    db: AsyncSession,
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> AdminUserListResponse:
    """List talent profiles with optional search and status filter."""
    query = select(Profile)
    if search:
        term = f"%{search.strip()}%"
        query = query.where(or_(Profile.person_name.ilike(term), Profile.email.ilike(term)))
    if status:
        query = query.where(Profile.status == status)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * per_page
    result = await db.execute(query.order_by(Profile.created_at.desc()).offset(offset).limit(per_page))
    profiles = result.scalars().all()

    return AdminUserListResponse(
        items=[AdminUserItem.model_validate(p) for p in profiles],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total else 1,
    )


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

    # Enrich with entity title
    items: list[AdminReportItem] = []
    for r in reports:
        entity_title: str | None = None
        if r.entity_type == "job":
            job_result = await db.execute(select(Job.job_title).where(Job.job_code == r.entity_code))
            entity_title = job_result.scalar_one_or_none()
        elif r.entity_type == "profile":
            profile_result = await db.execute(select(Profile.person_name).where(Profile.profile_code == r.entity_code))
            entity_title = profile_result.scalar_one_or_none()

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


async def get_rejection_reasons(db: AsyncSession) -> list[RejectionReasonItem]:
    result = await db.execute(select(RecruiterRejectionReason).order_by(RecruiterRejectionReason.id))
    reasons = result.scalars().all()
    return [RejectionReasonItem.model_validate(r) for r in reasons]


async def reject_recruiter_with_reason(
    db: AsyncSession,
    code: str,
    reason_code: str,
    comment: str | None,
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
    await db.flush()

    return recruiter, reason.name
