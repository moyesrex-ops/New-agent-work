#!/usr/bin/env python3
"""Build the locked Stampa logo assets.

The wordmark is converted from Archivo SemiBold to outlines so the shipped SVGs
render identically without the font installed.
"""
import os
import subprocess

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.expanduser("~/.fonts/Archivo-SemiBold.ttf")

INK = "#14121A"
VIOLET = "#4C2A85"
PAPER = "#FBF9F4"

# Mark geometry, 120x120 box. Locked after round 3 and the stroke-weight test.
PRESS = -5
S_R = 13.5
S_WIDTH = 14.0
S_PATH = (
    f"M {60 + S_R * 0.955:.2f} {60 - S_R * 0.985:.2f} "
    f"A {S_R} {S_R} 0 1 0 60 60 "
    f"A {S_R} {S_R} 0 1 1 {60 - S_R * 0.955:.2f} {60 + S_R * 0.985:.2f}"
)
PERF_R = 7.5
PERF_POS = (24, 60, 96)


def wordmark_path(text="Stampa", cap_height=100.0, tracking=-34.0):
    """Return (path_d, advance_width, scale) for the outlined wordmark.

    Coordinates are y-down and the baseline sits at y=0, so callers translate
    by the cap height to place it.
    """
    font = TTFont(FONT)
    upem = font["head"].unitsPerEm
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    scale = cap_height / font["OS/2"].sCapHeight

    parts, pen_x = [], 0.0
    for ch in text:
        name = cmap[ord(ch)]
        pen = SVGPathPen(glyph_set)
        glyph_set[name].draw(pen)
        d = pen.getCommands()
        if d:
            parts.append(f'<path d="{d}" transform="translate({pen_x:.2f} 0)"/>')
        pen_x += hmtx[name][0] + (tracking * upem / 1000.0)

    inner = "".join(parts)
    width = pen_x * scale
    group = (
        f'<g transform="scale({scale:.6f} {-scale:.6f})">{inner}</g>'
    )
    return group, width, scale


def mark(color, press=PRESS, perforated=True, ident=""):
    perfs = ""
    if perforated:
        holes = []
        for p in PERF_POS:
            holes += [
                f'<circle cx="{p}" cy="6" r="{PERF_R}"/>',
                f'<circle cx="{p}" cy="114" r="{PERF_R}"/>',
                f'<circle cx="6" cy="{p}" r="{PERF_R}"/>',
                f'<circle cx="114" cy="{p}" r="{PERF_R}"/>',
            ]
        perfs = f'<mask id="perf{ident}"><rect x="6" y="6" width="108" height="108" rx="8" fill="#fff"/><g fill="#000">{"".join(holes)}</g></mask>'
        body = f'<rect x="6" y="6" width="108" height="108" rx="8" fill="{color}" mask="url(#perf{ident})"/>'
    else:
        body = f'<rect x="8" y="8" width="104" height="104" rx="14" fill="{color}"/>'

    return (
        f'{perfs}'
        f'<mask id="sk{ident}"><rect width="120" height="120" fill="#fff"/>'
        f'<path d="{S_PATH}" fill="none" stroke="#000" stroke-width="{S_WIDTH}" stroke-linecap="butt"/></mask>'
        f'<g transform="rotate({press} 60 60)"><g mask="url(#sk{ident})">{body}</g></g>'
    )


def svg(w, h, body, bg=None):
    back = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}">{back}{body}</svg>\n'
    )


def write(name, content):
    path = os.path.join(HERE, name)
    with open(path, "w") as fh:
        fh.write(content)
    return path


def main():
    assets = {}

    # 1. Symbol only, full perforated mark.
    for label, color in (("ink", INK), ("violet", VIOLET), ("paper", PAPER)):
        assets[f"stampa-mark-{label}.svg"] = svg(120, 120, mark(color, ident=label))

    # 2. Simplified mark for <=24px, favicon, notification icon.
    assets["stampa-mark-small.svg"] = svg(
        120, 120, mark(INK, perforated=False, ident="sm")
    )

    # 3. Wordmark, outlined. Cap height 64 sits optically level with a 120 mark.
    CAP = 64.0
    DESC = CAP / 0.72 * 0.21
    wm, wm_w, _ = wordmark_path(cap_height=CAP)
    pad = 6
    assets["stampa-wordmark.svg"] = svg(
        round(wm_w + pad * 2),
        round(CAP + DESC + pad * 2),
        f'<g fill="{INK}" transform="translate({pad} {CAP + pad:.1f})">{wm}</g>',
    )

    # 4. Horizontal lockup. Gap is 0.25 of the mark width; wordmark baseline is
    #    set so the cap height is centred on the mark, not the full glyph box.
    mh = 120.0
    gap = mh * 0.25
    baseline = mh / 2 + CAP / 2
    total_w = mh + gap + wm_w
    for label, colour in (("", INK), ("-reversed", PAPER)):
        body = (
            f'<g>{mark(colour, ident="lh" + label)}</g>'
            f'<g fill="{colour}" transform="translate({mh + gap:.2f} {baseline:.1f})">{wm}</g>'
        )
        assets[f"stampa-lockup-horizontal{label}.svg"] = svg(
            round(total_w), round(mh), body
        )

    # 5. Stacked lockup. Mark, then a gap of 0.20 mark height, then the wordmark.
    v_gap = mh * 0.20
    stack_w = max(mh, wm_w)
    stack_h = mh + v_gap + CAP + DESC
    body = (
        f'<g transform="translate({(stack_w - mh) / 2:.2f} 0)">{mark(INK, ident="ls")}</g>'
        f'<g fill="{INK}" transform="translate({(stack_w - wm_w) / 2:.2f} {mh + v_gap + CAP:.1f})">{wm}</g>'
    )
    assets["stampa-lockup-stacked.svg"] = svg(round(stack_w), round(stack_h), body)

    # 6. App icon, full bleed on violet, 1024 master.
    scale = 1024 / 120 * 0.84
    off = (1024 - 120 * scale) / 2
    body = (
        f'<rect width="1024" height="1024" rx="225" fill="{VIOLET}"/>'
        f'<g transform="translate({off:.1f} {off:.1f}) scale({scale:.5f})">{mark(PAPER, ident="app")}</g>'
    )
    assets["stampa-app-icon.svg"] = svg(1024, 1024, body)

    # 7. Circular avatar. A square mark cropped to a circle loses the perforated
    #    silhouette, so circular contexts get the S alone on a violet disc.
    s_scale = 3.1
    s_off = (512 - 120 * s_scale) / 2
    body = (
        f'<circle cx="256" cy="256" r="256" fill="{VIOLET}"/>'
        f'<g transform="translate({s_off:.1f} {s_off:.1f}) scale({s_scale})">'
        f'<path d="{S_PATH}" fill="none" stroke="{PAPER}" '
        f'stroke-width="{S_WIDTH}" stroke-linecap="butt"/></g>'
    )
    assets["stampa-avatar.svg"] = svg(512, 512, body)

    # 8. Favicon, simplified mark on violet.
    body = (
        f'<rect width="120" height="120" rx="20" fill="{VIOLET}"/>'
        f'<g transform="translate(12 12) scale(0.8)">{mark(PAPER, perforated=False, ident="fav")}</g>'
    )
    assets["stampa-favicon.svg"] = svg(120, 120, body)

    for name, content in assets.items():
        write(name, content)

    png = [
        ("stampa-app-icon.svg", "stampa-app-icon-1024.png", 1024),
        ("stampa-app-icon.svg", "stampa-app-icon-192.png", 192),
        ("stampa-app-icon.svg", "stampa-app-icon-48.png", 48),
        ("stampa-lockup-horizontal.svg", "stampa-lockup-horizontal.png", 1200),
        ("stampa-mark-violet.svg", "stampa-mark-512.png", 512),
        ("stampa-mark-small.svg", "stampa-mark-small-16.png", 16),
        ("stampa-avatar.svg", "stampa-avatar-256.png", 256),
    ]
    for src, dst, w in png:
        subprocess.run(
            ["rsvg-convert", "-w", str(w), os.path.join(HERE, src),
             "-o", os.path.join(HERE, dst)],
            check=True,
        )

    print(f"wrote {len(assets)} svg + {len(png)} png to {HERE}")


if __name__ == "__main__":
    main()
