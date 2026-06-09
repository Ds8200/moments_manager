from src.config import settings
from src.users.email_templates import (
    _DEFAULT_BRAND_COLORS,
    DEFAULT_LOGO_PATH,
    build_welcome_email,
    resolve_brand_colors,
    resolve_logo_url,
)

_BRAND_PRIMARY = _DEFAULT_BRAND_COLORS["primary"]
_ORG_BRAND_COLORS = {
    "primary": "#3B5BDB",
    "secondary": "#7048E8",
    "accent": "#F03E3E",
    "background": "#FFFFFF",
    "text": "#212529",
}


def test_build_welcome_email_contains_logo_and_brand_colors() -> None:
    subject, html = build_welcome_email(
        "new@example.com", "temp-pass-123", "magic-token-abc", "עסק לדוגמה", None, None
    )

    assert subject
    assert "עסק לדוגמה" in subject
    # default logo path referenced in src attribute
    assert "nihulo_logo" in html
    # brand primary color applied to headings/buttons
    assert _BRAND_PRIMARY in html
    # magic quick-login link present
    assert "magic-token-abc" in html
    # credential values interpolated
    assert "new@example.com" in html
    assert "temp-pass-123" in html
    # org name interpolated into body and footer
    assert "עסק לדוגמה" in html


def test_build_welcome_email_returns_two_tuple() -> None:
    result = build_welcome_email("a@b.com", "pw", "tok", "עסק לדוגמה", None, None)
    assert isinstance(result, tuple)
    assert len(result) == 2
    subject, html = result
    assert isinstance(subject, str)
    assert isinstance(html, str)


def test_build_welcome_email_uses_org_logo_when_provided() -> None:
    logo_path = "./uploads/logos/org1/logo.png"
    _, html = build_welcome_email("a@b.com", "pw", "tok", "עסק", logo_path, None)
    assert resolve_logo_url(logo_path) in html


def test_build_welcome_email_uses_org_brand_colors_when_provided() -> None:
    _, html = build_welcome_email("a@b.com", "pw", "tok", "עסק", None, _ORG_BRAND_COLORS)
    assert _ORG_BRAND_COLORS["primary"] in html


def test_resolve_logo_url_strips_leading_dot() -> None:
    url = resolve_logo_url("./uploads/logos/org1/logo.png")
    assert url == f"{settings.APP_URL}/uploads/logos/org1/logo.png"


def test_resolve_logo_url_falls_back_to_default_logo() -> None:
    url = resolve_logo_url(None)
    assert url == f"{settings.APP_URL}{DEFAULT_LOGO_PATH}"


def test_resolve_brand_colors_returns_default_when_none() -> None:
    colors = resolve_brand_colors(None)
    assert set(colors) == {"primary", "secondary", "accent", "background", "text"}


def test_resolve_brand_colors_returns_org_palette_unchanged() -> None:
    assert resolve_brand_colors(_ORG_BRAND_COLORS) is _ORG_BRAND_COLORS
