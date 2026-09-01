#!/usr/bin/env python3
"""Render the Phase 10 brand-test sheet and the Phase 11 application kit.

Run from this directory: python3 build_brand_sheets.py
Assets are referenced from ./logo, so rsvg-convert must run with this file's
directory as the base URI (the script handles that).
"""
import json
import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
TOK = json.load(
    open(os.path.join(HERE, "..", "..", "design-tokens", "tokens.json"))
)["color"]

PAPER = TOK["paper"]["DEFAULT"]
WHITE = TOK["paper"]["raised"]
INK = TOK["ink"]["900"]
INK5 = TOK["ink"]["500"]
INK3 = TOK["ink"]["300"]
INK1 = TOK["ink"]["100"]
VIOLET = TOK["stamp"]["700"]
VIOLET1 = TOK["stamp"]["100"]
GREEN = TOK["success"]["700"]
AMBER = TOK["warning"]["700"]
RED = TOK["danger"]["700"]

SANS = "Archivo"
MONO = "IBM Plex Mono"


def t(x, y, s, size=13, fill=INK, weight="400", family=SANS,
      anchor="start", track=None):
    tr = f' letter-spacing="{track}"' if track else ""
    return (
        f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
        f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{tr}>{s}</text>'
    )


def label(x, y, s):
    return t(x, y, s, 11, INK3, "500", track="0.6")


def qr(x, y, size, dark=INK):
    """A plausible QR block. Deterministic, not a real encoding."""
    n, cell = 21, size / 21.0
    seed = 0x2F6E3
    out = [f'<rect x="{x}" y="{y}" width="{size}" height="{size}" fill="{WHITE}"/>']
    def finder(cx, cy):
        s = cell * 7
        return (
            f'<rect x="{x + cx * cell}" y="{y + cy * cell}" width="{s}" height="{s}" fill="{dark}"/>'
            f'<rect x="{x + (cx + 1) * cell}" y="{y + (cy + 1) * cell}" width="{cell * 5}" height="{cell * 5}" fill="{WHITE}"/>'
            f'<rect x="{x + (cx + 2) * cell}" y="{y + (cy + 2) * cell}" width="{cell * 3}" height="{cell * 3}" fill="{dark}"/>'
        )
    out += [finder(0, 0), finder(n - 7, 0), finder(0, n - 7)]
    v = seed
    for row in range(n):
        for col in range(n):
            in_finder = (
                (row < 8 and col < 8) or (row < 8 and col >= n - 8)
                or (row >= n - 8 and col < 8)
            )
            v = (v * 1103515245 + 12345) & 0x7FFFFFFF
            if in_finder or (v >> 16) % 100 < 52:
                continue
            out.append(
                f'<rect x="{x + col * cell:.2f}" y="{y + row * cell:.2f}" '
                f'width="{cell:.2f}" height="{cell:.2f}" fill="{dark}"/>'
            )
    return "".join(out)


def chip(x, y, text, fg, bg, w=None):
    w = w or (len(text) * 7.2 + 34)
    return (
        f'<rect x="{x}" y="{y}" width="{w:.0f}" height="26" rx="6" fill="{bg}"/>'
        f'<circle cx="{x + 15}" cy="{y + 13}" r="4" fill="{fg}"/>'
        + t(x + 26, y + 18, text, 12.5, fg, "600")
    )


def invoice(x, y, w=520, h=372, stamped=True):
    """The signature object: the stamped tax invoice the supplier forwards."""
    g = [
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{WHITE}" stroke="{INK1}"/>',
        f'<image href="logo/stampa-mark-ink.svg" x="{x+26}" y="{y+22}" width="30" height="30"/>',
        t(x + 64, y + 44, "Stampa", 19, INK, "600", track="-0.5"),
        t(x + w - 26, y + 34, "TAX INVOICE", 11, INK5, "500", anchor="end", track="1"),
        t(x + w - 26, y + 50, "INV-0032", 12, INK, "500", MONO, anchor="end"),
        f'<line x1="{x+26}" y1="{y+68}" x2="{x+w-26}" y2="{y+68}" stroke="{INK1}"/>',
        label(x + 26, y + 94, "FROM"),
        t(x + 26, y + 114, "Emeka Aluminium Works Ltd", 14.5, INK, "600"),
        t(x + 26, y + 132, "TIN 20481166-0001", 11.5, INK5, "400", MONO),
        label(x + 286, y + 94, "TO"),
        t(x + 286, y + 114, "Agbara Foods Plc", 14.5, INK, "600"),
        t(x + 286, y + 132, "TIN 10229384-0001", 11.5, INK5, "400", MONO),
        f'<line x1="{x+26}" y1="{y+150}" x2="{x+w-26}" y2="{y+150}" stroke="#F0EDE6"/>',
        t(x + 26, y + 174, "Aluminium railings, 42 units", 13.5),
        t(x + w - 26, y + 174, "1,721,000.00", 13.5, INK, "400", MONO, "end"),
        t(x + 26, y + 196, "VAT 7.5%", 13.5, INK5),
        t(x + w - 26, y + 196, "129,075.00", 13.5, INK5, "400", MONO, "end"),
        f'<line x1="{x+w-230}" y1="{y+212}" x2="{x+w-26}" y2="{y+212}" stroke="{INK}" stroke-width="1.5"/>',
        t(x + w - 230, y + 238, "Total", 15, INK, "600"),
        t(x + w - 26, y + 240, "NGN 1,850,075.00", 17, INK, "500", MONO, "end"),
    ]
    if stamped:
        g += [
            f'<g transform="rotate(-4 {x+150} {y+306})">',
            f'<rect x="{x+30}" y="{y+270}" width="240" height="74" rx="6" fill="none" stroke="{VIOLET}" stroke-width="1.8"/>',
            f'<image href="logo/stampa-mark-violet.svg" x="{x+42}" y="{y+288}" width="40" height="40"/>',
            t(x + 92, y + 298, "STAMPED", 15, VIOLET, "700", track="1.4"),
            t(x + 92, y + 316, "IRN-7K2M-88QX-2026", 11, VIOLET, "500", MONO),
            t(x + 92, y + 332, "14 SEP 2026 10:42 WAT", 9.5, INK5, "400", MONO),
            "</g>",
            qr(x + w - 106, y + 262, 80),
            t(x + w - 26, y + 356, "Verify at nrs.gov.ng", 9.5, INK3, "400",
              SANS, "end"),
        ]
    return "".join(g)


def phone(x, y, w, h, body, chrome=True):
    g = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="26" fill="{PAPER}" stroke="{INK1}"/>']
    if chrome:
        g += [
            f'<rect x="{x}" y="{y}" width="{w}" height="30" rx="26" fill="{PAPER}"/>',
            t(x + 18, y + 20, "9:41", 11, INK, "600"),
            t(x + w - 18, y + 20, "4G", 11, INK5, "500", SANS, "end"),
        ]
    g.append(body)
    return "".join(g)


def svg_doc(w, h, body, bg=PAPER):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}"><rect width="{w}" height="{h}" fill="{bg}"/>'
        f"{body}</svg>\n"
    )


def render(name, content, width):
    path = os.path.join(HERE, name + ".svg")
    with open(path, "w") as fh:
        fh.write(content)
    subprocess.run(
        ["rsvg-convert", "-w", str(width), path, "-o",
         os.path.join(HERE, name + ".png")],
        check=True, cwd=HERE,
    )
    return path


# ----------------------------------------------------------------- test sheet
def brand_tests():
    p = []
    p.append(t(40, 44, "PHASE 10  BRAND TESTS", 15, INK, "700", track="2"))

    # 1 shrink
    p.append(label(40, 84, "1. SHRINK  48 / 32 / 24 / 20 / 16 PX"))
    xx = 40
    for s in (48, 32, 24):
        p.append(f'<image href="logo/stampa-mark-ink.svg" x="{xx}" y="{100 + (48-s)//2}" width="{s}" height="{s}"/>')
        xx += s + 16
    for s in (24, 20, 16):
        p.append(f'<image href="logo/stampa-mark-small.svg" x="{xx}" y="{100 + (48-s)//2}" width="{s}" height="{s}"/>')
        xx += s + 16
    p.append(t(40, 172, "full mark to 24px, then the simplified mark takes over", 11, INK3))

    # 2 monochrome / receipt / stencil
    p.append(label(40, 214, "2. MONOCHROME, THERMAL RECEIPT, 1-BIT"))
    p.append(f'<rect x="40" y="228" width="300" height="128" fill="#D9D6CF"/>')
    p.append(f'<image href="logo/stampa-mark-ink.svg" x="62" y="248" width="40" height="40"/>')
    p.append(t(112, 264, "STAMPA", 12, "#000", "400", MONO))
    p.append(t(112, 281, "IRN-7K2M-88QX-2026", 12, "#000", "400", MONO))
    p.append(t(62, 308, "AGBARA FOODS PLC", 11, "#000", "400", MONO))
    p.append(t(62, 324, "NGN 1,850,075.00", 11, "#000", "400", MONO))
    p.append(t(62, 342, "14 SEP 2026  10:42 WAT", 10, "#000", "400", MONO))

    # 3 distance / stranger phone  (downscale then upscale = blur)
    p.append(label(380, 214, "3. DISTANCE  (RENDERED AT 12PX, SCALED UP 6X)"))
    p.append(f'<image href="logo/stampa-app-icon-48.png" x="380" y="230" width="120" height="120"/>')
    p.append(f'<image href="logo/stampa-mark-small-16.png" x="516" y="272" width="78" height="78"/>')
    p.append(t(380, 370, "silhouette survives; the S is still a letter", 11, INK3))

    # 4 confusion
    p.append(label(40, 410, "4. CONFUSION: BANK / GOV / LOTTERY / LOAN / DATING / OTP / STAMPA"))
    tiles = [
        ("#0B2A5B", "GT", "#D4A017"), ("#006B3C", "NG", WHITE),
        ("#E31E24", "WIN", "#FFD200"), ("#00C853", "N", WHITE),
        ("#FF4458", "*", WHITE), ("#1A73E8", "OTP", WHITE),
    ]
    xx = 40
    for bg, lab, fg in tiles:
        p.append(f'<rect x="{xx}" y="424" width="64" height="64" rx="14" fill="{bg}"/>')
        p.append(t(xx + 32, 466, lab, 22, fg, "700", SANS, "middle"))
        xx += 78
    p.append(f'<image href="logo/stampa-app-icon.svg" x="{xx+14}" y="424" width="64" height="64"/>')

    # 5 word of mouth / whatsapp arrival
    p.append(label(560, 410, "5. WORD OF MOUTH: HOW THE SUPPLIER ACTUALLY ARRIVES"))
    p.append(f'<rect x="560" y="424" width="360" height="150" rx="12" fill="#E8E2D8"/>')
    p.append(f'<rect x="574" y="438" width="300" height="76" rx="10" fill="{WHITE}"/>')
    p.append(t(588, 458, "Agbara Foods Plc  Procurement", 11, INK5, "600"))
    p.append(t(588, 478, "Please use this to send your invoice.", 12.5, INK))
    p.append(t(588, 496, "We cannot pay unstamped invoices.", 12.5, INK))
    p.append(f'<rect x="574" y="520" width="300" height="42" rx="10" fill="{WHITE}"/>')
    p.append(f'<image href="logo/stampa-avatar.svg" x="584" y="528" width="26" height="26"/>')
    p.append(t(618, 540, "stampa.ng/s/AGB-4471", 11.5, VIOLET, "500", MONO))
    p.append(t(618, 555, "Stampa - Get it stamped. Get paid.", 10.5, INK5))

    # 6 the object itself
    p.append(label(40, 620, "6. THE OBJECT: WHAT GETS FORWARDED"))
    p.append(invoice(40, 634))

    # 7 surfaces at a glance
    p.append(label(600, 620, "7. SURFACES"))
    p.append(f'<image href="logo/stampa-app-icon.svg" x="600" y="636" width="72" height="72"/>')
    p.append(t(600, 726, "app icon", 11, INK3))
    p.append(f'<rect x="690" y="636" width="120" height="72" rx="10" fill="{VIOLET}"/>')
    p.append(f'<image href="logo/stampa-lockup-stacked-reversed.svg" x="712" y="646" width="52" height="52"/>')
    p.append(t(690, 726, "splash", 11, INK3))
    p.append(f'<rect x="828" y="636" width="220" height="72" rx="10" fill="{WHITE}" stroke="{INK1}"/>')
    p.append(f'<image href="logo/stampa-mark-ink.svg" x="844" y="654" width="26" height="26"/>')
    p.append(t(878, 674, "Stampa", 16, INK, "600", track="-0.4"))
    p.append(chip(966, 660, "Live", GREEN, TOK["success"]["100"]))
    p.append(t(828, 726, "in-app header", 11, INK3))

    p.append(f'<rect x="600" y="746" width="448" height="120" rx="10" fill="{INK}"/>')
    p.append(f'<image href="logo/stampa-mark-paper.svg" x="620" y="764" width="26" height="26"/>')
    p.append(t(654, 784, "Stampa", 15, PAPER, "600", track="-0.4"))
    p.append(f'<circle cx="634" cy="828" r="22" fill="{VIOLET}"/>')
    p.append(t(636, 834, "IS", 14, PAPER, "600", SANS, "middle"))
    p.append(t(668, 824, "Ibrahim Sule", 14, PAPER, "600"))
    p.append(t(668, 840, "AGENT 0114  LAGOS MAINLAND", 10, INK3, "400", MONO))
    p.append(t(620, 858, "Stampa is free for suppliers. Never pay an agent.", 9.5, INK3))
    p.append(t(600, 884, "agent ID card", 11, INK3))

    return svg_doc(1100, 1040, "".join(p))


# ------------------------------------------------------------ application kit
def application_kit():
    p = []
    p.append(t(40, 44, "PHASE 11  APPLICATION KIT", 15, INK, "700", track="2"))

    # launcher
    p.append(label(40, 84, "APP ICON ON A REAL LAUNCHER"))
    p.append(f'<rect x="40" y="98" width="300" height="120" rx="14" fill="#2B2B33"/>')
    others = [("#1A73E8", "M"), ("#25D366", "W"), ("#0B2A5B", "GT"), ("#E31E24", "Y")]
    xx = 58
    for bg, lab in others:
        p.append(f'<rect x="{xx}" y="118" width="48" height="48" rx="11" fill="{bg}"/>')
        p.append(t(xx + 24, 150, lab, 18, WHITE, "700", SANS, "middle"))
        xx += 58
    p.append(f'<image href="logo/stampa-app-icon.svg" x="{xx}" y="118" width="48" height="48"/>')
    p.append(t(xx + 24, 184, "Stampa", 10, "#E8E8EE", "500", SANS, "middle"))

    # splash + first success screen
    p.append(label(380, 84, "SPLASH"))
    p.append(f'<rect x="380" y="98" width="180" height="330" rx="24" fill="{VIOLET}"/>')
    p.append(f'<image href="logo/stampa-lockup-stacked-reversed.svg" x="425" y="196" width="90" height="102"/>')
    p.append(t(470, 400, "Get it stamped. Get paid.", 11, "#CDBBE8", "400", SANS, "middle"))

    p.append(label(600, 84, "SESSION ONE"))
    body = "".join([
        f'<rect x="600" y="98" width="200" height="330" rx="24" fill="{PAPER}" stroke="{INK1}"/>',
        f'<rect x="600" y="98" width="200" height="56" rx="24" fill="{PAPER}"/>',
        f'<image href="logo/stampa-mark-ink.svg" x="618" y="118" width="22" height="22"/>',
        t(646, 135, "Stampa", 14, INK, "600", track="-0.3"),
        f'<rect x="616" y="170" width="168" height="196" rx="10" fill="{WHITE}" stroke="{INK1}"/>',
        f'<g transform="rotate(-4 700 216)"><rect x="632" y="186" width="136" height="60" rx="5" fill="none" stroke="{VIOLET}" stroke-width="1.6"/>',
        f'<image href="logo/stampa-mark-violet.svg" x="640" y="200" width="30" height="30"/>',
        t(678, 208, "STAMPED", 11.5, VIOLET, "700", track="1"),
        t(678, 222, "IRN-7K2M-88QX", 8.5, VIOLET, "500", MONO),
        t(678, 235, "14 SEP 10:42 WAT", 7.5, INK5, "400", MONO),
        "</g>",
        t(632, 272, "Agbara Foods Plc", 12.5, INK, "600"),
        t(632, 290, "NGN 1,850,075.00", 12.5, INK, "500", MONO),
        qr(722, 292, 46),
        t(632, 356, "Sent to your customer", 11, GREEN, "500"),
        f'<rect x="616" y="380" width="168" height="36" rx="10" fill="{VIOLET}"/>',
        t(700, 403, "Send on WhatsApp", 13, WHITE, "600", SANS, "middle"),
    ])
    p.append(body)

    # states
    p.append(label(840, 84, "STATES"))
    st = [
        ("Stamped", GREEN, TOK["success"]["100"], "Send it to your customer."),
        ("Waiting", AMBER, TOK["warning"]["100"], "Sending to NRS. About 20 seconds."),
        ("Not stamped", RED, TOK["danger"]["100"], "Customer TIN not recognised."),
        ("Offline", INK5, TOK["paper"]["sunken"], "Saved. We will send it later."),
    ]
    yy = 98
    for name, fg, bg, msg in st:
        p.append(f'<rect x="840" y="{yy}" width="220" height="62" rx="10" fill="{WHITE}" stroke="{INK1}"/>')
        p.append(chip(854, yy + 12, name, fg, bg))
        p.append(t(854, yy + 50, msg, 11.5, INK5))
        yy += 74

    # letterhead / one-pager
    p.append(label(40, 470, "PDF LETTERHEAD AND EMAIL HEADER"))
    p.append(f'<rect x="40" y="484" width="380" height="170" fill="{WHITE}" stroke="{INK1}"/>')
    p.append(f'<image href="logo/stampa-lockup-horizontal.svg" x="62" y="504" width="126" height="40"/>')
    p.append(f'<line x1="62" y1="548" x2="398" y2="548" stroke="{INK1}"/>')
    p.append(t(62, 574, "Stampa Technologies Limited", 11.5, INK, "600"))
    p.append(t(62, 590, "RC 8814402  .  12 Commercial Avenue, Yaba, Lagos", 10.5, INK5))
    p.append(t(62, 606, "hello@stampa.ng  .  0700-STAMPA  .  stampa.ng", 10.5, INK5))
    p.append(t(62, 636, "Get it stamped. Get paid.", 10.5, VIOLET, "600"))

    # store screenshot frame
    p.append(label(450, 470, "STORE SCREENSHOT FRAME"))
    p.append(f'<rect x="450" y="484" width="180" height="300" rx="12" fill="{VIOLET}"/>')
    p.append(t(540, 520, "One invoice.", 17, WHITE, "600", SANS, "middle"))
    p.append(t(540, 542, "Ninety seconds.", 17, WHITE, "600", SANS, "middle"))
    p.append(f'<rect x="474" y="562" width="132" height="196" rx="14" fill={chr(34)}{PAPER}{chr(34)}/>')
    p.append(f'<image href="logo/stampa-mark-ink.svg" x="488" y="578" width="18" height="18"/>')
    p.append(f'<rect x="488" y="608" width="104" height="90" rx="8" fill="{WHITE}" stroke="{INK1}"/>')
    p.append(f'<image href="logo/stampa-mark-violet.svg" x="498" y="622" width="24" height="24"/>')
    p.append(t(528, 638, "STAMPED", 9, VIOLET, "700", track="0.8"))
    p.append(t(528, 650, "IRN-7K2M-88QX", 6.5, VIOLET, "500", MONO))
    p.append(t(498, 682, "NGN 1,850,075.00", 9, INK, "500", MONO))
    p.append(f'<rect x="488" y="712" width="104" height="28" rx="8" fill="{VIOLET}"/>')
    p.append(t(540, 731, "Send", 11, WHITE, "600", SANS, "middle"))

    # empty + error style
    p.append(label(660, 470, "EMPTY STATE"))
    p.append(f'<rect x="660" y="484" width="180" height="140" rx="12" fill="{WHITE}" stroke="{INK1}"/>')
    p.append(t(684, 534, "No invoices yet.", 15, INK, "600"))
    p.append(t(684, 556, "Your first one takes", 12, INK5))
    p.append(t(684, 572, "about ninety seconds.", 12, INK5))
    p.append(f'<rect x="684" y="586" width="132" height="30" rx="8" fill="{VIOLET}"/>')
    p.append(t(750, 606, "New invoice", 12, WHITE, "600", SANS, "middle"))

    p.append(label(660, 654, "ERROR STYLE: WHAT / WHY / NEXT"))
    p.append(f'<rect x="660" y="668" width="180" height="120" rx="12" fill="{WHITE}" stroke="{INK1}"/>')
    p.append(chip(676, 682, "Not stamped", RED, TOK["danger"]["100"]))
    p.append(t(676, 730, "The NRS did not accept", 11.5, INK))
    p.append(t(676, 745, "the customer TIN.", 11.5, INK))
    p.append(t(676, 764, "Your invoice is saved.", 11, INK5))
    
    # verified-state language + privacy tone
    p.append(label(870, 470, "VERIFIED-STATE LANGUAGE"))
    p.append(f'<rect x="870" y="484" width="190" height="120" rx="12" fill="{VIOLET1}"/>')
    p.append(t(888, 512, "Stamped by the NRS", 13, VIOLET, "600"))
    p.append(t(888, 534, "Stampa did not issue this", 11, INK5))
    p.append(t(888, 549, "number. Anyone can check it", 11, INK5))
    p.append(t(888, 564, "at nrs.gov.ng.", 11, INK5))
    p.append(t(888, 588, "IRN-7K2M-88QX-2026", 10.5, VIOLET, "500", MONO))

    p.append(label(870, 654, "SUPPORT PERSONA"))
    p.append(f'<rect x="870" y="668" width="190" height="120" rx="12" fill="#E8E2D8"/>')
    p.append(f'<image href="logo/stampa-avatar.svg" x="884" y="682" width="24" height="24"/>')
    p.append(t(916, 698, "Stampa", 12, INK, "600"))
    p.append(t(916, 712, "Business account", 9.5, INK5))
    p.append(f'<rect x="884" y="724" width="162" height="50" rx="9" fill="{WHITE}"/>')
    p.append(t(896, 742, "I can see it. The TIN has one", 10.5, INK))
    p.append(t(896, 756, "digit missing. I fixed it -", 10.5, INK))
    p.append(t(896, 768, "try sending again.", 10.5, INK))

    return svg_doc(1100, 830, "".join(p))


if __name__ == "__main__":
    render("brand-tests", brand_tests(), 1100)
    render("application-kit", application_kit(), 1100)
    print("rendered brand-tests.png and application-kit.png")
