from app.email_templates.base import DIVIDER, PRIMARY, SECONDARY, TEXT_MAIN, TEXT_MUTED, cta_button, shell


def build(entity_type: str, entity_title: str, manage_url: str, days_remaining: int) -> tuple[str, str, str]:
    entity_label = "job listing" if entity_type == "job" else "profile"
    plural = "s" if days_remaining != 1 else ""
    subject = f"Your {entity_label} expires in {days_remaining} day{plural}"

    body_html = f"""
      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;
                 font-size:24px;font-style:italic;font-weight:400;color:{PRIMARY};">
        Your listing expires soon
      </h1>
      <p style="margin:0 0 20px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:15px;line-height:1.6;color:{TEXT_MAIN};">
        Your <strong>{entity_label}</strong> — <em>{entity_title}</em> — will expire
        in <strong>{days_remaining} day{plural}</strong>.
        After it expires, it will no longer appear in search results.
      </p>
      <p style="margin:0 0 28px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:15px;line-height:1.6;color:{TEXT_MUTED};">
        Visit your management page to renew your listing and extend it for another 60 days.
      </p>
      {cta_button(manage_url, "Manage Listing")}
      <div style="height:1px;background-color:{DIVIDER};margin:28px 0;"></div>
      <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;
                font-size:12px;color:{TEXT_MUTED};">
        Or copy this link:
        <a href="{manage_url}" style="color:{SECONDARY};word-break:break-all;">{manage_url}</a>
      </p>
    """

    text_body = (
        f"Your {entity_label} — {entity_title} — "
        f"expires in {days_remaining} day{plural}.\n\n"
        f"Visit your management page to renew:\n{manage_url}\n\n"
        f"If you no longer need this listing, no action is required."
    )

    return (
        subject,
        shell("Listing Expiry Notice", body_html, "This is an automated reminder from hirebridge."),
        text_body,
    )
