#!/usr/bin/env python3
"""Builds the portfolio logo files: mark, favicon, and outlined wordmark lockup.

Geometry lives in one place so the header, favicon and lockup never drift.
"""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform
import os

OUT = "/home/nox/portfolio/assets"
FONT = os.environ.get("FONT", os.path.expanduser("~/portfolio/tools/SpaceGrotesk.ttf"))

INK = "#f1f2ed"
BG = "#0a0b0c"
ACCENT = "#c9f24d"

HEAD = "M9 8 L23 21 H41 L55 8 V34 C55 46 45 57 32 57 C19 57 9 46 9 34 Z"
EYE_L = dict(x=21.5, y=28, w=6, h=12, r=3)
EYE_R = dict(x=36.5, y=28, w=6, h=12, r=3)
NOSE = "M28.2 44 H35.8 L32 49.4 Z"


def mark_group(fill=INK, accent=ACCENT, stroke=None):
    """Cat mark inside a 64x64 box, transparent background."""
    parts = [f'<path d="{HEAD}" fill="{fill}" mask="url(#eyes)"/>']
    eyes = (
        f'<mask id="eyes" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">'
        f'<rect width="64" height="64" fill="#fff"/>'
        f'<rect x="{EYE_L["x"]}" y="{EYE_L["y"]}" width="{EYE_L["w"]}" height="{EYE_L["h"]}" rx="{EYE_L["r"]}" fill="#000"/>'
        f'<rect x="{EYE_R["x"]}" y="{EYE_R["y"]}" width="{EYE_R["w"]}" height="{EYE_R["h"]}" rx="{EYE_R["r"]}" fill="#000"/>'
        f"</mask>"
    )
    parts.append(eyes)
    parts.append(f'<path d="{NOSE}" fill="{accent}"/>')
    return "".join(parts)


def badge(size=64, rx=14, border=False):
    stroke = f' stroke="rgba(241,242,237,0.14)" stroke-width="1"' if border else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="{size}" height="{size}" role="img" aria-label="Maximilian Jatzkowski cat mark">'
        f'<rect width="64" height="64" rx="{rx}" fill="{BG}"{stroke}/>'
        f"{mark_group()}"
        f"</svg>"
    )


def text_path(text, size, weight=500, tracking=0.0, x=0, y=0):
    """Convert a string to one SVG path, baseline at (x, y)."""
    font = TTFont(FONT)
    font = instantiateVariableFont(font, {"wght": weight}, inplace=True)
    upem = font["head"].unitsPerEm
    glyphset = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    scale = size / upem
    pen_all = []
    cursor = 0.0
    for ch in text:
        name = cmap.get(ord(ch))
        if name is None:
            cursor += size * 0.3
            continue
        spen = SVGPathPen(glyphset)
        tpen = TransformPen(spen, Transform(scale, 0, 0, -scale, x + cursor * scale, y))
        glyphset[name].draw(tpen)
        d = spen.getCommands()
        if d:
            pen_all.append(d)
        cursor += hmtx[name][0] + tracking * upem / size
    return " ".join(pen_all), (cursor * scale)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)

    # 1. Square mark (transparent bg variant for reuse)
    open(f"{OUT}/mark.svg", "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Cat mark">{mark_group()}</svg>'
    )

    # 2. Favicon: dark badge, bolder eyes already baked in
    open(f"{OUT}/favicon.svg", "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">'
        f'<rect width="64" height="64" rx="14" fill="{BG}"/>{mark_group()}</svg>'
    )

    # 3. Horizontal lockup: badge + name + descriptor, all outlined
    name_d, name_w = text_path("maximilian jatzkowski", 44, weight=500, tracking=-0.5, x=132, y=74)
    desc_d, desc_w = text_path("IT STUDENT · HOMELAB · SECURITY", 11.5, weight=500, tracking=2.2, x=133, y=98)
    width = round(max(132 + name_w, 133 + desc_w) + 8)

    def lockup(ink, muted, label):
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} 128" width="{width}" height="128" role="img" aria-label="Maximilian Jatzkowski">'
            f'<rect x="4" y="16" width="96" height="96" rx="21" fill="{BG}"/>'
            f'<g transform="translate(4,16) scale(1.5)">{mark_group()}</g>'
            f'<path d="{name_d}" fill="{ink}"/>'
            f'<path d="{desc_d}" fill="{muted}"/>'
            f"</svg>"
        )

    # Dark surfaces (site, dark decks) and light surfaces (print, white papers)
    open(f"{OUT}/logo.svg", "w").write(lockup(INK, "#767c78", "dark"))
    open(f"{OUT}/logo-light.svg", "w").write(lockup("#13140f", "#6d7066", "light"))
    print("wrote mark.svg, favicon.svg, logo.svg, logo-light.svg")
    print("lockup width:", width)
