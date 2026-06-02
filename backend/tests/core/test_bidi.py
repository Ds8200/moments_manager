from src.core.bidi import bidi_paragraphs, detect_dir

# ---------------------------------------------------------------------------
# detect_dir
# ---------------------------------------------------------------------------


def test_detect_dir_hebrew_returns_rtl():
    assert detect_dir("שלום עולם") == "rtl"


def test_detect_dir_arabic_returns_rtl():
    assert detect_dir("مرحبا") == "rtl"


def test_detect_dir_english_returns_ltr():
    assert detect_dir("Hello World") == "ltr"


def test_detect_dir_empty_defaults_rtl():
    assert detect_dir("") == "rtl"


def test_detect_dir_digits_only_defaults_rtl():
    # Digits and punctuation have no strong direction — default to RTL.
    assert detect_dir("123 !@#") == "rtl"


def test_detect_dir_english_before_hebrew():
    # First strong char is Latin 'H' → LTR.
    assert detect_dir("Hi שלום") == "ltr"


def test_detect_dir_hebrew_before_english():
    # First strong char is Hebrew 'ש' → RTL.
    assert detect_dir("שלום Hi") == "rtl"


def test_detect_dir_mixed_punctuation_leading():
    # Leading punctuation/numbers are neutral; first letter is Latin.
    assert detect_dir("123 Hello שלום") == "ltr"


# ---------------------------------------------------------------------------
# bidi_paragraphs
# ---------------------------------------------------------------------------


def test_bidi_paragraphs_single_line():
    result = bidi_paragraphs("Hello")
    assert result == '<p dir="auto">Hello</p>'


def test_bidi_paragraphs_multiline_creates_separate_paragraphs():
    result = bidi_paragraphs("שורה ראשונה\nLine Two")
    assert result.count('<p dir="auto">') == 2
    assert "שורה ראשונה" in result
    assert "Line Two" in result


def test_bidi_paragraphs_empty_line_becomes_spacer():
    result = bidi_paragraphs("line1\n\nline2")
    assert "&nbsp;" in result
    assert result.count('<p dir="auto">') == 3


def test_bidi_paragraphs_escapes_html_entities():
    result = bidi_paragraphs("<b>bold</b> & 'quotes'")
    assert "<b>" not in result
    assert "&lt;b&gt;" in result
    assert "&amp;" in result


def test_bidi_paragraphs_prevents_script_injection():
    result = bidi_paragraphs('<script>alert("xss")</script>')
    assert "<script>" not in result
    assert "&lt;script&gt;" in result


def test_bidi_paragraphs_empty_string_returns_empty_paragraph():
    result = bidi_paragraphs("")
    assert result == '<p dir="auto"></p>'


def test_bidi_paragraphs_whitespace_only_returns_empty_paragraph():
    result = bidi_paragraphs("   ")
    assert result == '<p dir="auto"></p>'
