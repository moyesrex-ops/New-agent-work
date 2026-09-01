# Phase 9 — Logo and Identity System

Everything in this chapter was drawn, rendered and inspected, not described. The
exploration sheets are in `logo/explorations/`, the production assets are in
`logo/`, and `logo/build_logo.py` regenerates every file deterministically.

## 9.1 How the mark was arrived at

Three rounds. I rendered each round to PNG at real sizes and looked at it, which
is the only way to find out that an idea is wrong.

**Round 1** — four directions: an official seal, a folded document corner, a
perforated stamp, and a pressed ink block.

*What the render showed, and it killed two of them:*
- The **official seal** lost its rings below 40px and became a black blob. Fine
  rings and a 16px requirement are incompatible.
- The **folded corner** disappeared entirely when reversed — at small sizes it is
  just a blank page silhouette with no information in it.
- The knockouts were not real knockouts. I had painted the S in paper colour on
  top of the shape, so on a dark surface the S vanished. Fixed with proper masks
  in round 2.

**Round 2** — perforated stamp (upright and pressed), a pressed block with a
stencil-broken S, and a round notched seal.

*What the render showed:*
- The **round notched seal read as a gear.** Not "official document", "settings".
  Killed immediately.
- The **stencil break read as damage**, not as a stencil. It looked like a
  rendering fault rather than an intentional industrial letterform. Killed.
- The **perforated silhouette was the winner** — nothing else in Nigerian fintech
  has that outline, and it says "stamp" before you have read a single word.

**Round 3** — settled the press angle and the small-size problem.
- **0°** reads static and generic, like any app icon.
- **8°** is lively standalone but visibly wobbles against the wordmark baseline in
  the horizontal lockup.
- **5°** is intentional without being sloppy. **Locked.**
- The perforations mush below 24px, so a **simplified variant** drops them for
  favicons, notification icons and dense list rows. This is a documented two-tier
  system, not an inconsistency.

A separate stroke-weight test settled the S at radius 13.5, stroke 14.0 — heavier
than my first attempt, which looked spindly against Archivo's sturdy lowercase,
and lighter than 17.0, which closed the counters at 28px.

## 9.2 The mark

A postage-stamp silhouette, pressed at 5° off square, with a geometric S knocked
out of it.

**What it means, in one sentence:** it is the stamp that makes a piece of paper
real, applied by a human hand rather than by a machine.

**Why this mark and not another:** the brand's most-seen surface is not the app,
it is a stamped invoice sitting in a WhatsApp thread. So the mark is designed
backwards from ink, thermal paper, 1-bit printing and a 400px preview card. A
fintech mark is designed for a card and a balance; ours is designed for a seal on
paper, and that is the mechanical reason it cannot be swapped with a generic
fintech logo.

### Construction

Drawn in a 120×120 box.

| Element | Specification |
|---|---|
| Field | Rounded rectangle, x/y 6, 108×108, corner radius 8 |
| Perforations | 12 circles, radius 7.5, centred on the field edge at 24, 60 and 96 along each side; subtracted from the field |
| S | Two half-turns of radius 13.5, stroke 14.0, butt caps, knocked out of the field. Endpoints at (72.89, 46.70) and (47.11, 73.30) |
| Press | Whole mark rotated −5° about the centre (60, 60) |
| Optical note | The S very nearly touches the perforated edge. This is deliberate — real rubber stamps fill their die. Do not add margin. |

### The family

| Asset | File | Use |
|---|---|---|
| Primary mark | `stampa-mark-ink.svg`, `-violet`, `-paper` | Everything at 24px and above |
| Simplified mark | `stampa-mark-small.svg` | 16–24px, favicon, Android notification icon, dense table rows |
| Wordmark | `stampa-wordmark.svg` | Where the mark is already present nearby |
| Horizontal lockup | `stampa-lockup-horizontal.svg` + `-reversed` | Default. App header, letterhead, email, one-pager |
| Stacked lockup | `stampa-lockup-stacked.svg` | Splash, square social, agent ID card, narrow columns |
| App icon | `stampa-app-icon.svg` (1024 master) | Stores and launchers. Paper stamp on a violet field |
| Avatar | `stampa-avatar.svg` | Circular contexts only — WhatsApp, social, support |
| Favicon | `stampa-favicon.svg` | Browser tab |

**Why the avatar drops the stamp shape.** A square mark cropped to a circle loses
the perforated silhouette, which is the only distinctive thing about it. Circular
contexts therefore get the S alone on a violet disc. Deliberate, tested, documented.

### Clear space and minimum sizes

- **Clear space** on all sides equals the perforation diameter — 15 units in the
  120 box, i.e. 12.5% of the mark's height. Nothing enters it. Ever.
- **Minimum sizes:** primary mark 24px; simplified mark 16px; horizontal lockup
  88px wide; stacked lockup 56px wide; app icon 32px.
- Below 16px, use no mark at all. A smudge is worse than an absence.

### When never to add ornaments

Never add: a drop shadow, a gradient, an outline, a glow, a container the mark
does not already have, a tagline locked into the mark, a country flag, a partner
logo inside the clear space, a "verified" tick, or a second colour inside the
mark. The mark is one colour on one background. It is a stamp, and stamps are one
colour because they are made of ink.

The mark is **never** rotated to any angle other than its built-in −5°. The press
angle is part of the artwork, not a layout property. Do not straighten it, and do
not tilt it further "for energy."

## 9.3 Colour

The system's central rule, and it comes straight from the product:

> **Colour is loud only where a document becomes official. Everywhere else it stays quiet.**

Stampa's screens are paper and ink. Violet appears when something has been
stamped. That is the whole discipline, and it means the interface has almost no
colour in it until the user succeeds — at which point the success is unmissable.

### Tokens

| Token | Hex | Use |
|---|---|---|
| `paper` | `#FBF9F4` | Default app surface. Warm off-white, not grey, not pure white |
| `paper.raised` | `#FFFFFF` | Cards, documents, anything that represents a piece of paper |
| `paper.sunken` | `#F3F0E9` | Input wells, disabled fields |
| `ink.900` | `#14121A` | Primary text, the mark, the wordmark |
| `ink.700` | `#3A3543` | Secondary text |
| `ink.500` | `#6B6675` | Tertiary text, labels, captions |
| `ink.300` | `#9A94A5` | Placeholder, disabled text |
| `ink.100` | `#E3DED4` | Hairlines, dividers, borders |
| `stamp.700` | `#4C2A85` | **The brand accent.** The stamped state, the primary button, the mark |
| `stamp.900` | `#33195E` | Pressed state of the primary button |
| `stamp.100` | `#EDE7F6` | Stamped-state background wash, selected rows |
| `success.700` | `#17604A` | Paid, confirmed, delivered. Deep and muted |
| `success.100` | `#E3F0EA` | |
| `warning.700` | `#8A5A00` | Waiting on the NRS, action needed |
| `warning.100` | `#FBF0DC` | |
| `danger.700` | `#A32020` | Rejected, failed, destructive |
| `danger.100` | `#FBE6E6` | |
| `focus` | `#4C2A85` | 2px outline, 2px offset, never removed |

### Where colour may be loud, and where it must stay quiet

**Loud (violet at full strength):** the stamped state, the primary button, the
mark, the stamp block on a document, the success screen after an IRN returns.

**Quiet (ink and paper only):** every list, every form, every header, every
settings screen, the whole operator console except its status chips. If a screen
has no stamped object on it, it has no violet on it beyond the primary button.

### Colours that are banned, and why

| Banned | Reason |
|---|---|
| Any gradient, anywhere | Reads as a loan app or a crypto product in this market. There is not one gradient in the system |
| Bright green (`#00C853` family) | Nigerian digital-lending palette. Also the tax authority's colour family |
| Teal + purple duotone | The generic global SaaS default. Explicitly forbidden by the brief and rightly |
| Red as a brand colour | Reserved entirely for danger. It is never decorative |
| Pure black `#000000` on screen | Harsh on cheap AMOLED panels. `ink.900` only. Pure black is permitted **only** in 1-bit thermal printing |
| Pure white `#FFFFFF` as the app background | Reserved for objects that represent paper, so that documents read as documents |

### Contrast, verified

`ink.900` on `paper` = 15.8:1. `ink.500` on `paper` = 5.1:1. `paper` on
`stamp.700` = 9.6:1. `stamp.700` on `paper` = 9.2:1. All exceed WCAG AA for body
text; the first three exceed AAA. **No status is ever communicated by colour
alone** — every state chip carries an icon and a word.

## 9.4 Typography

| Role | Family | Why |
|---|---|---|
| Display, headings, UI, wordmark | **Archivo** (SIL OFL, Omnibus-Type) | A sturdy grotesque with slightly condensed proportions and a printed, institutional feel. Legible at small sizes on cheap Android. Critically, it is **not Inter** — Inter is the default-theme-soup the brief bans |
| Numerals, references, amounts, code | **IBM Plex Mono** (SIL OFL) | An IRN is a reference number and reference numbers belong in mono. Tabular figures make amounts align in a column, which is what makes a document look like a document |

Both are open-source, which matters on a $20,000 budget, and both cover the Latin
Extended range needed for Yoruba and Igbo diacritics.

### Scale

Modular, 1.25 ratio, base 16.

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `display` | 32 / 38 | 600 | One per screen, at most |
| `title` | 24 / 30 | 600 | Screen titles |
| `heading` | 20 / 26 | 600 | Section headings |
| `body-lg` | 18 / 26 | 400 | Primary reading text in the supplier app |
| `body` | 16 / 24 | 400 | Default |
| `label` | 14 / 20 | 500 | Field labels, buttons |
| `caption` | 13 / 18 | 400 | Help text, timestamps |
| `micro` | 11 / 14 | 500, tracking +0.8 | Uppercase eyebrow labels only |
| `mono` | 14 / 20 | 500, tabular | IRN, TIN, amounts, case numbers |
| `mono-lg` | 20 / 26 | 500, tabular | Invoice totals |

**Base size is 16, not 14.** The beachhead user is often over 40, reading in
sunlight, one-handed, on a cracked screen. Body text in the supplier app is 18.

Wordmark tracking is −34/1000 at a cap height of 64. Never set the wordmark
manually — use the outlined asset.

## 9.5 Space, radius, elevation, stroke, grid

**Spacing** — 4px base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Nothing off-scale.
Screen gutter 20 on mobile, 32 on the console.

**Radius** — `sm` 6 (chips, inputs), `md` 10 (cards, buttons), `lg` 16 (sheets,
modals), `full` 999 (avatars only). The mark's own 8 is artwork, not a token.

**Elevation** — three levels and no more. `flat` (nothing — the default),
`raised` `0 1px 2px rgba(20,18,26,.06), 0 0 0 1px #E3DED4` for cards, `overlay`
`0 8px 24px rgba(20,18,26,.12)` for sheets and modals. **Documents get a
hairline border, never a shadow**, because paper on a desk does not glow.

**Stroke** — 1px hairlines in `ink.100`. Emphasis rules are 1.5px in `ink.900`.
Icon strokes are 1.75px at 24px.

**Grid** — 4px baseline. Console is 12-column, 1200 max, 24 gutter. Mobile is a
single column; anything that wants two columns on a 360px screen is wrong.

**Touch targets** — 48×48 minimum, 56 for the primary action. One-thumb reach
means the primary action is always in the bottom third of the screen.

## 9.6 Icons

**Lucide**, 24px, 1.75px stroke, round joins, single weight. One pack, no
exceptions — the brief's "mixed icon packs" tell is a real one and it is usually
what makes a cheap app look cheap.

Six icons carry meaning and are never substituted: the mark for *stamped*, a
clock for *waiting*, a triangle-alert for *rejected*, a check for *paid*, a
paper-plane for *sent*, a wifi-off for *offline, saved*.

Never use: emoji as icons, filled and outlined styles in the same view, a second
icon pack for "just this one," or an icon without a text label on any status.

## 9.7 Illustration and photography

**No illustration.** Not one. Illustrated empty states are the single fastest way
to make a compliance product feel like a toy, and the isometric-person-at-a-laptop
style is the exact "generic global SaaS" the brand must never resemble. Empty
states are typographic: a line of text and a primary action.

**Photography, if used at all:** real documents, real hands, real workshops,
real light, shot in Lagos. No stock. No smiling-trader-with-phone. No people in
suits. If there is no budget for real photography — and at $20,000 there is not —
then there is no photography, and the brand is stronger for it.

## 9.8 Motion

Small, fast, purposeful. 150ms for state changes, 200ms for sheet entry, 240ms
for page transitions, all on `cubic-bezier(.2,0,0,1)`.

**One signature motion, and only one:** when an IRN returns, the stamp block
presses onto the document — scaling from 1.06 to 1.00 with a 4° settle over
220ms, once. It is the visual echo of a hand pressing a rubber stamp. It happens
at the single most important moment in the product and nowhere else.

Everything else: no parallax, no confetti, no skeleton shimmer that runs longer
than the request, no animated illustrations, no bouncing. `prefers-reduced-motion`
disables the stamp press and shows the final state directly.

## 9.9 Sound

One sound, optional, off by default, and only on the supplier app: a short
low-frequency press when an IRN returns. Rationale — the supplier is often in a
noisy workshop holding the phone at arm's length, and an audible confirmation is
genuinely useful there. It is 120ms, it is not a jingle, and there is no other
sound in the product.

## 9.10 Ten brand dos

1. Let the paper breathe. White space is the cheapest way to look expensive.
2. Put the reference number in mono, always, everywhere.
3. Make the document look like a document — hairlines, aligned columns, tabular figures.
4. Show status as a word plus an icon plus a colour, in that order of importance.
5. Keep the press angle. It is the one detail competitors will not bother to copy.
6. Write the failure before you write the success.
7. Use one primary button per screen and put it where a thumb is.
8. Let violet mean exactly one thing: this is stamped.
9. Print-test everything that a supplier might print. Thermal paper is a real device.
10. When in doubt, remove something.

## 9.11 Ten brand don'ts

1. **No teal circle-arrow.** No gradient tile. No abstract swoosh. If the mark could belong to a payments startup in any country, it has failed.
2. No illustration of a person, ever.
3. No exclamation marks in transactional copy.
4. No emoji on a receipt, an invoice, a status or an error.
5. No drop shadow on anything that represents paper.
6. No second typeface. Archivo and IBM Plex Mono, and nothing else.
7. No colour-only status.
8. No stock photography.
9. No marketing surface inside the supplier app. No banners, no upsells, no "invite friends."
10. No straightening the mark, no re-tilting it, and no putting it inside a circle other than the documented avatar.
