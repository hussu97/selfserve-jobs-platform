import logging
import math
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select, update
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import JOB_EXPIRY_DAYS, MAX_ACTIVE_JOBS_PER_EMAIL
from app.models.job import Job
from app.schemas.job import JobCreate, JobUpdate
from app.services.code_generator import generate_code, generate_token

logger = logging.getLogger(__name__)


async def get_active_job_count_for_email(db: AsyncSession, email: str) -> int:
    result = await db.execute(
        select(func.count(Job.id)).where(
            and_(
                Job.email == email,
                Job.status.in_(["active", "pending_verification"]),
            )
        )
    )
    return result.scalar_one()


async def create_job(
    db: AsyncSession,
    data: JobCreate,
    recruiter_email: str,
    recruiter_code: str,
) -> Job:
    """Create a new job listing. Requires a verified recruiter session."""
    # Rate limit check (based on recruiter email)
    active_count = await get_active_job_count_for_email(db, recruiter_email)
    if active_count >= MAX_ACTIVE_JOBS_PER_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Maximum of {MAX_ACTIVE_JOBS_PER_EMAIL} active job listings per email address.",
        )

    now = datetime.now(UTC)
    job = Job(
        job_code=generate_code(12),
        email=recruiter_email,
        email_verified=True,  # Recruiter is already verified
        job_title=data.job_title,
        company_name=data.company_name,
        company_city=data.company_city,
        company_country=data.company_country,
        employment_type=data.employment_type,
        deadline_date=data.deadline_date,
        description=data.description,
        key_skills=data.key_skills or [],
        contact_method=data.contact_method,
        contact_email=str(data.contact_email) if data.contact_email else None,
        contact_url=data.contact_url,
        salary_min=data.salary_min,
        salary_max=data.salary_max,
        salary_currency=data.salary_currency,
        recruiter_code=recruiter_code,
        status="active",  # Recruiter is already verified — go live immediately
        view_count=0,
        expires_at=now + timedelta(days=JOB_EXPIRY_DAYS),
        edit_token=generate_token(64),
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    await db.flush()
    return job


async def get_job_by_code(db: AsyncSession, job_code: str) -> Job:
    """Get a job by its public code."""
    result = await db.execute(select(Job).where(Job.job_code == job_code))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


async def get_job_by_code_and_token(db: AsyncSession, job_code: str, edit_token: str) -> Job:
    """Get a job ensuring the edit token matches."""
    result = await db.execute(select(Job).where(and_(Job.job_code == job_code, Job.edit_token == edit_token)))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid edit token or job not found",
        )
    return job


async def increment_view_count(db: AsyncSession, job_code: str) -> None:
    """Atomically increment view count."""
    await db.execute(update(Job).where(Job.job_code == job_code).values(view_count=Job.view_count + 1))


async def get_job_detail(db: AsyncSession, job_code: str) -> Job:
    """Get job detail. Increments view count atomically first so the response reflects the current count.

    Intentional preview behaviour: pending_verification listings are accessible by direct URL
    (e.g. the creator's email contains the link). This allows the owner to preview their listing
    before the verification email is clicked. Listings are not surfaced in browse/list endpoints
    until status = 'active'.
    """
    await db.execute(update(Job).where(Job.job_code == job_code).values(view_count=Job.view_count + 1))
    job = await get_job_by_code(db, job_code)
    if job.status not in ("active", "pending_verification"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


async def list_jobs(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    q: str | None = None,
    country: str | None = None,
    city: str | None = None,
    employment_type: str | list[str] | None = None,
    skills: list[str] | None = None,
    sort: str = "newest",
) -> dict:
    """List active jobs with filtering and pagination."""
    per_page = min(per_page, 50)

    filters = [Job.status == "active"]

    if q:
        # Full-text search using PostgreSQL tsvector
        ts_query = func.plainto_tsquery("english", q)
        ts_vector = func.to_tsvector(
            "english",
            func.concat_ws(" ", Job.job_title, Job.company_name, Job.description),
        )
        filters.append(ts_vector.op("@@")(ts_query))

    if country:
        filters.append(func.lower(Job.company_country) == country.lower())

    if city:
        filters.append(func.lower(Job.company_city) == city.lower())

    if employment_type:
        # Accept both a single string and a list (multi-select from frontend)
        if isinstance(employment_type, list):
            if len(employment_type) == 1:
                filters.append(Job.employment_type == employment_type[0])
            elif len(employment_type) > 1:
                filters.append(Job.employment_type.in_(employment_type))
        else:
            filters.append(Job.employment_type == employment_type)

    if skills:
        for skill in skills:
            filters.append(Job.key_skills.cast(JSONB).contains([skill]))

    base_query = select(Job).where(and_(*filters))

    # Count total
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Sort
    if sort == "oldest":
        base_query = base_query.order_by(Job.created_at.asc())
    elif sort == "deadline":
        base_query = base_query.order_by(Job.deadline_date.asc().nulls_last())
    else:  # newest
        base_query = base_query.order_by(Job.created_at.desc())

    # Paginate
    offset = (page - 1) * per_page
    base_query = base_query.offset(offset).limit(per_page)

    result = await db.execute(base_query)
    jobs = result.scalars().all()

    total_pages = math.ceil(total / per_page) if total > 0 else 1

    return {
        "items": jobs,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


async def update_job(
    db: AsyncSession,
    job_code: str,
    edit_token: str,
    data: JobUpdate,
) -> Job:
    """Update a job listing."""
    job = await get_job_by_code_and_token(db, job_code, edit_token)

    if job.status == "removed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit a removed listing",
        )

    _UPDATABLE_FIELDS = {
        "job_title",
        "company_name",
        "company_city",
        "company_country",
        "employment_type",
        "deadline_date",
        "description",
        "key_skills",
        "contact_method",
        "contact_email",
        "contact_url",
        "salary_min",
        "salary_max",
        "salary_currency",
    }
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if k in _UPDATABLE_FIELDS}
    if "contact_email" in update_data and update_data["contact_email"]:
        update_data["contact_email"] = str(update_data["contact_email"])

    for field, value in update_data.items():
        setattr(job, field, value)

    job.updated_at = datetime.now(UTC)
    await db.flush()
    return job


async def remove_job(
    db: AsyncSession,
    job_code: str,
    edit_token: str,
) -> Job:
    """Soft-delete a job listing."""
    job = await get_job_by_code_and_token(db, job_code, edit_token)
    job.status = "removed"
    job.updated_at = datetime.now(UTC)
    await db.flush()
    return job


async def activate_job(db: AsyncSession, job_code: str) -> None:
    """Auto-activate a job without email verification (non-production only)."""
    now = datetime.now(UTC)
    await db.execute(
        update(Job)
        .where(Job.job_code == job_code)
        .values(
            email_verified=True,
            status="active",
            updated_at=now,
        )
    )


async def deactivate_job(db: AsyncSession, job_code: str, edit_token: str) -> Job:
    """Set an active job to inactive (hidden from public browse)."""
    job = await get_job_by_code_and_token(db, job_code, edit_token)
    if job.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active jobs can be deactivated",
        )
    job.status = "inactive"
    job.updated_at = datetime.now(UTC)
    await db.flush()
    return job


async def reactivate_job(db: AsyncSession, job_code: str, edit_token: str) -> Job:
    """Set an inactive job back to active."""
    job = await get_job_by_code_and_token(db, job_code, edit_token)
    if job.status != "inactive":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only inactive jobs can be reactivated",
        )
    job.status = "active"
    job.updated_at = datetime.now(UTC)
    await db.flush()
    return job


async def validate_token(
    db: AsyncSession,
    entity_code: str,
    token: str,
) -> bool:
    """Check if an edit token is valid for a job."""
    result = await db.execute(select(Job).where(and_(Job.job_code == entity_code, Job.edit_token == token)))
    return result.scalar_one_or_none() is not None


async def renew_job(db: AsyncSession, job_code: str, edit_token: str) -> Job:
    """Extend a job listing's expiry by RENEWAL_EXTENSION_DAYS (max MAX_RENEWALS times)."""
    from app.constants import MAX_RENEWALS, RENEWAL_EXTENSION_DAYS

    job = await get_job_by_code_and_token(db, job_code, edit_token)
    if job.status not in ("active", "expired"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active or expired listings can be renewed",
        )
    if job.renewal_count >= MAX_RENEWALS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum of {MAX_RENEWALS} renewals reached for this listing",
        )
    now = datetime.now(UTC)
    # Extend from max(now, current expires_at) so the extension always adds full days
    base = max(now, job.expires_at)
    job.expires_at = base + timedelta(days=RENEWAL_EXTENSION_DAYS)
    job.renewal_count += 1
    job.status = "active"
    job.updated_at = now
    await db.flush()
    return job
