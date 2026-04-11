from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.constants import MAX_PAGE
from app.dependencies import get_session, require_active_recruiter, require_edit_token
from app.limiter import limiter
from app.models.auth_session import AuthSession
from app.schemas.job import (
    JobCreate,
    JobCreateResponse,
    JobListItem,
    JobListResponse,
    JobResponse,
    JobUpdate,
)
from app.services import job_service

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])
settings = get_settings()


@router.get("", response_model=JobListResponse)
async def list_jobs(
    page: int = Query(1, ge=1, le=MAX_PAGE),
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


@router.post("", response_model=JobCreateResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")
async def create_job(
    request: Request,
    data: JobCreate,
    recruiter_session: AuthSession = Depends(require_active_recruiter),
    db: AsyncSession = Depends(get_session),
):
    # Honeypot check
    if data.website:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid submission",
        )

    job = await job_service.create_job(
        db,
        data,
        recruiter_email=recruiter_session.email,
        recruiter_code=recruiter_session.recruiter_code,
    )
    # Job is created as active immediately — recruiter is already verified
    return JobCreateResponse(code=job.job_code, message="Job listing is now live.")


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


@router.post("/{code}/renew", response_model=JobResponse)
async def renew_job(
    code: str,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    """Renew a job listing, extending expires_at by 60 days (max 2 renewals)."""
    job = await job_service.renew_job(db, code, edit_token)
    return JobResponse.model_validate(job)
