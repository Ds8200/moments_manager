import html as _html

from src.config import settings

# Fallback branding for organizations that haven't uploaded a logo yet.
DEFAULT_LOGO_PATH = "/nihulo_logo.png"
_DEFAULT_BRAND_COLORS: dict[str, str] = {
    "primary": "#3b5bdb",
    "secondary": "#7048e8",
    "accent": "#f03e3e",
    "background": "#ffffff",
    "text": "#212529",
}


def resolve_brand_colors(brand_colors: dict | None) -> dict[str, str]:
    """Return the org's brand palette, falling back to a neutral default."""
    return brand_colors if brand_colors else _DEFAULT_BRAND_COLORS


def brand_gradient(colors: dict[str, str]) -> str:
    return f"linear-gradient(135deg, {colors['primary']} 0%, {colors['secondary']} 100%)"


def resolve_logo_url(logo_path: str | None) -> str:
    """Build an absolute logo URL for email clients (which render outside the app domain)."""
    path = logo_path or DEFAULT_LOGO_PATH
    if path.startswith("."):
        path = path[1:]
    return f"{settings.APP_URL}{path}"


def build_welcome_email(
    recipient_email: str,
    temp_password: str,
    magic_token: str,
    org_name: str,
    logo_path: str | None,
    brand_colors: dict | None,
) -> tuple[str, str]:
    safe_org_name = _html.escape(org_name)
    subject = f"ברוכים הבאים ל-{org_name}"
    login_url = f"{settings.APP_URL}/login"
    quick_login_url = f"{login_url}?token={magic_token}"

    # Email addresses and passwords are always LTR ASCII — escape for safety.
    safe_email = _html.escape(recipient_email)
    safe_password = _html.escape(temp_password)

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
      margin-bottom: 8px;
      text-align: start;
    }}
    .body p {{
      color: #555;
      font-size: 15px;
      line-height: 1.7;
      margin: 0 0 16px;
      text-align: start;
    }}
    .credential-box {{
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 14px 20px;
      margin: 12px 0;
    }}
    .credential-box .label {{
      font-size: 11px;
      color: #868e96;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: start;
    }}
    .credential-box .value {{
      font-size: 16px;
      color: {primary};
      font-weight: 600;
      font-family: 'Courier New', monospace;
      word-break: break-all;
      direction: ltr;
      text-align: start;
    }}
    .note {{
      font-size: 13px !important;
      color: #888 !important;
      text-align: start;
    }}
    .btn-row {{
      text-align: center;
      margin-top: 28px;
    }}
    .btn {{
      display: inline-block;
      background: {gradient};
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      margin: 0 4px;
    }}
    .btn-secondary {{
      background: #f1f3f5;
      color: {primary};
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
      <h2 dir="auto">ברוכים הבאים!</h2>
      <p dir="auto">נוצר עבורך חשבון חדש במערכת הניהול של {safe_org_name}.</p>

      <div class="credential-box">
        <div class="label">אימייל</div>
        <div class="value" dir="ltr">{safe_email}</div>
      </div>

      <div class="credential-box">
        <div class="label">סיסמה זמנית</div>
        <div class="value" dir="ltr">{safe_password}</div>
      </div>

      <p dir="auto" class="note">מומלץ לפנות למנהל המערכת לאחר הכניסה הראשונה לעדכון הסיסמה.</p>

      <div class="btn-row">
        <a href="{quick_login_url}" class="btn">כניסה מהירה</a>
        <a href="{login_url}" class="btn btn-secondary">עמוד הכניסה</a>
      </div>
    </div>
    <div class="footer">
      <p>{safe_org_name} — מערכת ניהול הזמנות ולקוחות</p>
    </div>
  </div>
</body>
</html>"""

    return subject, html_body


def build_password_reset_admin_email(
    recipient_email: str,
    temp_password: str,
    magic_token: str,
    org_name: str,
    platform_name: str,
) -> tuple[str, str]:
    safe_org = _html.escape(org_name)
    safe_platform = _html.escape(platform_name)
    safe_email = _html.escape(recipient_email)
    safe_password = _html.escape(temp_password)
    subject = f"איפוס סיסמה עבור חשבון {safe_org}"
    login_url = f"{settings.APP_URL}/login"
    quick_login_url = f"{login_url}?token={magic_token}"

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
    .accent-bar {{
      height: 6px;
      background: linear-gradient(135deg, #3b5bdb 0%, #7048e8 100%);
    }}
    .body {{
      padding: 36px 40px;
    }}
    .body h2 {{
      color: #3b5bdb;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 8px;
      text-align: start;
    }}
    .body p {{
      color: #555;
      font-size: 15px;
      line-height: 1.7;
      margin: 0 0 16px;
      text-align: start;
    }}
    .credential-box {{
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 14px 20px;
      margin: 12px 0;
    }}
    .credential-box .label {{
      font-size: 11px;
      color: #868e96;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: start;
    }}
    .credential-box .value {{
      font-size: 16px;
      color: #3b5bdb;
      font-weight: 600;
      font-family: 'Courier New', monospace;
      word-break: break-all;
      direction: ltr;
      text-align: start;
    }}
    .note {{
      font-size: 13px !important;
      color: #888 !important;
      text-align: start;
    }}
    .btn-row {{
      text-align: center;
      margin-top: 28px;
    }}
    .btn {{
      display: inline-block;
      background: linear-gradient(135deg, #3b5bdb 0%, #7048e8 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      margin: 0 4px;
    }}
    .btn-secondary {{
      background: #f1f3f5;
      color: #3b5bdb;
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
    <div class="accent-bar"></div>
    <div class="body">
      <h2 dir="auto">איפוס סיסמה</h2>
      <p dir="auto">מנהל המערכת אפס את הסיסמה לחשבון שלך ב-{safe_org}.</p>

      <div class="credential-box">
        <div class="label">אימייל</div>
        <div class="value" dir="ltr">{safe_email}</div>
      </div>

      <div class="credential-box">
        <div class="label">סיסמה זמנית חדשה</div>
        <div class="value" dir="ltr">{safe_password}</div>
      </div>

      <p dir="auto" class="note">מומלץ לשנות את הסיסמה לאחר הכניסה הראשונה.</p>

      <div class="btn-row">
        <a href="{quick_login_url}" class="btn">כניסה מהירה</a>
        <a href="{login_url}" class="btn btn-secondary">עמוד הכניסה</a>
      </div>
    </div>
    <div class="footer">
      <p>{safe_platform}</p>
    </div>
  </div>
</body>
</html>"""

    return subject, html_body


def build_password_changed_email(
    recipient_email: str,
    platform_name: str,
) -> tuple[str, str]:
    safe_email = _html.escape(recipient_email)
    safe_platform = _html.escape(platform_name)
    subject = f"הסיסמה שלך ב-{platform_name} שונתה"

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
      max-width: 480px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }}
    .accent-bar {{
      height: 6px;
      background: linear-gradient(135deg, #3b5bdb 0%, #7048e8 100%);
    }}
    .body {{
      padding: 36px 40px;
    }}
    .body h2 {{
      color: #3b5bdb;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 8px;
    }}
    .body p {{
      color: #555;
      font-size: 15px;
      line-height: 1.7;
      margin: 0 0 16px;
    }}
    .note {{
      font-size: 13px;
      color: #888;
      border-top: 1px solid #e9ecef;
      padding-top: 16px;
      margin-top: 16px;
    }}
    .footer {{
      background: #f8f9fa;
      padding: 16px 40px;
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
    <div class="accent-bar"></div>
    <div class="body">
      <h2 dir="auto">הסיסמה שונתה בהצלחה ✓</h2>
      <p dir="auto">הסיסמה לחשבון
      <strong dir="ltr">{safe_email}</strong> ב-{safe_platform} שונתה זה עתה.</p>
      <p dir="auto">אם לא ביצעת שינוי זה, פנה מיד לתמיכה.</p>
      <p dir="auto" class="note">הודעה זו נשלחה אוטומטית ממערכת {safe_platform}. אין צורך להשיב.</p>
    </div>
    <div class="footer">
      <p>{safe_platform}</p>
    </div>
  </div>
</body>
</html>"""

    return subject, html_body
