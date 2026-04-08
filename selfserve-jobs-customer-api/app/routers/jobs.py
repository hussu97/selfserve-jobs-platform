from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_session, require_edit_token
from app.schemas.job import (
    JobCreate,
    JobCreateResponse,
    JobListResponse,
    JobListItem,
    JobResponse,
    JobUpdate,
)
from app.services import job_service, verification_service, email_service

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])
settings = get_settings()


@router.get("/", response_model=JobListResponse)
async def list_jobs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    search: Optional[str] = Query(None, description="Full-text search"),
    country: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    employment_type: Optional[list[str]] = Query(None),
    skills: Optional[list[str]] = Query(None),
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


@router.post("/", response_model=JobCreateResponse, status_code=status.HTTP_201_CREATED)
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

    # Create verification record
    verification = await verification_service.create_verification(
        db=db,
        email=job.email,
        entity_type="job",
        entity_code=job.job_code,
    )

    # Send verification email
    await email_service.send_verification_email(
        email=job.email,
        entity_type="job",
        entity_code=job.job_code,
        verification_code=verification.verification_code,
        edit_token=job.edit_token,
        frontend_url=settings.frontend_url,
    )

    return JobCreateResponse(
        code=job.job_code,
        message="Job listing created. Please check your email to verify and activate your listing.",
    )


@router.put("/{code}", response_model=JobResponse)
async def update_job(
    code: str,
    data: JobUpdate,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    job = await job_service.update_job(db, code, edit_token, data)
    return JobResponse.model_validate(job)


@router.delete("/{code}", response_model=JobResponse)
async def delete_job(
    code: str,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    job = await job_service.remove_job(db, code, edit_token)
    return JobResponse.model_validate(job)
