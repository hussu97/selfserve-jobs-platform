from app.email_templates.base import ACCENT, BG, PRIMARY, SECONDARY, TEXT_MAIN, TEXT_MUTED, shell


def build(entities: list[dict]) -> tuple[str, str, str]:
    """Return (subject, html_body, text_body) for a management links email."""
    subject = "Your hirebridge listings"

    items_html = ""
    items_text = ""
    for entity in entities:
        label = "Job listing" if entity["entity_type"] == "job" else "Profile"
        title = entity.get("title", entity["entity_code"])
        manage_url = entity["manage_url"]
        status = entity.get("status", "")
        status_color = ACCENT if status == "active" else TEXT_MUTED

        items_html += f"""
        <div style="background-color:{BG};border-radius:10px;padding:16px 20px;margin:10px 0;">
          <p style="margin:0 0 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                    font-size:11px;font-weight:600;letter-spacing:0.1em;
                    text-transform:uppercase;color:{TEXT_MUTED};">
            {label}
          </p>
          <p style="margin:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;
                    font-size:17px;color:{TEXT_MAIN};">
            {title}
          </p>
          <p style="margin:0 0 10px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                    font-size:12px;color:{status_color};text-transform:uppercase;
                    letter-spacing:0.08em;">
            {status}
          </p>
          <a href="{manage_url}"
             style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;
                    color:{SECONDARY};text-decoration:none;font-weight:600;">
            Manage this listing →
          </a>
        </div>
        """
        items_text += f"\n{label}: {title}\nStatus: {status}\nManage: {manage_url}\n"

    body_html = f"""
      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;
                 font-size:30px;font-weight:normal;color:{PRIMARY};line-height:1.2;">
        Your <em>listings</em>
      </h1>
      <p style="margin:0 0 24px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:15px;color:{TEXT_MUTED};line-height:1.6;">
        Here are all the active and pending listings associated with your email address.
        Use the links below to manage each one.
      </p>
      {items_html}
    """

    html_body = shell(
        header_text="Management links",
        body_html=body_html,
        footer_note="If you did not request this email, you can safely ignore it.",
    )

    text_body = f"""Your hirebridge listings

Here are all the active and pending listings associated with your email address:
{items_text}
If you did not request this email, you can safely ignore it.
"""

    return subject, html_body, text_body
