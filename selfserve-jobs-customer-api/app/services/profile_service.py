import logging
import math
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select, update
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import MAX_ACTIVE_PROFILES_PER_EMAIL, PROFILE_EXPIRY_DAYS
from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileUpdate
from app.services.code_generator import generate_code, generate_token

logger = logging.getLogger(__name__)


async def get_active_profile_count_for_email(db: AsyncSession, email: str) -> int:
    result = await db.execute(
        select(func.count(Profile.id)).where(
            and_(
                Profile.email == email,
                Profile.status.in_(["active", "pending_verification"]),
            )
        )
    )
    return result.scalar_one()


async def create_profile(db: AsyncSession, data: ProfileCreate) -> Profile:
    """Create a new profile."""
    active_count = await get_active_profile_count_for_email(db, data.email)
    if active_count >= MAX_ACTIVE_PROFILES_PER_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Maximum of {MAX_ACTIVE_PROFILES_PER_EMAIL} active profiles per email address.",
        )

    now = datetime.now(UTC)
    profile = Profile(
        profile_code=generate_code(12),
        person_name=data.person_name,
        email=data.email,
        email_verified=False,
        contact_number=data.contact_number,
        brief=data.brief,
        current_city=data.current_city,
        current_country=data.current_country,
        years_of_experience=data.years_of_experience,
        current_title=data.current_title,
        notice_period=data.notice_period,
        relocation_preference=data.relocation_preference,
        linkedin_profile_link=data.linkedin_profile_link,
        key_skills=data.key_skills or [],
        resume_gcs_path=data.resume_key or None,
        status="pending_verification",
        view_count=0,
        expires_at=now + timedelta(days=PROFILE_EXPIRY_DAYS),
        edit_token=generate_token(64),
        created_at=now,
        updated_at=now,
    )
    db.add(profile)
    await db.flush()
    return profile


async def get_profile_by_code(db: AsyncSession, profile_code: str) -> Profile:
    result = await db.execute(select(Profile).where(Profile.profile_code == profile_code))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


async def get_profile_by_code_and_token(db: AsyncSession, profile_code: str, edit_token: str) -> Profile:
    result = await db.execute(
        select(Profile).where(and_(Profile.profile_code == profile_code, Profile.edit_token == edit_token))
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid edit token or profile not found",
        )
    return profile


async def increment_view_count(db: AsyncSession, profile_code: str) -> None:
    await db.execute(
        update(Profile).where(Profile.profile_code == profile_code).values(view_count=Profile.view_count + 1)
    )


async def get_profile_detail(db: AsyncSession, profile_code: str) -> Profile:
    """Get profile detail. Increments view count atomically first so the response reflects the current count.

    Intentional preview behaviour: pending_verification listings are accessible by direct URL.
    They are not surfaced in browse/list endpoints until status = 'active'.
    """
    await db.execute(
        update(Profile).where(Profile.profile_code == profile_code).values(view_count=Profile.view_count + 1)
    )
    profile = await get_profile_by_code(db, profile_code)
    if profile.status not in ("active", "pending_verification"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


async def list_profiles(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    q: str | None = None,
    country: str | None = None,
    skills: list[str] | None = None,
    min_experience: int | None = None,
    max_experience: int | None = None,
    relocation_preference: str | None = None,
    sort: str = "newest",
) -> dict:
    per_page = min(per_page, 50)
    filters = [Profile.status == "active"]

    if q:
        # Full-text search on name, title, brief
        ts_query = func.plainto_tsquery("english", q)
        ts_vector = func.to_tsvector(
            "english",
            func.concat_ws(" ", Profile.person_name, Profile.current_title, Profile.brief),
        )
        filters.append(ts_vector.op("@@")(ts_query))

    if country:
        filters.append(func.lower(Profile.current_country) == country.lower())

    if skills:
        for skill in skills:
            filters.append(Profile.key_skills.cast(JSONB).contains([skill]))

    if min_experience is not None:
        filters.append(Profile.years_of_experience >= min_experience)

    if max_experience is not None:
        filters.append(Profile.years_of_experience <= max_experience)

    if relocation_preference:
        filters.append(Profile.relocation_preference == relocation_preference)

    base_query = select(Profile).where(and_(*filters))

    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    if sort == "oldest":
        base_query = base_query.order_by(Profile.created_at.asc())
    else:
        base_query = base_query.order_by(Profile.created_at.desc())

    offset = (page - 1) * per_page
    base_query = base_query.offset(offset).limit(per_page)

    result = await db.execute(base_query)
    profiles = result.scalars().all()

    total_pages = math.ceil(total / per_page) if total > 0 else 1

    return {
        "items": profiles,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


def to_list_item(p: Profile) -> dict:
    """Convert a Profile ORM object to a dict suitable for ProfileListItem construction."""
    return {
        "code": p.profile_code,
        "person_name": p.person_name,
        "current_city": p.current_city,
        "current_country": p.current_country,
        "years_of_experience": p.years_of_experience,
        "current_title": p.current_title,
        "notice_period": p.notice_period,
        "relocation_preference": p.relocation_preference,
        "key_skills": p.key_skills or [],
        "status": p.status,
        "view_count": p.view_count,
        "expires_at": p.expires_at,
        "created_at": p.created_at,
        "has_resume": bool(p.resume_gcs_path),
    }


async def update_profile(
    db: AsyncSession,
    profile_code: str,
    edit_token: str,
    data: ProfileUpdate,
) -> Profile:
    profile = await get_profile_by_code_and_token(db, profile_code, edit_token)

    if profile.status == "removed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit a removed profile",
        )

    _UPDATABLE_FIELDS = {
        "person_name",
        "contact_number",
        "brief",
        "current_city",
        "current_country",
        "years_of_experience",
        "current_title",
        "notice_period",
        "relocation_preference",
        "linkedin_profile_link",
        "key_skills",
    }
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if k in _UPDATABLE_FIELDS}
    for field, value in update_data.items():
        setattr(profile, field, value)

    profile.updated_at = datetime.now(UTC)
    await db.flush()
    return profile


async def remove_profile(
    db: AsyncSession,
    profile_code: str,
    edit_token: str,
) -> Profile:
    profile = await get_profile_by_code_and_token(db, profile_code, edit_token)
    resume_path = profile.resume_gcs_path
    profile.status = "removed"
    profile.updated_at = datetime.now(UTC)
    await db.flush()

    if resume_path:
        from app.services import storage_service

        try:
            await storage_service.delete_file(resume_path)
        except Exception as exc:
            logger.warning("Failed to delete resume file %s: %s", resume_path, exc)

    return profile


async def update_resume(
    db: AsyncSession,
    profile_code: str,
    gcs_path: str,
    original_filename: str,
) -> Profile:
    profile = await get_profile_by_code(db, profile_code)
    profile.resume_gcs_path = gcs_path
    profile.resume_original_filename = original_filename
    profile.updated_at = datetime.now(UTC)
    await db.flush()
    return profile


async def activate_profile(db: AsyncSession, profile_code: str) -> None:
    """Auto-activate a profile without email verification (non-production only)."""
    now = datetime.now(UTC)
    await db.execute(
        update(Profile)
        .where(Profile.profile_code == profile_code)
        .values(
            email_verified=True,
            status="active",
            updated_at=now,
        )
    )


async def deactivate_profile(db: AsyncSession, profile_code: str, edit_token: str) -> Profile:
    """Set an active profile to inactive."""
    profile = await get_profile_by_code_and_token(db, profile_code, edit_token)
    if profile.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active profiles can be deactivated",
        )
    profile.status = "inactive"
    profile.updated_at = datetime.now(UTC)
    await db.flush()
    return profile


async def reactivate_profile(db: AsyncSession, profile_code: str, edit_token: str) -> Profile:
    """Set an inactive profile back to active."""
    profile = await get_profile_by_code_and_token(db, profile_code, edit_token)
    if profile.status != "inactive":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only inactive profiles can be reactivated",
        )
    profile.status = "active"
    profile.updated_at = datetime.now(UTC)
    await db.flush()
    return profile


async def validate_token(
    db: AsyncSession,
    entity_code: str,
    token: str,
) -> bool:
    result = await db.execute(
        select(Profile).where(and_(Profile.profile_code == entity_code, Profile.edit_token == token))
    )
    return result.scalar_one_or_none() is not None


async def get_entities_for_email(
    db: AsyncSession,
    email: str,
    frontend_url: str,
) -> list[dict]:
    """Return all active/pending jobs and profiles for a given email with management links."""
    from app.models.job import Job

    entities = []

    # Jobs
    job_result = await db.execute(
        select(Job).where(
            and_(
                Job.email == email,
                Job.status.in_(["active", "pending_verification"]),
            )
        )
    )
    for job in job_result.scalars().all():
        entities.append(
            {
                "entity_type": "job",
                "entity_code": job.job_code,
                "title": job.job_title,
                "status": job.status,
                "manage_url": f"{frontend_url}/manage/job/{job.job_code}?token={job.edit_token}",
            }
        )

    # Profiles
    profile_result = await db.execute(
        select(Profile).where(
            and_(
                Profile.email == email,
                Profile.status.in_(["active", "pending_verification"]),
            )
        )
    )
    for profile in profile_result.scalars().all():
        entities.append(
            {
                "entity_type": "profile",
                "entity_code": profile.profile_code,
                "title": profile.current_title,
                "status": profile.status,
                "manage_url": f"{frontend_url}/manage/profile/{profile.profile_code}?token={profile.edit_token}",
            }
        )

    return entities


async def renew_profile(db: AsyncSession, profile_code: str, edit_token: str) -> Profile:
    """Extend a profile listing's expiry by RENEWAL_EXTENSION_DAYS (max MAX_RENEWALS times)."""
    from app.constants import MAX_RENEWALS, RENEWAL_EXTENSION_DAYS

    profile = await get_profile_by_code_and_token(db, profile_code, edit_token)
    if profile.status not in ("active", "expired"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active or expired listings can be renewed",
        )
    if profile.renewal_count >= MAX_RENEWALS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum of {MAX_RENEWALS} renewals reached for this listing",
        )
    now = datetime.now(UTC)
    base = max(now, profile.expires_at)
    profile.expires_at = base + timedelta(days=RENEWAL_EXTENSION_DAYS)
    profile.renewal_count += 1
    profile.status = "active"
    profile.updated_at = now
    await db.flush()
    return profile
