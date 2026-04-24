from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.constants import MAX_PAGE
from app.dependencies import get_current_session, get_optional_session, get_session, require_edit_token
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
from app.services import (
    email_service,
    profile_service,
    recruiter_service,
    storage_service,
    user_service,
    verification_service,
)

router = APIRouter(prefix="/api/v1/profiles", tags=["profiles"])
settings = get_settings()


@router.get("/top-skills", response_model=list[str])
async def get_top_skills(
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_session),
):
    return await profile_service.get_top_skills(db, limit=limit)


@router.get("", response_model=ProfileListResponse)
async def list_profiles(
    page: int = Query(1, ge=1, le=MAX_PAGE),
    per_page: int = Query(20, ge=1, le=50),
    search: str | None = Query(None, description="Full-text search"),
    country: str | None = Query(None),
    city: str | None = Query(None),
    skills: list[str] | None = Query(None),
    min_experience: int | None = Query(None, ge=0),
    max_experience: int | None = Query(None, le=50),
    relocation_preference: str | None = Query(None),
    employment_status: list[str] | None = Query(None),
    notice_period: list[str] | None = Query(None),
    sort: str = Query("newest", pattern="^(newest|oldest)$"),
    db: AsyncSession = Depends(get_session),
):
    result = await profile_service.list_profiles(
        db=db,
        page=page,
        per_page=per_page,
        q=search,
        country=country,
        city=city,
        skills=skills,
        min_experience=min_experience,
        max_experience=max_experience,
        relocation_preference=relocation_preference,
        employment_status=employment_status,
        notice_period=notice_period,
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
    session: AuthSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_session),
):
    """Return a temporary signed URL for the resume.

    Access is limited to admins, active recruiters, and the profile owner.
    """
    profile = await profile_service.get_profile_by_code(db, code)
    if not profile.resume_gcs_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume uploaded for this profile",
        )

    has_access = False
    if session.user_type == "admin":
        has_access = True
    elif session.user_type == "recruiter":
        recruiter = await recruiter_service.get_by_email(db, session.email)
        has_access = recruiter is not None and recruiter.status == "active"
    else:
        session_user = await user_service.get_by_email(db, session.email)
        has_access = session_user is not None and session_user.user_code == profile.user_code

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this resume.",
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
    include_sensitive = False
    is_owner = False
    profile_user = None

    if optional_session:
        if optional_session.user_type == "admin":
            # Admins always get full sensitive access
            include_sensitive = True
            profile_user = await user_service.get_by_code(db, profile.user_code)
        elif optional_session.user_type == "recruiter":
            recruiter = await recruiter_service.get_by_email(db, optional_session.email)
            if recruiter is not None and recruiter.status == "active":
                include_sensitive = True
                # Fetch user_sensitive so we can include email/phone in the response
                profile_user = await user_service.get_by_code(db, profile.user_code)
        else:
            # Check if this session belongs to the profile owner via user_sensitive
            session_user = await user_service.get_by_email(db, optional_session.email)
            if session_user and session_user.user_code == profile.user_code:
                is_owner = True
                profile_user = session_user

    return ProfileResponse.from_orm_with_resume(
        profile, user=profile_user, include_sensitive=include_sensitive, is_owner=is_owner
    )


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

    profile, user = await profile_service.create_profile(db, data)

    if settings.is_production:
        if await verification_service.is_email_verified(db, user.user_code):
            # Email already verified from a previous flow — activate immediately
            await profile_service.activate_profile(db, profile.profile_code)
            message = "Profile created and is now live."
        else:
            # Create verification record and send email
            verification = await verification_service.create_verification(
                db=db,
                user_code=user.user_code,
                entity_type="profile",
                entity_code=profile.profile_code,
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
