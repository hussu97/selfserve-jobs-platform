from app.email_templates.base import (
    PRIMARY,
    SECONDARY,
    TEXT_MUTED,
    cta_button,
    divider,
    shell,
)


def build_approved(frontend_url: str) -> tuple[str, str, str]:
    """Return (subject, html_body, text_body) for a recruiter approval email."""
    subject = "Your recruiter account has been approved — hirebridge"
    post_job_url = f"{frontend_url}/jobs/new"

    body_html = f"""
      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;
                 font-size:30px;font-weight:normal;color:{PRIMARY};line-height:1.2;">
        Welcome to <em>hirebridge</em>
      </h1>
      <p style="margin:0 0 20px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:15px;color:{TEXT_MUTED};line-height:1.6;">
        Your recruiter account has been approved. You can now post jobs and access
        candidate contact information on hirebridge.
      </p>
      <div style="margin:0 0 28px 0;">
        {cta_button(post_job_url, "Post Your First Job")}
      </div>
      {divider()}
      <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:13px;color:{TEXT_MUTED};line-height:1.6;">
        As a verified recruiter you can post jobs, view candidate email and phone
        numbers, and download resumes. Please handle all candidate data responsibly
        and in accordance with our
        <a href="{frontend_url}/privacy" style="color:{SECONDARY};">privacy policy</a>.
      </p>
    """

    html_body = shell(
        header_text="Account approved",
        body_html=body_html,
        footer_note="This is an automated notification from hirebridge.",
    )

    text_body = f"""Your recruiter account has been approved — hirebridge

Welcome to hirebridge!

Your recruiter account has been approved. You can now post jobs and access candidate contact information.

Post your first job: {post_job_url}

As a verified recruiter you can post jobs, view candidate email and phone numbers,
and download resumes. Handle all candidate data responsibly per our privacy policy.
"""

    return subject, html_body, text_body


def build_rejected(frontend_url: str, reason_name: str = "") -> tuple[str, str, str]:
    """Return (subject, html_body, text_body) for a recruiter rejection email."""
    subject = "Update on your hirebridge recruiter application"
    contact_url = f"{frontend_url}/contact"

    reason_block = ""
    reason_text = ""
    if reason_name:
        reason_block = f"""
      <p style="margin:0 0 20px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:14px;color:{TEXT_MUTED};line-height:1.6;">
        <strong>Reason:</strong> {reason_name}
      </p>"""
        reason_text = f"\nReason: {reason_name}\n"

    body_html = f"""
      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;
                 font-size:30px;font-weight:normal;color:{PRIMARY};line-height:1.2;">
        Application <em>update</em>
      </h1>
      <p style="margin:0 0 20px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:15px;color:{TEXT_MUTED};line-height:1.6;">
        Thank you for your interest in hirebridge. After reviewing your application,
        we're unable to approve your recruiter account at this time.
      </p>
      {reason_block}
      <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:14px;color:{TEXT_MUTED};line-height:1.6;">
        If you believe this is an error or would like more information, please
        <a href="{contact_url}" style="color:{SECONDARY};">contact us</a>.
      </p>
    """

    html_body = shell(
        header_text="Application update",
        body_html=body_html,
        footer_note="This is an automated notification from hirebridge.",
    )

    text_body = f"""Update on your hirebridge recruiter application

Thank you for your interest in hirebridge.

After reviewing your application, we're unable to approve your recruiter account at this time.
{reason_text}
If you believe this is an error or would like more information, please contact us: {contact_url}
"""

    return subject, html_body, text_body


def build_admin_notification(
    recruiter_name: str,
    recruiter_email: str,
    recruiter_linkedin: str,
    recruiter_code: str,
    frontend_url: str,
) -> tuple[str, str, str]:
    """Return (subject, html_body, text_body) for admin new recruiter notification."""
    subject = f"New recruiter pending approval: {recruiter_name}"

    body_html = f"""
      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;
                 font-size:24px;font-weight:normal;color:#1c1c1a;line-height:1.2;">
        New recruiter pending approval
      </h1>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px 0;">
        <tr>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:#434843;width:120px;">Name</td>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:#1c1c1a;font-weight:600;">{recruiter_name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:#434843;">Email</td>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:#1c1c1a;">{recruiter_email}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:#434843;">LinkedIn</td>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:#1c1c1a;">
            <a href="{recruiter_linkedin}" style="color:#8C4E32;">{recruiter_linkedin}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:#434843;">Code</td>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:#1c1c1a;font-family:monospace;">{recruiter_code}</td>
        </tr>
      </table>
      <p style="margin:0 0 8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:13px;color:#434843;">
        Review this recruiter in the
        <a href="{frontend_url}/admin/dashboard" style="color:#384B3B;">admin portal</a>.
      </p>
    """

    html_body = shell(
        header_text="Admin action required",
        body_html=body_html,
        footer_note="This is an internal notification from hirebridge.",
    )

    text_body = f"""New recruiter pending approval: {recruiter_name}

Name: {recruiter_name}
Email: {recruiter_email}
LinkedIn: {recruiter_linkedin}
Code: {recruiter_code}

Review in the admin portal: {frontend_url}/admin/dashboard
"""

    return subject, html_body, text_body
