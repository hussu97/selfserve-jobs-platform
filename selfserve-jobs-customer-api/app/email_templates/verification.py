from app.email_templates.base import (
    PRIMARY,
    SECONDARY,
    TEXT_MAIN,
    TEXT_MUTED,
    cta_button,
    divider,
    fallback_link,
    shell,
)


def build(
    entity_type: str,
    verify_url: str,
    manage_url: str,
) -> tuple[str, str, str]:
    """Return (subject, html_body, text_body) for a verification email."""
    entity_label = "job listing" if entity_type == "job" else "profile"
    subject = f"Verify your {entity_label} on hirebridge"

    body_html = f"""
      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;
                 font-size:30px;font-weight:normal;color:{PRIMARY};line-height:1.2;">
        Verify your <em>{entity_label}</em>
      </h1>
      <p style="margin:0 0 28px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:15px;color:{TEXT_MUTED};line-height:1.6;">
        Click the button below to confirm your email address and activate your
        {entity_label} on hirebridge. The link expires in&nbsp;<strong>24&nbsp;hours</strong>.
      </p>
      <div style="margin:0 0 28px 0;">
        {cta_button(verify_url, "Verify Email Address")}
      </div>
      {fallback_link(verify_url)}
      {divider()}
      <p style="margin:0 0 6px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:14px;font-weight:600;color:{TEXT_MAIN};">
        Your management link
      </p>
      <p style="margin:0 0 10px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:13px;color:{TEXT_MUTED};line-height:1.5;">
        Save this — you'll need it to edit or remove your {entity_label} later.
      </p>
      <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:12px;word-break:break-all;">
        <a href="{manage_url}" style="color:{SECONDARY};text-decoration:none;">{manage_url}</a>
      </p>
    """

    html_body = shell(
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

    return subject, html_body, text_body
