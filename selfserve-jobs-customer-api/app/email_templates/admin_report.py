from app.email_templates.base import PRIMARY, SECONDARY, TEXT_MUTED, cta_button, shell


def build_admin_report_notification(
    entity_type: str,
    entity_code: str,
    entity_title: str,
    report_count: int,
    frontend_url: str,
) -> tuple[str, str, str]:
    """Return (subject, html_body, text_body) for an admin report threshold notification."""
    subject = f"Content flagged for review: {entity_title}"
    admin_url = f"{frontend_url}/admin/reports"
    entity_label = "Job" if entity_type == "job" else "Profile"

    body_html = f"""
      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;
                 font-size:24px;font-weight:normal;color:{PRIMARY};line-height:1.2;">
        Content flagged for review
      </h1>
      <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:15px;line-height:1.6;color:{TEXT_MUTED};">
        A {entity_label.lower()} has reached the report threshold and has been automatically
        moved to <strong>under review</strong>.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
        <tr>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:{TEXT_MUTED};width:120px;">Type</td>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:{PRIMARY};">{entity_label}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:{TEXT_MUTED};">Title</td>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:{PRIMARY};">{entity_title}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:{TEXT_MUTED};">Code</td>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:{SECONDARY};font-family:monospace;">{entity_code}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:{TEXT_MUTED};">Reports</td>
          <td style="padding:8px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                     font-size:13px;color:{PRIMARY};">{report_count}</td>
        </tr>
      </table>
      <p style="margin:0 0 24px 0;">
        {cta_button(admin_url, "Review in Admin Portal")}
      </p>
    """

    text_body = (
        f"Content flagged for review\n\n"
        f"A {entity_label.lower()} has reached the report threshold ({report_count} reports) "
        f"and has been automatically moved to under review.\n\n"
        f"Type: {entity_label}\n"
        f"Title: {entity_title}\n"
        f"Code: {entity_code}\n\n"
        f"Review in admin portal: {admin_url}"
    )

    return subject, shell("Admin Alert", body_html, "This is an automated alert from hirebridge."), text_body
