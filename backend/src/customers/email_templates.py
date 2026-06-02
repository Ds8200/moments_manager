from src.users.email_templates import BRAND_GRADIENT, BRAND_PURPLE, LOGO_URL


def build_customer_email(customer_name: str, subject: str, body: str) -> tuple[str, str]:
    safe_body = body.replace("\n", "<br>")
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
      margin-bottom: 16px;
    }}
    .body p {{
      color: #555;
      font-size: 15px;
      line-height: 1.7;
      margin: 0 0 16px;
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
      <h2>{subject}</h2>
      <p>שלום {customer_name},</p>
      <p>{safe_body}</p>
    </div>
    <div class="footer">
      <p>Moments — מערכת ניהול הזמנות ולקוחות</p>
    </div>
  </div>
</body>
</html>"""

    return subject, html_body
