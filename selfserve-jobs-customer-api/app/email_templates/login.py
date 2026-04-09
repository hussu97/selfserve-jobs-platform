from app.email_templates.base import PRIMARY, TEXT_MUTED, cta_button, fallback_link, shell


def build(login_url: str) -> tuple[str, str, str]:
    """Return (subject, html_body, text_body) for a magic login email."""
    subject = "Sign in to hirebridge"

    body_html = f"""
      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;
                 font-size:30px;font-weight:normal;color:{PRIMARY};line-height:1.2;">
        Sign in to <em>hirebridge</em>
      </h1>
      <p style="margin:0 0 28px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:15px;color:{TEXT_MUTED};line-height:1.6;">
        Click the button below to sign in. This link expires in&nbsp;<strong>15&nbsp;minutes</strong>
        and can only be used once.
      </p>
      <div style="margin:0 0 28px 0;">
        {cta_button(login_url, "Sign in to hirebridge")}
      </div>
      {fallback_link(login_url)}
    """

    html_body = shell(
        header_text="Sign-in link",
        body_html=body_html,
        footer_note="If you did not request this, you can safely ignore this email.",
    )

    text_body = f"""Sign in to hirebridge

Click the link below to sign in (expires in 15 minutes, single use):
{login_url}

If you did not request this, you can safely ignore this email.
"""

    return subject, html_body, text_body
