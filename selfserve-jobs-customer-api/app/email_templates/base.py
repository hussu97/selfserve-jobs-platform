# ---------------------------------------------------------------------------
# Sage & Stone design tokens (mirrors the frontend CSS vars)
# ---------------------------------------------------------------------------

BG = "#fcf9f5"
SURFACE = "#ffffff"
PRIMARY = "#384B3B"
PRIMARY_BTN = "#506E54"
SECONDARY = "#8C4E32"
TEXT_MAIN = "#1c1c1a"
TEXT_MUTED = "#434843"
DIVIDER = "#e8e4df"
ACCENT = "#8BA888"


# ---------------------------------------------------------------------------
# Shared layout helpers
# ---------------------------------------------------------------------------


def shell(header_text: str, body_html: str, footer_note: str, site_url: str = "") -> str:
    """Wrap a body block in the standard hirebridge email shell (header + footer).

    ``site_url`` overrides the footer domain line; falls back to ``settings.frontend_url``.
    """
    if not site_url:
        from app.config import get_settings

        site_url = get_settings().frontend_url
    display_domain = site_url.replace("https://", "").replace("http://", "").rstrip("/")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:{BG};">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:{BG};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%;">

          <!-- Wordmark header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;
                           font-style:italic;color:{PRIMARY};letter-spacing:-0.5px;">
                hirebridge
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:{SURFACE};border-radius:16px;padding:40px;
                       box-shadow:0 1px 3px rgba(28,28,26,0.05),0 8px 20px rgba(28,28,26,0.04);">

              <!-- Eyebrow label -->
              <p style="margin:0 0 12px 0;font-family:'Helvetica Neue',Arial,sans-serif;
                        font-size:11px;font-weight:600;letter-spacing:0.12em;
                        text-transform:uppercase;color:{ACCENT};">
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
                        color:{TEXT_MUTED};">
                hirebridge · {display_domain}
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


def cta_button(url: str, label: str) -> str:
    return (
        f'<a href="{url}" '
        f'style="display:inline-block;background-color:{PRIMARY_BTN};color:#ffffff;'
        f"padding:14px 28px;border-radius:100px;text-decoration:none;"
        f"font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;"
        f'font-weight:600;letter-spacing:0.04em;">'
        f"{label}</a>"
    )


def fallback_link(url: str) -> str:
    return (
        f"<p style=\"margin:16px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;"
        f'font-size:12px;color:{TEXT_MUTED};">'
        f"Or copy this link: "
        f'<a href="{url}" style="color:{SECONDARY};word-break:break-all;">{url}</a></p>'
    )


def divider() -> str:
    return f'<div style="height:1px;background-color:{DIVIDER};margin:28px 0;"></div>'
