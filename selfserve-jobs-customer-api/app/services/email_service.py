import asyncio
import logging
import time
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.email_templates import admin_login as admin_login_template
from app.email_templates import admin_report as admin_report_template
from app.email_templates import expiry_warning as expiry_warning_template
from app.email_templates import login as login_template
from app.email_templates import management_links as management_links_template
from app.email_templates import recruiter_status as recruiter_status_template
from app.email_templates import recruiter_verification as recruiter_verification_template
from app.email_templates import verification as verification_template

logger = logging.getLogger(__name__)
settings = get_settings()

# ---------------------------------------------------------------------------
# Circuit breaker state (in-memory, per-process)
# ---------------------------------------------------------------------------
# Opens after _CB_FAILURE_THRESHOLD consecutive failures; resets after _CB_COOLDOWN_SECS.

_CB_FAILURE_THRESHOLD = 5
_CB_COOLDOWN_SECS = 120  # 2 minutes

_cb_consecutive_failures: int = 0
_cb_open_since: float | None = None  # time.monotonic() when circuit opened

# Retry delays in seconds (3 attempts total after initial try)
_RETRY_DELAYS = [1, 5, 30]


def _cb_is_open() -> bool:
    """Return True if the circuit is open (i.e. Resend calls should be skipped)."""
    global _cb_open_since
    if _cb_open_since is None:
        return False
    elapsed = time.monotonic() - _cb_open_since
    if elapsed >= _CB_COOLDOWN_SECS:
        # Transition to half-open — allow one probe
        _cb_open_since = None
        logger.info("[email-circuit] cooldown elapsed — moving to half-open")
        return False
    return True


def _cb_record_success() -> None:
    global _cb_consecutive_failures, _cb_open_since
    _cb_consecutive_failures = 0
    _cb_open_since = None


def _cb_record_failure() -> None:
    global _cb_consecutive_failures, _cb_open_since
    _cb_consecutive_failures += 1
    if _cb_consecutive_failures >= _CB_FAILURE_THRESHOLD and _cb_open_since is None:
        _cb_open_since = time.monotonic()
        logger.warning(
            "[email-circuit] opened after %d consecutive failures — cooling down for %ds",
            _cb_consecutive_failures,
            _CB_COOLDOWN_SECS,
        )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _save_pending_email(
    db: AsyncSession,
    email_type: str,
    recipient_email: str,
    subject: str,
    html_body: str,
    text_body: str,
    entity_type: str | None,
    entity_code: str | None,
) -> None:
    """Persist a failed email to email_pending so it can be retried on the next send."""
    try:
        from app.models.email_pending import EmailPending

        pending = EmailPending(
            email_type=email_type,
            recipient_email=recipient_email,
            entity_type=entity_type,
            entity_code=entity_code,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
        )
        db.add(pending)
        await db.flush()
        logger.info(
            "[email-pending] queued failed %s email to %s for later retry",
            email_type,
            recipient_email,
        )
    except Exception as exc:
        logger.error("[email-pending] failed to save pending email: %s", exc)


async def _flush_pending_emails(db: AsyncSession) -> None:
    """
    Attempt a single delivery pass for every email queued in the last 24 hours.
    Uses one attempt per record (no retry loop) to keep the calling request's
    latency bounded. Successful records are removed; failed records have their
    attempt_count incremented so callers can observe escalation.
    """
    from datetime import datetime, timedelta, timezone

    from sqlalchemy import select

    from app.models.email_pending import EmailPending

    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    result = await db.execute(select(EmailPending).where(EmailPending.created_at >= cutoff))
    pending_emails = result.scalars().all()

    if not pending_emails:
        return

    logger.info("[email-pending] flushing %d queued email(s)", len(pending_emails))

    import resend as resend_lib

    resend_lib.api_key = settings.resend_api_key

    for record in pending_emails:
        if _cb_is_open():
            logger.warning(
                "[email-pending] circuit open — aborting flush with %d email(s) remaining",
                len(pending_emails),
            )
            break

        params: dict[str, Any] = {
            "from": settings.resend_from_email,
            "to": [record.recipient_email],
            "subject": record.subject,
            "html": record.html_body,
            "text": record.text_body,
            "headers": {
                "List-Unsubscribe": _build_list_unsubscribe_header(settings.frontend_url),
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
        }

        try:
            send_result = await asyncio.to_thread(resend_lib.Emails.send, params)
            resend_id = (
                send_result.get("id")
                if isinstance(send_result, dict)
                else getattr(send_result, "id", None)
            )
            _cb_record_success()
            await _log_email(
                db,
                record.email_type,
                record.recipient_email,
                True,
                entity_type=record.entity_type,
                entity_code=record.entity_code,
                resend_id=resend_id,
                error_message="retry_success",
            )
            await db.delete(record)
            logger.info(
                "[email-pending] retry succeeded for %s to %s",
                record.email_type,
                record.recipient_email,
            )
        except Exception as exc:
            _cb_record_failure()
            record.attempt_count += 1
            record.last_attempted_at = datetime.now(timezone.utc)
            await _log_email(
                db,
                record.email_type,
                record.recipient_email,
                False,
                entity_type=record.entity_type,
                entity_code=record.entity_code,
                error_message=f"retry_attempt_{record.attempt_count}: {exc}",
            )
            logger.warning(
                "[email-pending] retry attempt %d failed for %s to %s: %s",
                record.attempt_count,
                record.email_type,
                record.recipient_email,
                exc,
            )

    try:
        await db.flush()
    except Exception as exc:
        logger.error("[email-pending] failed to persist flush changes: %s", exc)


async def _log_email(
    db: AsyncSession,
    email_type: str,
    recipient_email: str,
    success: bool,
    entity_type: str | None = None,
    entity_code: str | None = None,
    resend_id: str | None = None,
    error_message: str | None = None,
) -> None:
    """Persist an email send attempt to the email_log table."""
    try:
        from app.models.email_log import EmailLog

        log = EmailLog(
            email_type=email_type,
            recipient_email=recipient_email,
            entity_type=entity_type,
            entity_code=entity_code,
            success=success,
            resend_id=resend_id,
            error_message=error_message,
        )
        db.add(log)
        await db.flush()
    except Exception as exc:
        logger.error("Failed to write email log to DB: %s", exc)


def _build_list_unsubscribe_header(frontend_url: str) -> str:
    """Return a List-Unsubscribe header value with mailto and URL forms."""
    unsubscribe_url = f"{frontend_url}/unsubscribe"
    from_domain = settings.resend_from_email.split("@")[-1] if "@" in settings.resend_from_email else "noreply"
    return f"<mailto:unsubscribe@{from_domain}?subject=unsubscribe>, <{unsubscribe_url}>"


async def _send(
    db: AsyncSession,
    email_type: str,
    recipient_email: str,
    subject: str,
    html_body: str,
    text_body: str,
    entity_type: str | None = None,
    entity_code: str | None = None,
) -> bool:
    """Send an email via Resend with retry/backoff and circuit-breaker protection.

    Before each send, any emails that previously failed (within the last 24 hours)
    are retried once. If this send ultimately fails after all retries it is saved
    to email_pending so the next send will pick it up.
    """
    if not settings.resend_api_key:
        logger.info(
            "DEV MODE - %s email (would send to %s): %s",
            email_type,
            recipient_email,
            subject,
        )
        await _log_email(
            db,
            email_type,
            recipient_email,
            True,
            entity_type=entity_type,
            entity_code=entity_code,
            error_message="dev_mode_no_api_key",
        )
        return True

    await _flush_pending_emails(db)

    if _cb_is_open():
        logger.warning(
            "[email-circuit] OPEN — skipping %s email to %s",
            email_type,
            recipient_email,
        )
        await _log_email(
            db,
            email_type,
            recipient_email,
            False,
            entity_type=entity_type,
            entity_code=entity_code,
            error_message="circuit_open",
        )
        await _save_pending_email(db, email_type, recipient_email, subject, html_body, text_body, entity_type, entity_code)
        return False

    import resend

    resend.api_key = settings.resend_api_key
    params: dict[str, Any] = {
        "from": settings.resend_from_email,
        "to": [recipient_email],
        "subject": subject,
        "html": html_body,
        "text": text_body,
        "headers": {
            "List-Unsubscribe": _build_list_unsubscribe_header(settings.frontend_url),
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
    }

    resend_id = None
    error_message = None
    success = False
    last_exc: Exception | None = None

    # Initial attempt + up to len(_RETRY_DELAYS) retries
    for attempt, delay in enumerate([0] + _RETRY_DELAYS):
        if delay:
            logger.info(
                "[email] retry %d/%d for %s to %s — waiting %ds",
                attempt,
                len(_RETRY_DELAYS),
                email_type,
                recipient_email,
                delay,
            )
            await asyncio.sleep(delay)
        try:
            result = await asyncio.to_thread(resend.Emails.send, params)
            resend_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
            success = True
            _cb_record_success()
            break
        except Exception as exc:
            last_exc = exc
            logger.warning(
                "Attempt %d failed for %s email to %s: %s",
                attempt + 1,
                email_type,
                recipient_email,
                exc,
            )

    if not success:
        error_message = str(last_exc)
        logger.error("All attempts failed for %s email to %s: %s", email_type, recipient_email, last_exc)
        _cb_record_failure()
        await _save_pending_email(db, email_type, recipient_email, subject, html_body, text_body, entity_type, entity_code)

    await _log_email(
        db,
        email_type,
        recipient_email,
        success,
        entity_type=entity_type,
        entity_code=entity_code,
        resend_id=resend_id,
        error_message=error_message,
    )
    return success


# ---------------------------------------------------------------------------
# Public send functions
# ---------------------------------------------------------------------------


async def send_verification_email(
    db: AsyncSession,
    email: str,
    entity_type: str,
    entity_code: str,
    verification_code: str,
    edit_token: str,
    frontend_url: str,
) -> bool:
    verify_url = f"{frontend_url}/verify?code={verification_code}"
    manage_url = f"{frontend_url}/manage/{entity_type}/{entity_code}?token={edit_token}"
    subject, html_body, text_body = verification_template.build(entity_type, verify_url, manage_url)
    return await _send(
        db,
        "verification",
        email,
        subject,
        html_body,
        text_body,
        entity_type=entity_type,
        entity_code=entity_code,
    )


async def send_login_email(
    db: AsyncSession,
    email: str,
    login_token: str,
    frontend_url: str,
) -> bool:
    login_url = f"{frontend_url}/login/callback?token={login_token}"
    subject, html_body, text_body = login_template.build(login_url)
    return await _send(db, "login", email, subject, html_body, text_body)


async def send_management_links_email(
    db: AsyncSession,
    email: str,
    entities: list[dict],
) -> bool:
    subject, html_body, text_body = management_links_template.build(entities)
    return await _send(db, "management_links", email, subject, html_body, text_body)


async def send_recruiter_verification_email(
    db: AsyncSession,
    email: str,
    recruiter_code: str,
    verification_code: str,
    frontend_url: str,
) -> bool:
    verify_url = f"{frontend_url}/verify?code={verification_code}"
    subject, html_body, text_body = recruiter_verification_template.build(verify_url)
    return await _send(
        db,
        "recruiter_verification",
        email,
        subject,
        html_body,
        text_body,
        entity_type="recruiter",
        entity_code=recruiter_code,
    )


async def send_recruiter_approved_email(
    db: AsyncSession,
    email: str,
    recruiter_code: str,
    frontend_url: str,
) -> bool:
    subject, html_body, text_body = recruiter_status_template.build_approved(frontend_url)
    return await _send(
        db,
        "recruiter_approved",
        email,
        subject,
        html_body,
        text_body,
        entity_type="recruiter",
        entity_code=recruiter_code,
    )


async def send_recruiter_rejected_email(
    db: AsyncSession,
    email: str,
    recruiter_code: str,
    frontend_url: str,
    reason_name: str = "",
) -> bool:
    subject, html_body, text_body = recruiter_status_template.build_rejected(frontend_url, reason_name)
    return await _send(
        db,
        "recruiter_rejected",
        email,
        subject,
        html_body,
        text_body,
        entity_type="recruiter",
        entity_code=recruiter_code,
    )


async def send_admin_login_email(
    db: AsyncSession,
    email: str,
    login_token: str,
    frontend_url: str,
) -> bool:
    login_url = f"{frontend_url}/admin/verify?code={login_token}"
    subject, html_body, text_body = admin_login_template.build(login_url)
    return await _send(db, "admin_login", email, subject, html_body, text_body)


async def send_expiry_warning_email(
    db: AsyncSession,
    email: str,
    entity_type: str,
    entity_code: str,
    entity_title: str,
    manage_url: str,
    days_remaining: int,
) -> bool:
    subject, html_body, text_body = expiry_warning_template.build(entity_type, entity_title, manage_url, days_remaining)
    return await _send(
        db,
        "expiry_warning",
        email,
        subject,
        html_body,
        text_body,
        entity_type=entity_type,
        entity_code=entity_code,
    )


async def send_admin_report_notification(
    db: AsyncSession,
    entity_type: str,
    entity_code: str,
    entity_title: str,
    report_count: int,
    frontend_url: str,
    admin_email: str,
) -> bool:
    if not admin_email:
        logger.info("No admin_notification_email configured — skipping report notification")
        return True
    subject, html_body, text_body = admin_report_template.build_admin_report_notification(
        entity_type=entity_type,
        entity_code=entity_code,
        entity_title=entity_title,
        report_count=report_count,
        frontend_url=frontend_url,
    )
    return await _send(
        db,
        "admin_report_notification",
        admin_email,
        subject,
        html_body,
        text_body,
        entity_type=entity_type,
        entity_code=entity_code,
    )


async def send_admin_new_recruiter_notification(
    db: AsyncSession,
    recruiter_name: str,
    recruiter_email: str,
    recruiter_linkedin: str,
    recruiter_code: str,
    frontend_url: str,
    admin_email: str,
) -> bool:
    if not admin_email:
        logger.info("No admin_notification_email configured — skipping admin notification")
        return True
    subject, html_body, text_body = recruiter_status_template.build_admin_notification(
        recruiter_name=recruiter_name,
        recruiter_email=recruiter_email,
        recruiter_linkedin=recruiter_linkedin,
        recruiter_code=recruiter_code,
        frontend_url=frontend_url,
    )
    return await _send(
        db,
        "admin_new_recruiter",
        admin_email,
        subject,
        html_body,
        text_body,
        entity_type="recruiter",
        entity_code=recruiter_code,
    )
