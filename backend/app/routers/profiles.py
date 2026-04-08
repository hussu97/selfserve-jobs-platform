from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_session, require_edit_token
from app.schemas.profile import (
    ProfileCreate,
    ProfileCreateResponse,
    ProfileListItem,
    ProfileListResponse,
    ProfileResponse,
    ProfileUpdate,
    ResumeUrlResponse,
)
from app.services import profile_service, verification_service, email_service, storage_service

router = APIRouter(prefix="/api/v1/profiles", tags=["profiles"])
settings = get_settings()


@router.get("/", response_model=ProfileListResponse)
async def list_profiles(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    search: Optional[str] = Query(None, description="Full-text search"),
    country: Optional[str] = Query(None),
    skills: Optional[list[str]] = Query(None),
    min_experience: Optional[int] = Query(None, ge=0),
    max_experience: Optional[int] = Query(None, le=50),
    relocation_preference: Optional[str] = Query(None),
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
    items = []
    for p in result["items"]:
        items.append(
            ProfileListItem(
                code=p.profile_code,
                person_name=p.person_name,
                current_city=p.current_city,
                current_country=p.current_country,
                years_of_experience=p.years_of_experience,
                current_title=p.current_title,
                notice_period=p.notice_period,
                relocation_preference=p.relocation_preference,
                key_skills=p.key_skills or [],
                status=p.status,
                view_count=p.view_count,
                expires_at=p.expires_at,
                created_at=p.created_at,
                has_resume=bool(p.resume_gcs_path),
            )
        )
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
    db: AsyncSession = Depends(get_session),
):
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
    db: AsyncSession = Depends(get_session),
):
    profile = await profile_service.get_profile_detail(db, code)
    return ProfileResponse.from_orm_with_resume(profile)


@router.post("/", response_model=ProfileCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    data: ProfileCreate,
    db: AsyncSession = Depends(get_session),
):
    if data.website:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid submission",
        )

    profile = await profile_service.create_profile(db, data)

    verification = await verification_service.create_verification(
        db=db,
        email=profile.email,
        entity_type="profile",
        entity_code=profile.profile_code,
    )

    await email_service.send_verification_email(
        email=profile.email,
        entity_type="profile",
        entity_code=profile.profile_code,
        verification_code=verification.verification_code,
        edit_token=profile.edit_token,
        frontend_url=settings.frontend_url,
    )

    return ProfileCreateResponse(
        code=profile.profile_code,
        message="Profile created. Please check your email to verify and activate your profile.",
    )


@router.put("/{code}", response_model=ProfileResponse)
async def update_profile(
    code: str,
    data: ProfileUpdate,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    profile = await profile_service.update_profile(db, code, edit_token, data)
    return ProfileResponse.from_orm_with_resume(profile)


@router.delete("/{code}", response_model=ProfileResponse)
async def delete_profile(
    code: str,
    edit_token: str = Depends(require_edit_token),
    db: AsyncSession = Depends(get_session),
):
    profile = await profile_service.remove_profile(db, code, edit_token)
    return ProfileResponse.from_orm_with_resume(profile)
