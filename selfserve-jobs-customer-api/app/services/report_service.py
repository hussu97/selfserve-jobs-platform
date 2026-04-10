import logging
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import REPORT_THRESHOLD
from app.models.job import Job
from app.models.profile import Profile
from app.models.report import Report
from app.schemas.report import ReportCreate
from app.services.code_generator import generate_code

logger = logging.getLogger(__name__)


async def _get_entity(db: AsyncSession, entity_type: str, entity_code: str) -> Job | Profile:
    """Fetch the job or profile being reported. Raises 404 if not found or ineligible."""
    if entity_type == "job":
        result = await db.execute(
            select(Job).where(and_(Job.job_code == entity_code, Job.status.in_(["active", "pending_verification"])))
        )
        entity = result.scalar_one_or_none()
        if not entity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        return entity

    if entity_type == "profile":
        result = await db.execute(
            select(Profile).where(
                and_(
                    Profile.profile_code == entity_code,
                    Profile.status.in_(["active", "pending_verification"]),
                )
            )
        )
        entity = result.scalar_one_or_none()
        if not entity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return entity

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid entity type")


async def submit_report(db: AsyncSession, data: ReportCreate) -> None:
    """Validate, persist a report, and auto-flag the entity if threshold is reached.

    The count is taken *before* the new report is flushed so the threshold check
    uses committed data plus the in-flight report in a single pass, avoiding a
    separate count-after-flush that could be stale under concurrent submissions.
    """
    entity = await _get_entity(db, data.entity_type, data.entity_code)

    # Duplicate check — same reporter email for the same entity
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

    # Count committed reports BEFORE creating the new one so our check is:
    # existing_count + 1 (this report) >= REPORT_THRESHOLD
    count_result = await db.execute(
        select(func.count(Report.id)).where(
            and_(
                Report.entity_type == data.entity_type,
                Report.entity_code == data.entity_code,
            )
        )
    )
    existing_count = count_result.scalar_one()

    now = datetime.now(UTC)
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

    if existing_count + 1 >= REPORT_THRESHOLD:
        entity.status = "under_review"
        entity.updated_at = now
        logger.info(
            "Entity %s/%s flagged as under_review after %d reports",
            data.entity_type,
            data.entity_code,
            existing_count + 1,
        )

    await db.flush()
