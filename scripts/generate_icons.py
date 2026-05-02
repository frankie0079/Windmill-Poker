"""Generiert App-Icons aus public/logo.png (282x400, Hochformat).

Output:
- app/icon.png        — 512x512, Browser-Tab/PWA
- app/apple-icon.png  — 180x180, iPhone Add-to-Home
- public/icon-192.png — 192x192, Manifest-Referenz
- public/icon-512.png — 512x512, Manifest-Referenz
- public/icon-512-maskable.png — 512x512 mit safe area (60% Logo)

Ausführung: python scripts/generate_icons.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
LOGO = Image.open(REPO / "public" / "logo.png").convert("RGBA")
LOGO_W, LOGO_H = LOGO.size  # 282, 400

CREAM = (242, 231, 206, 255)


def make_icon(size: int, logo_scale: float = 1.0, bg=CREAM) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg)
    target_h = int(size * logo_scale)
    target_w = int(target_h * LOGO_W / LOGO_H)
    logo_resized = LOGO.resize((target_w, target_h), Image.LANCZOS)
    x = (size - target_w) // 2
    y = (size - target_h) // 2
    canvas.paste(logo_resized, (x, y), logo_resized)
    return canvas


def save(img: Image.Image, rel: str) -> None:
    p = REPO / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    img.save(p, "PNG", optimize=True)
    print(f"  {rel} ({img.size[0]}x{img.size[1]})")


print("generating icons:")
save(make_icon(512), "app/icon.png")
save(make_icon(180), "app/apple-icon.png")
save(make_icon(192), "public/icon-192.png")
save(make_icon(512), "public/icon-512.png")
save(make_icon(512, logo_scale=0.6), "public/icon-512-maskable.png")
print("done.")
