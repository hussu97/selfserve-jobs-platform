import logging
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import RESEND_LIMIT_PER_ENTITY, VERIFICATION_EXPIRY_HOURS
from app.models.email_verification import EmailVerification
from app.models.job import Job
from app.models.profile import Profile
from app.services.code_generator import generate_verification_code

logger = logging.getLogger(__name__)

RESEND_WINDOW_HOURS = 24


async def create_verification(
    db: AsyncSession,
    entity_type: str,
    entity_code: str,
    user_code: str | None = None,
) -> EmailVerification:
    """Create a new email verification record.

    *user_code* must be provided for 'job' and 'profile' entity types.
    It is null for 'recruiter' entities (which have their own account system).
    """
    code = generate_verification_code(64)
    now = datetime.now(UTC)
    verification = EmailVerification(
        verification_code=code,
        user_code=user_code,
        entity_type=entity_type,
        entity_code=entity_code,
        expires_at=now + timedelta(hours=VERIFICATION_EXPIRY_HOURS),
    )
    db.add(verification)
    await db.flush()
    return verification


async def verify_code(
    db: AsyncSession,
    verification_code: str,
) -> dict:
    """Verify a code and activate the entity. Returns entity_type and entity_code."""
    now = datetime.now(UTC)

    result = await db.execute(
        select(EmailVerification).where(
            and_(
                EmailVerification.verification_code == verification_code,
                EmailVerification.verified_at.is_(None),
                EmailVerification.expires_at > now,
            )
        )
    )
    verification = result.scalar_one_or_none()

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code",
        )

    # Mark verification as done
    verification.verified_at = now

    if verification.entity_type not in ("job", "profile", "recruiter"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unknown entity type",
        )

    if verification.entity_type == "recruiter":
        # Move recruiter to pending_approval and notify admin
        from app.services import recruiter_service

        recruiter = await recruiter_service.activate_recruiter(db, verification.entity_code)
        await db.flush()

        # Fetch recruiter email for session creation
        from app.models.recruiter import Recruiter

        recruiter_row = await db.execute(select(Recruiter).where(Recruiter.recruiter_code == verification.entity_code))
        recruiter_obj = recruiter_row.scalar_one()

        from app.services.auth_service import create_session

        session = await create_session(db, recruiter_obj.email)

        return {
            "entity_type": "recruiter",
            "entity_code": verification.entity_code,
            "email": recruiter_obj.email,
            "session_token": session.session_token,
            "recruiter_status": recruiter.status,
            "user_type": session.user_type,
        }

    # Activate ALL pending jobs and profiles for this user_code — one verified email
    # confirms ownership of the address, so all pending listings under it go live.
    job_result = await db.execute(
        update(Job)
        .where(and_(Job.user_code == verification.user_code, Job.status == "pending_verification"))
        .values(email_verified=True, status="active", updated_at=now)
        .returning(Job.job_code)
    )
    activated_job_codes = [r[0] for r in job_result.all()]

    profile_result = await db.execute(
        update(Profile)
        .where(and_(Profile.user_code == verification.user_code, Profile.status == "pending_verification"))
        .values(email_verified=True, status="active", updated_at=now)
        .returning(Profile.profile_code)
    )
    activated_profile_codes = [r[0] for r in profile_result.all()]

    await db.flush()

    # Notify Google Indexing API for newly activated listings
    from app.config import get_settings as _get_settings
    from app.services.indexing_service import notify_url_updated

    _settings = _get_settings()
    for code in activated_job_codes:
        notify_url_updated(f"{_settings.frontend_url}/jobs/{code}")
    for code in activated_profile_codes:
        notify_url_updated(f"{_settings.frontend_url}/profiles/{code}")

    # Fetch user email from user_sensitive for session creation and response
    from app.models.user_sensitive import UserSensitive

    user_row = await db.execute(select(UserSensitive).where(UserSensitive.user_code == verification.user_code))
    user = user_row.scalar_one()

    from app.services.auth_service import create_session

    session = await create_session(db, user.user_email)

    return {
        "entity_type": verification.entity_type,
        "entity_code": verification.entity_code,
        "email": user.user_email,
        "session_token": session.session_token,
        "user_type": session.user_type,
    }


async def get_pending_entity_for_resend(
    db: AsyncSession,
    entity_type: str,
    email: str,
    entity_code: str | None,
) -> tuple[str, str, str]:
    """Resolve the entity code, edit token, and user_code for a resend request.

    Returns ``(entity_code, edit_token, user_code)``. Raises 404 if no matching
    pending entity is found for the given email, and 400 for an invalid entity_type.
    """
    from app.models.user_sensitive import UserSensitive

    # Resolve email → user_code
    user_row = await db.execute(select(UserSensitive).where(UserSensitive.user_email == email))
    user = user_row.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pending {entity_type} not found for this email",
        )

    if entity_type == "job":
        query = select(Job).where(
            and_(
                Job.user_code == user.user_code,
                Job.status == "pending_verification",
            )
        )
        if entity_code:
            query = query.where(Job.job_code == entity_code)
        result = await db.execute(query)
        entity = result.scalar_one_or_none()
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pending job not found for this email",
            )
        return entity.job_code, entity.edit_token, user.user_code

    if entity_type == "profile":
        query = select(Profile).where(
            and_(
                Profile.user_code == user.user_code,
                Profile.status == "pending_verification",
            )
        )
        if entity_code:
            query = query.where(Profile.profile_code == entity_code)
        result = await db.execute(query)
        entity = result.scalar_one_or_none()
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pending profile not found for this email",
            )
        return entity.profile_code, entity.edit_token, user.user_code

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid entity type",
    )


async def is_email_verified(db: AsyncSession, user_code: str) -> bool:
    """Return True if this user_code has at least one completed verification record."""
    result = await db.execute(
        select(func.count(EmailVerification.id)).where(
            and_(
                EmailVerification.user_code == user_code,
                EmailVerification.verified_at.is_not(None),
            )
        )
    )
    return result.scalar_one() > 0


async def check_resend_rate_limit(
    db: AsyncSession,
    entity_type: str,
    entity_code: str,
) -> None:
    """Raise if resend limit is exceeded for this entity in the past 24h."""
    window_start = datetime.now(UTC) - timedelta(hours=RESEND_WINDOW_HOURS)
    result = await db.execute(
        select(func.count(EmailVerification.id)).where(
            and_(
                EmailVerification.entity_type == entity_type,
                EmailVerification.entity_code == entity_code,
                EmailVerification.created_at > window_start,
            )
        )
    )
    count = result.scalar_one()
    if count >= RESEND_LIMIT_PER_ENTITY:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Resend limit reached. Maximum {RESEND_LIMIT_PER_ENTITY} verification emails per entity per 24 hours.",  # noqa: E501
        )
