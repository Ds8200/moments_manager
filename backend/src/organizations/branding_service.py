import logging
import os
import uuid

import aiofiles
from fastapi import UploadFile

from src.config import settings
from src.organizations.schemas import BrandColorsSchema

logger = logging.getLogger(__name__)

_ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
_LOGOS_SUBDIR = "logos"


def _logos_dir(org_id: str) -> str:
    return os.path.join(settings.UPLOADS_DIR, _LOGOS_SUBDIR, org_id)


async def upload_logo(org_id: str, file: UploadFile) -> str:
    """Save logo file and return its storage path."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in _ALLOWED_EXTENSIONS:
        from src.core.exceptions import InvalidFileTypeError

        raise InvalidFileTypeError(ext)

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        from src.core.exceptions import FileTooLargeError

        raise FileTooLargeError(settings.MAX_FILE_SIZE_MB)

    dest_dir = _logos_dir(org_id)
    os.makedirs(dest_dir, exist_ok=True)

    filename = f"logo_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(dest_dir, filename)

    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(content)

    storage_path = f"{settings.UPLOADS_DIR}/{_LOGOS_SUBDIR}/{org_id}/{filename}"
    logger.info("Logo saved for org %s → %s", org_id, storage_path)
    return storage_path


def extract_brand_colors(image_path: str) -> BrandColorsSchema:
    """
    Extract a 5-color brand palette from a logo using PIL quantization.
    Falls back to a neutral palette if PIL is unavailable or the image is an SVG.
    """
    ext = os.path.splitext(image_path)[1].lower()
    if ext == ".svg":
        return _neutral_palette()

    try:
        from PIL import Image  # type: ignore[import]
    except ImportError:
        logger.warning("Pillow not installed — returning neutral palette for %s", image_path)
        return _neutral_palette()

    try:
        img = Image.open(image_path).convert("RGB")
        img = img.resize((120, 120), Image.LANCZOS)

        # Quantize to N dominant colors — read palette BEFORE converting to RGB,
        # because getpalette() returns None on an RGB image.
        quantized = img.quantize(colors=6, method=Image.Quantize.MEDIANCUT)
        palette_raw = quantized.getpalette()
        if not palette_raw:
            return _neutral_palette()

        # Build (R, G, B) tuples for the first 6 slots
        rgb_colors = [(palette_raw[i], palette_raw[i + 1], palette_raw[i + 2]) for i in range(0, 18, 3)]

        def _brightness(rgb: tuple) -> float:
            r, g, b = rgb
            return 0.299 * r + 0.587 * g + 0.114 * b

        def _chroma(rgb: tuple) -> float:
            """Chroma = max(R,G,B) - min(R,G,B). Immune to the near-white HSL saturation quirk."""
            return max(rgb) - min(rgb)

        def _to_hex(rgb: tuple) -> str:
            return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"

        # Prefer chromatic (non-gray) colors for primary/secondary/accent.
        # Near-white (brightness > 230) and near-black (brightness < 25) are excluded
        # from the brand pool because they produce invisible or illegible UI.
        chromatic = [c for c in rgb_colors if 25 < _brightness(c) < 230]
        brand_pool = sorted(chromatic, key=_chroma, reverse=True) if chromatic else sorted(rgb_colors, key=_chroma, reverse=True)
        by_brightness = sorted(rgb_colors, key=_brightness)

        def _pick(idx: int) -> str:
            return _to_hex(brand_pool[idx]) if idx < len(brand_pool) else _to_hex(brand_pool[0])

        return BrandColorsSchema(
            primary=_pick(0),
            secondary=_pick(1),
            accent=_pick(2),
            background=_to_hex(by_brightness[-1]),
            text=_to_hex(by_brightness[0]),
        )
    except Exception as exc:
        logger.warning("Color extraction failed for %s: %s — neutral palette used", image_path, exc)
        return _neutral_palette()


def _neutral_palette() -> BrandColorsSchema:
    return BrandColorsSchema(
        primary="#3b5bdb",
        secondary="#7048e8",
        accent="#f03e3e",
        background="#ffffff",
        text="#212529",
    )
