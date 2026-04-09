from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_session, require_edit_token
from app.schemas.job import (
    JobCreate,
    JobCreateResponse,
    JobListItem,
    JobListResponse,
    JobResponse,
    JobUpdate,
)
from app.services import email_service, job_service, verification_service

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])
settings = get_settings()


@router.get("", response_model=JobListResponse)
async def list_jobs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    search: str | None = Query(None, description="Full-text search"),
    country: str | None = Query(None),
    city: str | None = Query(None),
    employment_type: list[str] | None = Query(None),
    skills: list[str] | None = Query(None),
    sort: str = Query("newest", pattern="^(newest|oldest|deadline)$"),
    db: AsyncSession = Depends(get_session),
):
    result = await job_service.list_jobs(
        db=db,
        page=page,
        per_page=per_page,
        q=search,
        country=country,
        city=city,
        employment_type=employment_type,
        skills=skills,
        sort=sort,
    )
    items = [JobListItem.model_validate(job) for job in result["items"]]
    return JobListResponse(
        items=items,
        total=result["total"],
        page=result["page"],
        per_page=result["per_page"],
        total_pages=result["total_pages"],
    )


@router.get("/{code}", response_model=JobResponse)
async def get_job(
    code: str,
    db: AsyncSession = Depends(get_session),
):
    job = await job_service.get_job_detail(db, code)
    return JobResponse.model_validate(job)


@router.post("/{code}/view", status_code=status.HTTP_204_NO_CONTENT)
async def track_job_view(
    code: str,
    db: AsyncSession = Depends(get_session),
):
    await job_service.increment_view_count(db, code)


@router.post("", response_model=JobCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    data: JobCreate,
    db: AsyncSession = Depends(get_session),
):
    # Honeypot check
    if data.website:
        # Silently reject bot submissions
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid submission",
        )

    job = await job_service.create_job(db, data)

    if settings.is_production:
        # Create verification record and send email
        verification = await verification_service.create_verification(
            db=db,
            email=job.email,
            entity_type="job",
            entity_code=job.job_code,
        )
        await email_service.send_verification_email(
            db=db,
            email=job.email,
            entity_type="job",
            entity_code=job.job_code,
            verification_code=verification.verification_code,
            edit_token=job.edit_token,
            frontend_url=settings.frontend_url,
        )
        message = "Job listing created. Please check your email to verify and activate your listing."
    else:
        # Non-production: auto-activate immediately (email_verified=False stays as audit flag)
        await job_service.activate_job(db, job.job_code)
        message = "Job listing created and is now live."

    return JobCreateResponse(code=job.job_code, message=message)


@router.put("/{code}", response_model=JobResponse)
async def update_job(
    code: str,
    data: JobUpdate,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    job = await job_service.update_job(db, code, edit_token, data)
    return JobResponse.model_validate(job)


@router.post("/{code}/deactivate", response_model=JobResponse)
async def deactivate_job(
    code: str,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    job = await job_service.deactivate_job(db, code, edit_token)
    return JobResponse.model_validate(job)


@router.post("/{code}/activate", response_model=JobResponse)
async def activate_job_endpoint(
    code: str,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    job = await job_service.reactivate_job(db, code, edit_token)
    return JobResponse.model_validate(job)


@router.delete("/{code}", response_model=JobResponse)
async def delete_job(
    code: str,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    job = await job_service.remove_job(db, code, edit_token)
    return JobResponse.model_validate(job)
