from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.constants import MAX_PAGE
from app.dependencies import get_optional_session, get_session, require_active_recruiter, require_edit_token
from app.limiter import limiter
from app.models.auth_session import AuthSession
from app.schemas.profile import (
    ProfileCreate,
    ProfileCreateResponse,
    ProfileListItem,
    ProfileListResponse,
    ProfileResponse,
    ProfileUpdate,
    ResumeUrlResponse,
)
from app.services import email_service, profile_service, recruiter_service, storage_service, verification_service

router = APIRouter(prefix="/api/v1/profiles", tags=["profiles"])
settings = get_settings()


@router.get("", response_model=ProfileListResponse)
async def list_profiles(
    page: int = Query(1, ge=1, le=MAX_PAGE),
    per_page: int = Query(20, ge=1, le=50),
    search: str | None = Query(None, description="Full-text search"),
    country: str | None = Query(None),
    skills: list[str] | None = Query(None),
    min_experience: int | None = Query(None, ge=0),
    max_experience: int | None = Query(None, le=50),
    relocation_preference: str | None = Query(None),
    sort: str = Query("newest", pattern="^(newest|oldest)$"),
    db: AsyncSession = Depends(get_session),
):
    result = await profile_service.list_profiles(
        db=db,
        page=page,
        per_page=per_page,
        q=search,
        country=country,
        skills=skills,
        min_experience=min_experience,
        max_experience=max_experience,
        relocation_preference=relocation_preference,
        sort=sort,
    )
    items = [ProfileListItem(**profile_service.to_list_item(p)) for p in result["items"]]
    return ProfileListResponse(
        items=items,
        total=result["total"],
        page=result["page"],
        per_page=result["per_page"],
        total_pages=result["total_pages"],
    )


@router.get("/{code}/resume", response_model=ResumeUrlResponse)
async def get_resume_url(
    code: str,
    _session: AuthSession = Depends(require_active_recruiter),
    db: AsyncSession = Depends(get_session),
):
    """Returns a temporary signed URL for the resume. Requires active recruiter session."""
    profile = await profile_service.get_profile_by_code(db, code)
    if not profile.resume_gcs_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume uploaded for this profile",
        )
    url = await storage_service.generate_signed_url(profile.resume_gcs_path, expiration_minutes=15)
    return ResumeUrlResponse(url=url, expires_in=900)


@router.get("/{code}", response_model=ProfileResponse)
async def get_profile(
    code: str,
    optional_session: AuthSession | None = Depends(get_optional_session),
    db: AsyncSession = Depends(get_session),
):
    profile = await profile_service.get_profile_detail(db, code)
    # Include sensitive fields for active recruiters or the profile owner
    include_sensitive = False
    is_owner = False
    if optional_session:
        if optional_session.email == profile.email:
            is_owner = True
        elif optional_session.user_type == "recruiter":
            recruiter = await recruiter_service.get_by_email(db, optional_session.email)
            include_sensitive = recruiter is not None and recruiter.status == "active"
    return ProfileResponse.from_orm_with_resume(profile, include_sensitive=include_sensitive, is_owner=is_owner)


@router.post("", response_model=ProfileCreateResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")
async def create_profile(
    request: Request,
    data: ProfileCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session),
):
    if data.website:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid submission",
        )

    profile = await profile_service.create_profile(db, data)

    if settings.is_production:
        if await verification_service.is_email_verified(db, profile.email):
            # Email already verified from a previous flow — activate immediately
            await profile_service.activate_profile(db, profile.profile_code)
            message = "Profile created and is now live."
        else:
            # Create verification record and send email
            verification = await verification_service.create_verification(
                db=db,
                email=profile.email,
                entity_type="profile",
                entity_code=profile.profile_code,
            )
            background_tasks.add_task(
                email_service.send_verification_email,
                db=db,
                email=profile.email,
                entity_type="profile",
                entity_code=profile.profile_code,
                verification_code=verification.verification_code,
                edit_token=profile.edit_token,
                frontend_url=settings.frontend_url,
            )
            message = "Profile created. Please check your email to verify and activate your profile."
    else:
        # Non-production: auto-activate immediately (email_verified=False stays as audit flag)
        await profile_service.activate_profile(db, profile.profile_code)
        message = "Profile created and is now live."

    return ProfileCreateResponse(code=profile.profile_code, message=message)


@router.put("/{code}", response_model=ProfileResponse)
async def update_profile(
    code: str,
    data: ProfileUpdate,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    profile = await profile_service.update_profile(db, code, edit_token, data)
    return ProfileResponse.from_orm_with_resume(profile)


@router.post("/{code}/deactivate", response_model=ProfileResponse)
async def deactivate_profile(
    code: str,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    profile = await profile_service.deactivate_profile(db, code, edit_token)
    return ProfileResponse.from_orm_with_resume(profile)


@router.post("/{code}/activate", response_model=ProfileResponse)
async def activate_profile_endpoint(
    code: str,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    profile = await profile_service.reactivate_profile(db, code, edit_token)
    return ProfileResponse.from_orm_with_resume(profile)


@router.delete("/{code}", response_model=ProfileResponse)
async def delete_profile(
    code: str,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    profile = await profile_service.remove_profile(db, code, edit_token)
    return ProfileResponse.from_orm_with_resume(profile)


@router.post("/{code}/renew", response_model=ProfileResponse)
async def renew_profile(
    code: str,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    """Renew a profile listing, extending expires_at by 60 days (max 2 renewals)."""
    profile = await profile_service.renew_profile(db, code, edit_token)
    return ProfileResponse.from_orm_with_resume(profile)
