"""
BiDi (bidirectional text) utilities for HTML email generation.

Two problems solved here:
  1. Whole-email direction: detect the primary script of the content so
     <html dir="..."> is set correctly instead of hardcoded "rtl".
  2. Per-paragraph direction: wrap each line in <p dir="auto"> so email
     clients independently detect Hebrew vs English lines — a single
     large <p dir="rtl"> would force ALL lines right-to-left even when
     the user writes an English sentence.
"""

import html as _html
import unicodedata
from typing import Literal

# Unicode bidirectional categories that signal a strong direction.
# "R" = Hebrew/general RTL, "AL" = Arabic letter.
_RTL = frozenset(("R", "AL", "RLE", "RLO", "RLI"))
_LTR = frozenset(("L", "LRE", "LRO", "LRI"))


def detect_dir(text: str) -> Literal["rtl", "ltr"]:
    """
    Return 'rtl' or 'ltr' based on the first strong directional character
    found in *text*. Falls back to 'rtl' because this is a Hebrew-first app.

    Examples
    --------
    >>> detect_dir("שלום")     # 'rtl'
    >>> detect_dir("Hello")    # 'ltr'
    >>> detect_dir("123")      # 'rtl'  (no strong char → default)
    >>> detect_dir("Hi שלום")  # 'ltr'  (Latin comes first)
    >>> detect_dir("שלום Hi")  # 'rtl'  (Hebrew comes first)
    """
    for char in text:
        cat = unicodedata.bidirectional(char)
        if cat in _RTL:
            return "rtl"
        if cat in _LTR:
            return "ltr"
    return "rtl"


def bidi_paragraphs(text: str) -> str:
    """
    Convert a plain-text body into a sequence of <p dir="auto"> elements.

    Each newline-separated line becomes its own paragraph so that email
    clients apply independent direction detection per line. Content is
    HTML-escaped to prevent injection. Empty lines produce a spacer
    paragraph so visual spacing is preserved.

    Examples
    --------
    >>> bidi_paragraphs("Hello")
    '<p dir="auto">Hello</p>'

    >>> bidi_paragraphs("שלום\\nHello")
    '<p dir="auto">שלום</p>\\n      <p dir="auto">Hello</p>'
    """
    if not text.strip():
        return '<p dir="auto"></p>'

    parts: list[str] = []
    for line in text.split("\n"):
        content = _html.escape(line) if line.strip() else "&nbsp;"
        parts.append(f'<p dir="auto">{content}</p>')
    return "\n      ".join(parts)
