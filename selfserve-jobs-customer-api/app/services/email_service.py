import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ---------------------------------------------------------------------------
# Shared design tokens (Sage & Stone palette)
# ---------------------------------------------------------------------------
_BG = "#fcf9f5"
_SURFACE = "#ffffff"
_PRIMARY = "#384B3B"
_PRIMARY_BTN = "#506E54"
_SECONDARY = "#8C4E32"
_TEXT_MAIN = "#1c1c1a"
_TEXT_MUTED = "#434843"
_DIVIDER = "#e8e4df"
_ACCENT = "#8BA888"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _get_resend_client():
    try:
        import resend

        resend.api_key = settings.resend_api_key
        return resend
    except ImportError:
        logger.warning("resend package not available")
        return None


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


def _base_template(header_text: str, body_html: str, footer_note: str) -> str:
    """Wrap content in the shared Sage & Stone email shell."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:{_BG};">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:{_BG};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%;">

          <!-- Wordmark header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;
                           font-style:italic;color:{_PRIMARY};letter-spacing:-0.5px;">
                hirebridge
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:{_SURFACE};border-radius:16px;padding:40px;
                       box-shadow:0 1px 3px rgba(28,28,26,0.05),0 8px 20px rgba(28,28,26,0.04);">

              <!-- Eyebrow -->
              <p style="margin:0 0 12px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                        font-size:11px;font-weight:600;letter-spacing:0.12em;
                        text-transform:uppercase;color:{_ACCENT};">
                {header_text}
              </p>

              {body_html}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 6px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                        font-size:11px;letter-spacing:0.1em;text-transform:uppercase;
                        color:{_TEXT_MUTED};">
                hirebridge · hirebridgeuae.com
              </p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                        font-size:11px;color:#aaa;">
                {footer_note}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _cta_button(url: str, label: str) -> str:
    return (
        f'<a href="{url}" '
        f'style="display:inline-block;background-color:{_PRIMARY_BTN};color:#ffffff;'
        f"padding:14px 28px;border-radius:100px;text-decoration:none;"
        f"font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;"
        f'font-weight:600;letter-spacing:0.04em;">'
        f"{label}</a>"
    )


def _fallback_link(url: str) -> str:
    return (
        f"<p style=\"margin:16px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;"
        f'font-size:12px;color:{_TEXT_MUTED};">'
        f"Or copy this link: "
        f'<a href="{url}" style="color:{_SECONDARY};word-break:break-all;">{url}</a></p>'
    )


def _divider() -> str:
    return f'<div style="height:1px;background-color:{_DIVIDER};margin:28px 0;"></div>'


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
    """Send a verification email with a verification link and management link."""
    verify_url = f"{frontend_url}/verify?code={verification_code}"
    manage_url = f"{frontend_url}/manage/{entity_type}/{entity_code}?token={edit_token}"

    entity_label = "job listing" if entity_type == "job" else "profile"
    subject = f"Verify your {entity_label} on hirebridge"

    body_html = f"""
      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;
                 font-size:30px;font-weight:normal;color:{_PRIMARY};line-height:1.2;">
        Verify your <em>{entity_label}</em>
      </h1>
      <p style="margin:0 0 28px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:15px;color:{_TEXT_MUTED};line-height:1.6;">
        Click the button below to confirm your email address and activate your
        {entity_label} on hirebridge. The link expires in&nbsp;<strong>24&nbsp;hours</strong>.
      </p>
      <div style="margin:0 0 28px 0;">
        {_cta_button(verify_url, "Verify Email Address")}
      </div>
      {_fallback_link(verify_url)}
      {_divider()}
      <p style="margin:0 0 6px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:14px;font-weight:600;color:{_TEXT_MAIN};">
        Your management link
      </p>
      <p style="margin:0 0 10px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:13px;color:{_TEXT_MUTED};line-height:1.5;">
        Save this — you'll need it to edit or remove your {entity_label} later.
        It will also be included in your verification confirmation email.
      </p>
      <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:12px;word-break:break-all;">
        <a href="{manage_url}" style="color:{_SECONDARY};text-decoration:none;">{manage_url}</a>
      </p>
    """

    html_body = _base_template(
        header_text="Action required",
        body_html=body_html,
        footer_note="If you did not create this listing, you can safely ignore this email.",
    )

    text_body = f"""Verify your {entity_label} on hirebridge

Please verify your email address to activate your {entity_label}:
{verify_url}

This link expires in 24 hours.

---
Your management link (save this to edit or remove your listing):
{manage_url}

If you did not create this listing, you can safely ignore this email.
"""

    if not settings.resend_api_key:
        logger.info(
            "DEV MODE - Verification email (would send to %s):\nSubject: %s\nVerify URL: %s\nManage URL: %s",
            email,
            subject,
            verify_url,
            manage_url,
        )
        await _log_email(db, "verification", email, True, entity_type, entity_code, error_message="dev_mode_no_api_key")
        return True

    resend_id = None
    error_message = None
    success = False

    try:
        import resend

        resend.api_key = settings.resend_api_key
        params: dict[str, Any] = {
            "from": settings.resend_from_email,
            "to": [email],
            "subject": subject,
            "html": html_body,
            "text": text_body,
        }
        result = resend.Emails.send(params)
        resend_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        success = True
    except Exception as exc:
        error_message = str(exc)
        logger.error("Failed to send verification email to %s: %s", email, exc)

    await _log_email(
        db, "verification", email, success, entity_type, entity_code, resend_id=resend_id, error_message=error_message
    )
    return success


async def send_login_email(
    db: AsyncSession,
    email: str,
    login_token: str,
    frontend_url: str,
) -> bool:
    """Send a magic login link email."""
    login_url = f"{frontend_url}/login/callback?token={login_token}"
    subject = "Sign in to hirebridge"

    body_html = f"""
      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;
                 font-size:30px;font-weight:normal;color:{_PRIMARY};line-height:1.2;">
        Sign in to <em>hirebridge</em>
      </h1>
      <p style="margin:0 0 28px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:15px;color:{_TEXT_MUTED};line-height:1.6;">
        Click the button below to sign in. This link expires in&nbsp;<strong>15&nbsp;minutes</strong>
        and can only be used once.
      </p>
      <div style="margin:0 0 28px 0;">
        {_cta_button(login_url, "Sign in to hirebridge")}
      </div>
      {_fallback_link(login_url)}
    """

    html_body = _base_template(
        header_text="Sign-in link",
        body_html=body_html,
        footer_note="If you did not request this, you can safely ignore this email.",
    )

    text_body = f"""Sign in to hirebridge

Click the link below to sign in (expires in 15 minutes, single use):
{login_url}

If you did not request this, you can safely ignore this email.
"""

    if not settings.resend_api_key:
        logger.info(
            "DEV MODE - Login email (would send to %s):\nSubject: %s\nLogin URL: %s",
            email,
            subject,
            login_url,
        )
        await _log_email(db, "login", email, True, error_message="dev_mode_no_api_key")
        return True

    resend_id = None
    error_message = None
    success = False

    try:
        import resend

        resend.api_key = settings.resend_api_key
        params: dict[str, Any] = {
            "from": settings.resend_from_email,
            "to": [email],
            "subject": subject,
            "html": html_body,
            "text": text_body,
        }
        result = resend.Emails.send(params)
        resend_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        success = True
    except Exception as exc:
        error_message = str(exc)
        logger.error("Failed to send login email to %s: %s", email, exc)

    await _log_email(db, "login", email, success, resend_id=resend_id, error_message=error_message)
    return success


async def send_management_links_email(
    db: AsyncSession,
    email: str,
    entities: list[dict],
) -> bool:
    """Send an email with all management links for the given email address."""
    subject = "Your hirebridge listings"

    items_html = ""
    items_text = ""
    for entity in entities:
        label = "Job listing" if entity["entity_type"] == "job" else "Profile"
        title = entity.get("title", entity["entity_code"])
        manage_url = entity["manage_url"]
        status = entity.get("status", "")

        status_color = _ACCENT if status == "active" else _TEXT_MUTED
        items_html += f"""
        <div style="background-color:{_BG};border-radius:10px;padding:16px 20px;margin:10px 0;">
          <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                    font-size:11px;font-weight:600;letter-spacing:0.1em;
                    text-transform:uppercase;color:{_TEXT_MUTED};">
            {label}
          </p>
          <p style="margin:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;
                    font-size:17px;color:{_TEXT_MAIN};">
            {title}
          </p>
          <p style="margin:0 0 10px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                    font-size:12px;color:{status_color};text-transform:uppercase;
                    letter-spacing:0.08em;">
            {status}
          </p>
          <a href="{manage_url}"
             style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;
                    color:{_SECONDARY};text-decoration:none;font-weight:600;">
            Manage this listing →
          </a>
        </div>
        """
        items_text += f"\n{label}: {title}\nStatus: {status}\nManage: {manage_url}\n"

    body_html = f"""
      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;
                 font-size:30px;font-weight:normal;color:{_PRIMARY};line-height:1.2;">
        Your <em>listings</em>
      </h1>
      <p style="margin:0 0 24px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:15px;color:{_TEXT_MUTED};line-height:1.6;">
        Here are all the active and pending listings associated with your email address.
        Use the links below to manage each one.
      </p>
      {items_html}
    """

    html_body = _base_template(
        header_text="Management links",
        body_html=body_html,
        footer_note="If you did not request this email, you can safely ignore it.",
    )

    text_body = f"""Your hirebridge listings

Here are all the active and pending listings associated with your email address:
{items_text}

If you did not request this email, you can safely ignore it.
"""

    if not settings.resend_api_key:
        logger.info(
            "DEV MODE - Management links email (would send to %s):\nSubject: %s\nEntities: %s",
            email,
            subject,
            entities,
        )
        await _log_email(db, "management_links", email, True, error_message="dev_mode_no_api_key")
        return True

    resend_id = None
    error_message = None
    success = False

    try:
        import resend

        resend.api_key = settings.resend_api_key
        params: dict[str, Any] = {
            "from": settings.resend_from_email,
            "to": [email],
            "subject": subject,
            "html": html_body,
            "text": text_body,
        }
        result = resend.Emails.send(params)
        resend_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        success = True
    except Exception as exc:
        error_message = str(exc)
        logger.error("Failed to send management links email to %s: %s", email, exc)

    await _log_email(db, "management_links", email, success, resend_id=resend_id, error_message=error_message)
    return success
