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

        # Quantize to N dominant colors
        quantized = img.quantize(colors=6, method=Image.Quantize.MEDIANCUT).convert("RGB")
        palette_raw = quantized.getpalette()
        if not palette_raw:
            return _neutral_palette()

        # Build (R, G, B) tuples for the first 6 slots
        colors = [
            (palette_raw[i], palette_raw[i + 1], palette_raw[i + 2]) for i in range(0, 18, 3)
        ]
        hex_colors = [f"#{r:02x}{g:02x}{b:02x}" for r, g, b in colors]

        def _brightness(h: str) -> float:
            r, g, b = int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)
            return 0.299 * r + 0.587 * g + 0.114 * b

        sorted_by_brightness = sorted(hex_colors, key=_brightness)

        return BrandColorsSchema(
            primary=hex_colors[0],
            secondary=hex_colors[1] if len(hex_colors) > 1 else hex_colors[0],
            accent=hex_colors[2] if len(hex_colors) > 2 else hex_colors[0],
            background=sorted_by_brightness[-1],
            text=sorted_by_brightness[0],
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
