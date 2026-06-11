import html as _html

from src.core.bidi import bidi_paragraphs, detect_dir
from src.users.email_templates import brand_gradient, resolve_brand_colors, resolve_logo_url


def build_customer_email(
    customer_name: str,
    subject: str,
    body: str,
    org_name: str,
    logo_path: str | None,
    brand_colors: dict | None,
) -> tuple[str, str]:
    # Detect primary direction from the actual content, not a hardcoded assumption.
    content_dir = detect_dir(subject + " " + body)

    safe_subject = _html.escape(subject)
    safe_name = _html.escape(customer_name)
    safe_org_name = _html.escape(org_name)
    greeting = f'<p dir="auto">שלום {safe_name},</p>' if safe_name else ""
    farewell = f'<p dir="auto">בברכה,<br>{safe_org_name}</p>'
    body_html = bidi_paragraphs(body)

    colors = resolve_brand_colors(brand_colors)
    gradient = brand_gradient(colors)
    logo_url = resolve_logo_url(logo_path)
    primary = colors["primary"]

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
      background: {gradient};
    }}
    .body {{
      padding: 36px 40px;
    }}
    .body h2 {{
      color: {primary};
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
      background: #f8f9fa;
      padding: 20px 40px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }}
    .footer p {{
      color: #868e96;
      font-size: 12px;
      margin: 0;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{logo_url}" alt="{safe_org_name}" width="200" />
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


def build_customer_welcome_email(
    customer_name: str,
    org_name: str,
    logo_path: str | None,
    brand_colors: dict | None,
) -> tuple[str, str]:
    safe_name = _html.escape(customer_name)
    safe_org_name = _html.escape(org_name)
    greeting = f"שלום {safe_name}," if safe_name else "שלום,"
    subject = f"ברוכים הבאים ל-{org_name}"

    colors = resolve_brand_colors(brand_colors)
    gradient = brand_gradient(colors)
    logo_url = resolve_logo_url(logo_path)
    primary = colors["primary"]

    html_body = f"""<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{_html.escape(subject)}</title>
  <style>
    body {{
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 24px;
      direction: rtl;
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
    .accent-bar {{ height: 6px; background: {gradient}; }}
    .body {{ padding: 36px 40px; }}
    .body h2 {{ color: {primary}; font-size: 20px; margin-top: 0; }}
    .body p {{ color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }}
    .footer {{
      background: #f8f9fa;
      padding: 16px 40px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }}
    .footer p {{ color: #868e96; font-size: 12px; margin: 0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{logo_url}" alt="{safe_org_name}" width="200" />
    </div>
    <div class="accent-bar"></div>
    <div class="body">
      <h2 dir="auto">ברוכים הבאים!</h2>
      <p dir="auto">{greeting}</p>
      <p dir="auto">נשמח לעבוד איתך ב-{safe_org_name}. אנחנו כאן בשבילך!</p>
      <p dir="auto">בברכה,<br>{safe_org_name}</p>
    </div>
    <div class="footer">
      <p>{safe_org_name}</p>
    </div>
  </div>
</body>
</html>"""

    return subject, html_body
