import logging
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_resend_client():
    try:
        import resend
        resend.api_key = settings.resend_api_key
        return resend
    except ImportError:
        logger.warning("resend package not available")
        return None


async def send_verification_email(
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
    subject = f"Verify your {entity_label} on jobs4u"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #5C4033;">Verify your {entity_label}</h1>
      <p>Thank you for posting on jobs4u! Please verify your email address to activate your {entity_label}.</p>

      <div style="margin: 30px 0;">
        <a href="{verify_url}"
           style="background-color: #8B6914; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email Address
        </a>
      </div>

      <p>Or copy this link: <a href="{verify_url}">{verify_url}</a></p>
      <p><strong>This link expires in 24 hours.</strong></p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

      <p>To manage your {entity_label} later (edit or remove it), use this link:</p>
      <p><a href="{manage_url}">{manage_url}</a></p>
      <p><em>Keep this link safe — it's your access to edit your listing.</em></p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #888; font-size: 12px;">If you did not create this listing, you can safely ignore this email.</p>
    </div>
    """

    text_body = f"""
    Verify your {entity_label} on jobs4u

    Please verify your email: {verify_url}

    This link expires in 24 hours.

    To manage your {entity_label} later, use: {manage_url}

    If you did not create this listing, you can safely ignore this email.
    """

    if not settings.resend_api_key:
        logger.info(
            "DEV MODE - Verification email (would send to %s):\n"
            "Subject: %s\n"
            "Verify URL: %s\n"
            "Manage URL: %s",
            email, subject, verify_url, manage_url,
        )
        return True

    try:
        import resend
        resend.api_key = settings.resend_api_key
        params: dict[str, Any] = {
            "from": "jobs4u <noreply@jobs4u.io>",
            "to": [email],
            "subject": subject,
            "html": html_body,
            "text": text_body,
        }
        resend.Emails.send(params)
        return True
    except Exception as exc:
        logger.error("Failed to send verification email to %s: %s", email, exc)
        return False


async def send_management_links_email(
    email: str,
    entities: list[dict],
) -> bool:
    """Send an email with all management links for the given email address."""
    subject = "Your jobs4u listings management links"

    items_html = ""
    items_text = ""
    for entity in entities:
        label = "Job listing" if entity["entity_type"] == "job" else "Profile"
        title = entity.get("title", entity["entity_code"])
        manage_url = entity["manage_url"]
        status = entity.get("status", "")
        items_html += f"""
        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px;">
          <strong>{label}:</strong> {title}<br>
          <span style="color: #888;">Status: {status}</span><br>
          <a href="{manage_url}">Manage this listing</a>
        </div>
        """
        items_text += f"\n{label}: {title}\nStatus: {status}\nManage: {manage_url}\n"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #5C4033;">Your jobs4u listings</h1>
      <p>Here are all the active and pending listings associated with your email address:</p>
      {items_html}
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #888; font-size: 12px;">If you did not request this email, you can safely ignore it.</p>
    </div>
    """

    text_body = f"""
    Your jobs4u listings

    Here are all the active and pending listings associated with your email address:
    {items_text}

    If you did not request this email, you can safely ignore it.
    """

    if not settings.resend_api_key:
        logger.info(
            "DEV MODE - Management links email (would send to %s):\nSubject: %s\nEntities: %s",
            email, subject, entities,
        )
        return True

    try:
        import resend
        resend.api_key = settings.resend_api_key
        params: dict[str, Any] = {
            "from": "jobs4u <noreply@jobs4u.io>",
            "to": [email],
            "subject": subject,
            "html": html_body,
            "text": text_body,
        }
        resend.Emails.send(params)
        return True
    except Exception as exc:
        logger.error("Failed to send management links email to %s: %s", email, exc)
        return False
