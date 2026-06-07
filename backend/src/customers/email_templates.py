import html as _html

from src.core.bidi import bidi_paragraphs, detect_dir
from src.users.email_templates import BRAND_GRADIENT, BRAND_PURPLE, LOGO_URL


def build_customer_email(
    customer_name: str, subject: str, body: str, org_name: str
) -> tuple[str, str]:
    # Detect primary direction from the actual content, not a hardcoded assumption.
    content_dir = detect_dir(subject + " " + body)

    safe_subject = _html.escape(subject)
    safe_name = _html.escape(customer_name)
    safe_org_name = _html.escape(org_name)
    greeting = f'<p dir="auto">שלום {safe_name},</p>' if safe_name else ""
    farewell = f'<p dir="auto">בברכה,<br>{safe_org_name}</p>'
    body_html = bidi_paragraphs(body)

    html_body = f"""<!DOCTYPE html>
<html dir="{content_dir}" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{safe_subject}</title>
  <style>
    body {{
      font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 24px;
    }}
    .container {{
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }}
    .header {{
      background-color: #ffffff;
      padding: 32px 40px 20px;
      text-align: center;
    }}
    .header img {{
      display: block;
      margin: 0 auto;
      width: 200px;
      max-width: 70%;
      height: auto;
    }}
    .accent-bar {{
      height: 6px;
      background: {BRAND_GRADIENT};
    }}
    .body {{
      padding: 36px 40px;
    }}
    .body h2 {{
      color: {BRAND_PURPLE};
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 16px;
      text-align: start;
    }}
    .body p {{
      color: #555;
      font-size: 15px;
      line-height: 1.7;
      margin: 0 0 16px;
      text-align: start;
    }}
    .footer {{
      background: #faf5fc;
      padding: 20px 40px;
      text-align: center;
      border-top: 1px solid #ecd9f2;
    }}
    .footer p {{
      color: #b18fbd;
      font-size: 12px;
      margin: 0;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{LOGO_URL}" alt="{safe_org_name}" width="200" />
    </div>
    <div class="accent-bar"></div>
    <div class="body">
      <h2 dir="auto">{safe_subject}</h2>
      {greeting}
      {body_html}
      {farewell}
    </div>
    <div class="footer">
      <p>{safe_org_name} — מערכת ניהול הזמנות ולקוחות</p>
    </div>
  </div>
</body>
</html>"""

    return subject, html_body
