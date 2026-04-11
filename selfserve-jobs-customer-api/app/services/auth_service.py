import logging
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import (
    ADMIN_SESSION_EXPIRY_DAYS,
    ADMIN_SESSION_INACTIVITY_HOURS,
    LOGIN_RATE_LIMIT_PER_HOUR,
    LOGIN_TOKEN_EXPIRY_MINUTES,
    SESSION_EXPIRY_DAYS,
)
from app.models.auth_session import AuthSession
from app.models.job import Job
from app.models.login_token import LoginToken
from app.models.profile import Profile
from app.services.code_generator import generate_token

logger = logging.getLogger(__name__)


async def create_login_token(db: AsyncSession, email: str) -> LoginToken:
    """Generate a login token. Rate-limited to 5 per email per hour."""
    window_start = datetime.now(UTC) - timedelta(hours=1)
    result = await db.execute(
        select(func.count(LoginToken.id)).where(
            and_(
                LoginToken.email == email,
                LoginToken.created_at > window_start,
            )
        )
    )
    count = result.scalar_one()
    if count >= LOGIN_RATE_LIMIT_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login requests. Please wait before trying again.",
        )

    now = datetime.now(UTC)
    token = LoginToken(
        token=generate_token(64),
        email=email,
        used=False,
        expires_at=now + timedelta(minutes=LOGIN_TOKEN_EXPIRY_MINUTES),
    )
    db.add(token)
    await db.flush()
    return token


async def verify_login_token(db: AsyncSession, token_str: str) -> AuthSession:
    """Validate a login token and create a session."""
    now = datetime.now(UTC)
    result = await db.execute(
        select(LoginToken).where(
            and_(
                LoginToken.token == token_str,
                LoginToken.used.is_(False),
                LoginToken.expires_at > now,
            )
        )
    )
    token = result.scalar_one_or_none()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired login token",
        )

    token.used = True
    await db.flush()

    return await create_session(db, token.email)


async def create_session(db: AsyncSession, email: str) -> AuthSession:
    """Create a new auth session for an email. Admin takes precedence over recruiter."""
    from app.config import get_settings
    from app.services import recruiter_service

    settings = get_settings()
    now = datetime.now(UTC)
    recruiter = await recruiter_service.get_by_email(db, email)

    if email in settings.admin_email_list:
        user_type = "admin"
        recruiter_code = None
        expiry = timedelta(days=ADMIN_SESSION_EXPIRY_DAYS)
    elif recruiter:
        user_type = "recruiter"
        recruiter_code = recruiter.recruiter_code
        expiry = timedelta(days=SESSION_EXPIRY_DAYS)
    else:
        user_type = None
        recruiter_code = None
        expiry = timedelta(days=SESSION_EXPIRY_DAYS)

    session = AuthSession(
        session_token=generate_token(64),
        email=email,
        user_type=user_type,
        recruiter_code=recruiter_code,
        expires_at=now + expiry,
        last_active_at=now,
    )
    db.add(session)
    await db.flush()
    return session


async def validate_session(db: AsyncSession, session_token: str) -> AuthSession | None:
    """Check token exists and hasn't expired. Enforces 1-hour inactivity timeout for admin sessions."""
    now = datetime.now(UTC)
    result = await db.execute(
        select(AuthSession).where(
            and_(
                AuthSession.session_token == session_token,
                AuthSession.expires_at > now,
            )
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        return None

    # Admin sessions expire after 1 hour of inactivity
    if session.user_type == "admin" and session.last_active_at is not None:
        idle_limit = timedelta(hours=ADMIN_SESSION_INACTIVITY_HOURS)
        if now - session.last_active_at > idle_limit:
            await db.delete(session)
            await db.flush()
            return None

    # Update last_active_at for activity tracking
    session.last_active_at = now
    await db.flush()
    return session


async def delete_session(db: AsyncSession, session_token: str) -> None:
    """Delete a session (logout)."""
    result = await db.execute(select(AuthSession).where(AuthSession.session_token == session_token))
    session = result.scalar_one_or_none()
    if session:
        await db.delete(session)
        await db.flush()


async def get_entities_for_session(db: AsyncSession, email: str) -> dict:
    """Return all jobs and profiles for the given email with edit_tokens."""
    jobs_result = await db.execute(
        select(Job)
        .where(
            and_(
                Job.email == email,
                Job.status.notin_(["removed"]),
            )
        )
        .order_by(Job.created_at.desc())
    )
    jobs = jobs_result.scalars().all()

    profiles_result = await db.execute(
        select(Profile)
        .where(
            and_(
                Profile.email == email,
                Profile.status.notin_(["removed"]),
            )
        )
        .order_by(Profile.created_at.desc())
    )
    profiles = profiles_result.scalars().all()

    return {
        "jobs": [
            {
                "entity_type": "job",
                "code": j.job_code,
                "title": j.job_title,
                "status": j.status,
                "edit_token": j.edit_token,
                "view_count": j.view_count,
                "created_at": j.created_at,
                "expires_at": j.expires_at,
            }
            for j in jobs
        ],
        "profiles": [
            {
                "entity_type": "profile",
                "code": p.profile_code,
                "title": p.person_name,
                "status": p.status,
                "edit_token": p.edit_token,
                "view_count": p.view_count,
                "created_at": p.created_at,
                "expires_at": p.expires_at,
            }
            for p in profiles
        ],
    }
