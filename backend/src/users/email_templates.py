from src.config import settings


def build_welcome_email(
    recipient_email: str, temp_password: str, magic_token: str
) -> tuple[str, str]:
    subject = "ברוכים הבאים ל-Moments"
    login_url = f"{settings.APP_URL}/login"
    quick_login_url = f"{login_url}?token={magic_token}"

    html_body = f"""<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
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
      background-color: #2d2d2d;
      padding: 32px 40px;
      text-align: center;
    }}
    .header h1 {{
      color: #ffffff;
      margin: 0;
      font-size: 26px;
      letter-spacing: 2px;
      font-weight: 300;
    }}
    .body {{
      padding: 36px 40px;
    }}
    .body h2 {{
      color: #2d2d2d;
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
    .credential-box {{
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 14px 20px;
      margin: 12px 0;
    }}
    .credential-box .label {{
      font-size: 11px;
      color: #888;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .credential-box .value {{
      font-size: 16px;
      color: #2d2d2d;
      font-weight: 600;
      font-family: 'Courier New', monospace;
      word-break: break-all;
    }}
    .note {{
      font-size: 13px !important;
      color: #888 !important;
    }}
    .btn-row {{
      text-align: center;
      margin-top: 28px;
    }}
    .btn {{
      display: inline-block;
      background-color: #2d2d2d;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      margin: 0 4px;
    }}
    .btn-secondary {{
      background-color: #f0f0f0;
      color: #2d2d2d;
    }}
    .footer {{
      background: #f8f8f8;
      padding: 20px 40px;
      text-align: center;
      border-top: 1px solid #ebebeb;
    }}
    .footer p {{
      color: #aaa;
      font-size: 12px;
      margin: 0;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Moments</h1>
    </div>
    <div class="body">
      <h2>ברוכים הבאים!</h2>
      <p>נוצר עבורך חשבון חדש במערכת ניהול Moments.</p>

      <div class="credential-box">
        <div class="label">אימייל</div>
        <div class="value">{recipient_email}</div>
      </div>

      <div class="credential-box">
        <div class="label">סיסמה זמנית</div>
        <div class="value">{temp_password}</div>
      </div>

      <p class="note">מומלץ לפנות למנהל המערכת לאחר הכניסה הראשונה לעדכון הסיסמה.</p>

      <div class="btn-row">
        <a href="{quick_login_url}" class="btn">כניסה מהירה</a>
        <a href="{login_url}" class="btn btn-secondary">עמוד הכניסה</a>
      </div>
    </div>
    <div class="footer">
      <p>Moments — מערכת ניהול הזמנות ולקוחות</p>
    </div>
  </div>
</body>
</html>"""

    return subject, html_body
