import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_session
from app.models.job import Job
from app.models.profile import Profile
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportResponse
from app.services.code_generator import generate_code

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])

REPORT_THRESHOLD = 3


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_report(
    data: ReportCreate,
    db: AsyncSession = Depends(get_session),
):
    # Verify the entity exists
    if data.entity_type == "job":
        result = await db.execute(
            select(Job).where(
                and_(Job.job_code == data.entity_code, Job.status.in_(["active", "pending_verification"]))
            )
        )
        entity = result.scalar_one_or_none()
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )
    elif data.entity_type == "profile":
        result = await db.execute(
            select(Profile).where(
                and_(
                    Profile.profile_code == data.entity_code,
                    Profile.status.in_(["active", "pending_verification"]),
                )
            )
        )
        entity = result.scalar_one_or_none()
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid entity type",
        )

    # Check for duplicate report from same email for same entity
    existing = await db.execute(
        select(Report).where(
            and_(
                Report.entity_type == data.entity_type,
                Report.entity_code == data.entity_code,
                Report.reporter_email == data.reporter_email,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reported this listing",
        )

    now = datetime.now(timezone.utc)
    report = Report(
        report_code=generate_code(12),
        entity_type=data.entity_type,
        entity_code=data.entity_code,
        reporter_email=data.reporter_email,
        reason=data.reason,
        details=data.details,
        status="pending",
        created_at=now,
        updated_at=now,
    )
    db.add(report)
    await db.flush()

    # Count total reports for this entity
    count_result = await db.execute(
        select(func.count(Report.id)).where(
            and_(
                Report.entity_type == data.entity_type,
                Report.entity_code == data.entity_code,
            )
        )
    )
    total_reports = count_result.scalar_one()

    # Auto-flag entity if threshold reached
    if total_reports >= REPORT_THRESHOLD:
        entity.status = "under_review"
        entity.updated_at = now
        logger.info(
            "Entity %s/%s flagged as under_review after %d reports",
            data.entity_type,
            data.entity_code,
            total_reports,
        )

    return ReportResponse(message="Report submitted successfully. Thank you for helping keep the platform safe.")
