import logging
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import and_, delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.auth_session import AuthSession
from app.models.email_log import EmailLog
from app.models.job import Job
from app.models.login_token import LoginToken
from app.models.profile import Profile
from app.models.user_sensitive import UserSensitive
from app.services import blog_service, email_service

router = APIRouter(prefix="/api/v1/internal", tags=["internal"])
logger = logging.getLogger(__name__)
settings = get_settings()

_EMAIL_LOG_RETENTION_DAYS = 90


def _require_secret(x_internal_secret: str = Header(alias="X-Internal-Secret")) -> None:
    if not settings.internal_api_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Internal secret not configured")
    if x_internal_secret != settings.internal_api_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal secret")


@router.post("/expire-listings", dependencies=[Depends(_require_secret)])
async def expire_listings(db: AsyncSession = Depends(get_db)):
    """Transition active listings past their expires_at to 'expired'.
    Also sends 7-day expiry warnings for listings expiring in exactly 7 days (+/- 1 hour window).
    Intended to be called by an external scheduler (e.g. Cloud Scheduler) once per hour.
    """
    now = datetime.now(UTC)

    # --- Expire overdue listings ---
    job_result = await db.execute(
        update(Job)
        .where(and_(Job.status == "active", Job.expires_at <= now))
        .values(status="expired", updated_at=now)
        .returning(Job.job_code)
    )
    expired_job_codes = [r[0] for r in job_result.all()]

    profile_result = await db.execute(
        update(Profile)
        .where(and_(Profile.status == "active", Profile.expires_at <= now))
        .values(status="expired", updated_at=now)
        .returning(Profile.profile_code)
    )
    expired_profile_codes = [r[0] for r in profile_result.all()]

    logger.info(
        "expire-listings: expired %d jobs, %d profiles",
        len(expired_job_codes),
        len(expired_profile_codes),
    )

    # Notify Google Indexing API for expired listings
    from app.services.indexing_service import notify_url_deleted

    for code in expired_job_codes:
        notify_url_deleted(f"{settings.frontend_url}/jobs/{code}")
    for code in expired_profile_codes:
        notify_url_deleted(f"{settings.frontend_url}/profiles/{code}")

    # --- Send 7-day expiry warnings ---
    # Window: expires_at is between (now + 7d - 1h) and (now + 7d + 1h)
    warn_from = now + timedelta(days=7) - timedelta(hours=1)
    warn_to = now + timedelta(days=7) + timedelta(hours=1)

    # Join with user_sensitive to get the owner email in a single query
    warning_jobs_result = await db.execute(
        select(Job, UserSensitive)
        .join(UserSensitive, Job.user_code == UserSensitive.user_code)
        .where(
            and_(
                Job.status == "active",
                Job.expires_at >= warn_from,
                Job.expires_at <= warn_to,
            )
        )
    )
    warning_jobs = warning_jobs_result.all()

    warning_profiles_result = await db.execute(
        select(Profile, UserSensitive)
        .join(UserSensitive, Profile.user_code == UserSensitive.user_code)
        .where(
            and_(
                Profile.status == "active",
                Profile.expires_at >= warn_from,
                Profile.expires_at <= warn_to,
            )
        )
    )
    warning_profiles = warning_profiles_result.all()

    email_sent = 0
    email_failed = 0

    for job, user in warning_jobs:
        manage_url = f"{settings.frontend_url}/manage/job/{job.job_code}?token={job.edit_token}"
        days_remaining = max(1, (job.expires_at.replace(tzinfo=UTC) - now).days)
        sent = await email_service.send_expiry_warning_email(
            db=db,
            email=user.user_email,
            entity_type="job",
            entity_code=job.job_code,
            entity_title=job.job_title,
            manage_url=manage_url,
            days_remaining=days_remaining,
        )
        if sent:
            email_sent += 1
        else:
            email_failed += 1

    for profile, user in warning_profiles:
        manage_url = f"{settings.frontend_url}/manage/profile/{profile.profile_code}?token={profile.edit_token}"
        days_remaining = max(1, (profile.expires_at.replace(tzinfo=UTC) - now).days)
        sent = await email_service.send_expiry_warning_email(
            db=db,
            email=user.user_email,
            entity_type="profile",
            entity_code=profile.profile_code,
            entity_title=profile.current_title,
            manage_url=manage_url,
            days_remaining=days_remaining,
        )
        if sent:
            email_sent += 1
        else:
            email_failed += 1

    logger.info(
        "expire-listings: sent %d expiry warning emails, %d failed",
        email_sent,
        email_failed,
    )

    return {
        "expired_jobs": len(expired_job_codes),
        "expired_profiles": len(expired_profile_codes),
        "warning_emails_sent": email_sent,
        "warning_emails_failed": email_failed,
    }


@router.post("/cleanup", dependencies=[Depends(_require_secret)])
async def cleanup(db: AsyncSession = Depends(get_db)):
    """Delete stale rows that are no longer needed:
    - Expired auth_sessions
    - Used/expired login_tokens
    - Email log rows older than 90 days
    Intended to be called by an external scheduler once per day.
    """
    now = datetime.now(UTC)
    cutoff_email_log = now - timedelta(days=_EMAIL_LOG_RETENTION_DAYS)

    session_result = await db.execute(delete(AuthSession).where(AuthSession.expires_at <= now))
    token_result = await db.execute(delete(LoginToken).where(LoginToken.expires_at <= now))
    log_result = await db.execute(delete(EmailLog).where(EmailLog.created_at <= cutoff_email_log))

    deleted_sessions = session_result.rowcount
    deleted_tokens = token_result.rowcount
    deleted_logs = log_result.rowcount

    logger.info(
        "cleanup: deleted %d sessions, %d tokens, %d email_log rows",
        deleted_sessions,
        deleted_tokens,
        deleted_logs,
    )

    return {
        "deleted_sessions": deleted_sessions,
        "deleted_login_tokens": deleted_tokens,
        "deleted_email_logs": deleted_logs,
    }


@router.post("/sync-substack", dependencies=[Depends(_require_secret)])
async def sync_substack(db: AsyncSession = Depends(get_db)):
    """Fetch configured Substack RSS posts into the public blog table.

    Intended to be called by Cloud Scheduler hourly or daily. If the feed is
    not configured, this returns a successful no-op so deployments can enable
    the feature by setting environment variables only.
    """
    result = await blog_service.sync_substack_posts(
        db,
        feed_url=settings.substack_feed_url,
        publication_url=settings.substack_publication_url,
        publication_name=settings.substack_publication_name,
    )
    logger.info("sync-substack: %s", result)
    return result
