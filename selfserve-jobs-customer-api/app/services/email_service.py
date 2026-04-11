import asyncio
import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.email_templates import admin_login as admin_login_template
from app.email_templates import expiry_warning as expiry_warning_template
from app.email_templates import login as login_template
from app.email_templates import management_links as management_links_template
from app.email_templates import recruiter_status as recruiter_status_template
from app.email_templates import recruiter_verification as recruiter_verification_template
from app.email_templates import verification as verification_template

logger = logging.getLogger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


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
    """Send a single email via Resend and write a log row regardless of outcome."""
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

    resend_id = None
    error_message = None
    success = False

    try:
        import resend

        resend.api_key = settings.resend_api_key
        params: dict[str, Any] = {
            "from": settings.resend_from_email,
            "to": [recipient_email],
            "subject": subject,
            "html": html_body,
            "text": text_body,
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        resend_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        success = True
    except Exception as exc:
        error_message = str(exc)
        logger.error("Failed to send %s email to %s: %s", email_type, recipient_email, exc)

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
