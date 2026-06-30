import logging
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.auth_session import AuthSession
from app.models.email_log import EmailLog
from app.models.login_token import LoginToken
from app.services import blog_service

router = APIRouter(prefix="/api/v1/internal", tags=["internal"])
logger = logging.getLogger(__name__)
settings = get_settings()

_EMAIL_LOG_RETENTION_DAYS = 90


def _require_secret(x_internal_secret: str = Header(alias="X-Internal-Secret")) -> None:
    if not settings.internal_api_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Internal secret not configured")
    if x_internal_secret != settings.internal_api_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal secret")


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
