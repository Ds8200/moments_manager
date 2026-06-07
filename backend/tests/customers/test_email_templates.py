from src.customers.email_templates import build_customer_email


def test_build_customer_email_contains_greeting() -> None:
    _, html = build_customer_email("דניאל", "נושא", "תוכן ההודעה", "עסק לדוגמה")

    assert "שלום דניאל" in html


def test_build_customer_email_contains_farewell() -> None:
    _, html = build_customer_email("דניאל", "נושא", "תוכן ההודעה", "עסק לדוגמה")

    assert "בברכה" in html
    assert "עסק לדוגמה" in html


def test_build_customer_email_no_name_omits_greeting() -> None:
    _, html = build_customer_email("", "נושא", "תוכן", "עסק לדוגמה")

    assert "שלום" not in html


def test_build_customer_email_no_name_still_has_farewell() -> None:
    _, html = build_customer_email("", "נושא", "תוכן", "עסק לדוגמה")

    assert "בברכה" in html


def test_build_customer_email_returns_subject_unchanged() -> None:
    subject, _ = build_customer_email("לקוח", "כותרת בדיקה", "גוף", "עסק לדוגמה")

    assert subject == "כותרת בדיקה"


def test_build_customer_email_escapes_html_in_name() -> None:
    _, html = build_customer_email("<script>alert(1)</script>", "נושא", "גוף", "עסק לדוגמה")

    assert "<script>" not in html
