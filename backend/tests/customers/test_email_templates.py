from src.customers.email_templates import build_customer_email
from src.users.email_templates import resolve_logo_url

_ORG_BRAND_COLORS = {
    "primary": "#3B5BDB",
    "secondary": "#7048E8",
    "accent": "#F03E3E",
    "background": "#FFFFFF",
    "text": "#212529",
}


def test_build_customer_email_contains_greeting() -> None:
    _, html = build_customer_email("דניאל", "נושא", "תוכן ההודעה", "עסק לדוגמה", None, None)

    assert "שלום דניאל" in html


def test_build_customer_email_contains_farewell() -> None:
    _, html = build_customer_email("דניאל", "נושא", "תוכן ההודעה", "עסק לדוגמה", None, None)

    assert "בברכה" in html
    assert "עסק לדוגמה" in html


def test_build_customer_email_no_name_omits_greeting() -> None:
    _, html = build_customer_email("", "נושא", "תוכן", "עסק לדוגמה", None, None)

    assert "שלום" not in html


def test_build_customer_email_no_name_still_has_farewell() -> None:
    _, html = build_customer_email("", "נושא", "תוכן", "עסק לדוגמה", None, None)

    assert "בברכה" in html


def test_build_customer_email_returns_subject_unchanged() -> None:
    subject, _ = build_customer_email("לקוח", "כותרת בדיקה", "גוף", "עסק לדוגמה", None, None)

    assert subject == "כותרת בדיקה"


def test_build_customer_email_escapes_html_in_name() -> None:
    _, html = build_customer_email(
        "<script>alert(1)</script>", "נושא", "גוף", "עסק לדוגמה", None, None
    )

    assert "<script>" not in html


def test_build_customer_email_uses_org_logo_and_brand_colors() -> None:
    logo_path = "./uploads/logos/org1/logo.png"
    _, html = build_customer_email("לקוח", "נושא", "גוף", "עסק", logo_path, _ORG_BRAND_COLORS)

    assert resolve_logo_url(logo_path) in html
    assert _ORG_BRAND_COLORS["primary"] in html
