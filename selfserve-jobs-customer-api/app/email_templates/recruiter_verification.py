from app.email_templates.base import (
    PRIMARY,
    TEXT_MUTED,
    cta_button,
    fallback_link,
    shell,
)


def build(verify_url: str) -> tuple[str, str, str]:
    """Return (subject, html_body, text_body) for a recruiter email verification."""
    subject = "Verify your recruiter account on hirebridge"

    body_html = f"""
      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;
                 font-size:30px;font-weight:normal;color:{PRIMARY};line-height:1.2;">
        Verify your <em>recruiter account</em>
      </h1>
      <p style="margin:0 0 28px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:15px;color:{TEXT_MUTED};line-height:1.6;">
        Click the button below to verify your email address. Once verified, your account
        will enter our review queue and we'll notify you when it's approved.
        The link expires in&nbsp;<strong>24&nbsp;hours</strong>.
      </p>
      <div style="margin:0 0 28px 0;">
        {cta_button(verify_url, "Verify Email Address")}
      </div>
      {fallback_link(verify_url)}
    """

    html_body = shell(
        header_text="Action required",
        body_html=body_html,
        footer_note="If you did not create a recruiter account, you can safely ignore this email.",
    )

    text_body = f"""Verify your recruiter account on hirebridge

Please verify your email address to complete your recruiter registration:
{verify_url}

This link expires in 24 hours.

Once verified, your account will enter our review queue. We'll email you when it's approved.

If you did not create a recruiter account, you can safely ignore this email.
"""

    return subject, html_body, text_body
