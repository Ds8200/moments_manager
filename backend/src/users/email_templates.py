from src.config import settings

LOGO_URL = "https://moments-manager.vercel.app/moments_logo.png"

# Brand colors — מותאם ללוגו Moments (סגול → מג'נטה)
BRAND_PURPLE = "#9C27B0"
BRAND_GRADIENT = "linear-gradient(135deg, #9C27B0 0%, #D81B60 100%)"


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
      margin-bottom: 8px;
    }}
    .body p {{
      color: #555;
      font-size: 15px;
      line-height: 1.7;
      margin: 0 0 16px;
    }}
    .credential-box {{
      background: #faf5fc;
      border: 1px solid #ecd9f2;
      border-radius: 8px;
      padding: 14px 20px;
      margin: 12px 0;
    }}
    .credential-box .label {{
      font-size: 11px;
      color: #9b6fab;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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
      background: {BRAND_GRADIENT};
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      margin: 0 4px;
    }}
    .btn-secondary {{
      background: #f3e5f5;
      color: {BRAND_PURPLE};
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
      <img src="{LOGO_URL}" alt="Moments" width="200" />
    </div>
    <div class="accent-bar"></div>
    <div class="body">
      <h2>ברוכים הבאים!</h2>
      <p>נוצר עבורך חשבון חדש במערכת ניהול Moments.</p>

      <div class="credential-box">
        <div class="label">אימייל</div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle; padding:0;">
              <input type="text" value="{recipient_email}" readonly onclick="this.select()"
                     style="font-family:'Courier New',monospace; font-size:15px; color:{BRAND_PURPLE}; font-weight:600; background:transparent; border:none; outline:none; cursor:pointer; width:100%; direction:ltr; display:block;" />
            </td>
            <td width="34" style="vertical-align:middle; padding-right:8px; text-align:center;">
              <span onclick="this.closest('table').querySelector('input').select()"
                    style="display:inline-block; width:30px; height:30px; background:#ecd9f2; border-radius:6px; text-align:center; line-height:30px; font-size:15px; cursor:pointer; user-select:none;">📋</span>
            </td>
          </tr>
        </table>
      </div>

      <div class="credential-box">
        <div class="label">סיסמה זמנית</div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle; padding:0;">
              <input type="text" value="{temp_password}" readonly onclick="this.select()"
                     style="font-family:'Courier New',monospace; font-size:15px; color:{BRAND_PURPLE}; font-weight:600; background:transparent; border:none; outline:none; cursor:pointer; width:100%; direction:ltr; display:block;" />
            </td>
            <td width="34" style="vertical-align:middle; padding-right:8px; text-align:center;">
              <span onclick="this.closest('table').querySelector('input').select()"
                    style="display:inline-block; width:30px; height:30px; background:#ecd9f2; border-radius:6px; text-align:center; line-height:30px; font-size:15px; cursor:pointer; user-select:none;">📋</span>
            </td>
          </tr>
        </table>
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
