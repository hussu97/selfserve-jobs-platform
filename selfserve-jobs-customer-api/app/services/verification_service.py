import logging
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_verification import EmailVerification
from app.models.job import Job
from app.models.profile import Profile
from app.services.code_generator import generate_verification_code

logger = logging.getLogger(__name__)

VERIFICATION_EXPIRY_HOURS = 24
RESEND_LIMIT_PER_ENTITY = 3
RESEND_WINDOW_HOURS = 24


async def create_verification(
    db: AsyncSession,
    email: str,
    entity_type: str,
    entity_code: str,
) -> EmailVerification:
    """Create a new email verification record."""
    code = generate_verification_code(64)
    now = datetime.now(UTC)
    verification = EmailVerification(
        verification_code=code,
        email=email,
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

        # Auto-create session
        from app.services.auth_service import create_session

        session = await create_session(db, verification.email)

        return {
            "entity_type": "recruiter",
            "entity_code": verification.entity_code,
            "email": verification.email,
            "session_token": session.session_token,
            "recruiter_status": recruiter.status,
        }

    # Activate ALL pending jobs and profiles for this email — one verified email
    # confirms ownership of the address, so all pending listings under it go live.
    await db.execute(
        update(Job)
        .where(and_(Job.email == verification.email, Job.status == "pending_verification"))
        .values(email_verified=True, status="active", updated_at=now)
    )
    await db.execute(
        update(Profile)
        .where(and_(Profile.email == verification.email, Profile.status == "pending_verification"))
        .values(email_verified=True, status="active", updated_at=now)
    )

    await db.flush()

    # Auto-create an auth session so the user is logged in immediately after verifying
    from app.services.auth_service import create_session

    session = await create_session(db, verification.email)

    return {
        "entity_type": verification.entity_type,
        "entity_code": verification.entity_code,
        "email": verification.email,
        "session_token": session.session_token,
    }


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
