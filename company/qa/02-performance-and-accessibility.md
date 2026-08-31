# P-01 / P-03 — Accessibility and performance, measured

**Measured:** 2026-08-31, against the production build (`next build` + `next start`), seeded database, Chromium.
Reproduce with `npm run budget` and `npm run walk` in `apps/stampa`.

Nothing in this document is an estimate. Every number below came out of a run
on this machine, and every check that produced it is committed so it can be run
again.

---

## P-03 — Performance budget

**The budget**, set in `company/engineering/01-architecture.md` §14: 180KB of
JavaScript and 40KB of CSS on the critical path, fonts off the critical path,
no images above the fold.

### Result: within budget on all three cold-open screens

| Screen | JS | CSS | Fonts | Images | HTML | Total | First paint\* | Interactive\* |
|---|---|---|---|---|---|---|---|---|
| Supplier invite (`/s/i/…`) | 159.5KB | 5.2KB | 34.1KB | 0 | 6.0KB | 207.6KB | **1.6s** | 1.5s |
| Supplier new invoice (`/s/new`) | 156.5KB | 4.5KB | 33.8KB | 0 | 9.2KB | 204.7KB | **1.5s** | 1.5s |
| Buyer sign in (`/c/signin`) | 152.4KB | 5.2KB | 34.1KB | 0 | 4.4KB | 196.7KB | **1.5s** | 1.5s |

\* Emulated weak 3G: 200kbps down, 400ms latency. Bytes are measured on the
wire with a cold HTTP cache and a fresh browser context per screen, because a
warm cache is exactly what hides an expensive first visit.

### Reading the numbers

**The screen paints in about 1.5 seconds on a cell that delivers 25KB/s,
even though the page carries 160KB of JavaScript.** That is the whole point of
the architecture: the HTML is 4–9KB, the CSS is 5KB, and neither waits on the
bundle. First paint needs roughly 11KB, which is a little over a third of a
second of that link's capacity. The JavaScript arrives afterwards and upgrades
a page that already reads.

**Fonts are not on the critical path.** 34KB of Archivo and IBM Plex Mono load
with `display: swap` and no preload, so the system stack renders first. On this
link, forcing a font preload would have cost more than a second before anything
appeared.

**No images above the fold on any screen.** The wordmark is inline SVG.

**The JS headroom is thin: 159.5KB against a 180KB ceiling, so 20KB spare.**
Nearly all of it is the framework baseline rather than product code, which
means the next client component added is the one that breaks the budget. The
check is scripted and exits non-zero, so it will say so.

### What is not measured

- No real-device measurement. The 3G figures are Chromium's emulation, not an actual handset on an actual Nigerian cell, and emulation does not model radio wake-up, packet loss, or a cold DNS.
- No field data. There are no users, so there is no p75 of anything.
- The measurement runs against a local server, so server time is unrealistically good. On a Lagos VM with a real Postgres this will be worse, and the interactive figure is the one that will move.

---

## P-01 — Accessibility

Every check below runs in the scripted walk across all 37 screens and fails the
run rather than printing a warning.

| WCAG criterion | How it is checked | Result |
|---|---|---|
| 1.4.3 Contrast (minimum) | Ratio computed from rendered colours, compositing alpha and walking past gradients to the surface actually behind the text; 4.5:1, or 3:1 for large text | Pass on all screens |
| 1.4.4 Resize text | `WALK_TEXT_SCALE=2` sets a 32px root and the full walk re-runs at 200% | Pass |
| 1.4.11 Non-text contrast | Focus ring `#4C2A85` against the three surfaces | 9.33:1 – 10.62:1, needs 3:1 |
| 1.4.12 Text spacing | Type scale is rem, line heights are unitless ratios | Pass |
| 2.1.1 Keyboard | Tab through each surface, assert every stop is reachable | 6 / 19 / 25 stops on supplier, buyer, operator |
| 2.4.7 Focus visible | Assert every tab stop draws an outline and stays on screen | Pass |
| 2.5.5 Target size | 48px floor on the supplier app, 40px in the consoles | Pass |
| 2.5.8 Target size (minimum) | Same check, stricter than the 24px AA floor | Pass |
| 3.3.2 Labels | Every form control has a label, `aria-label`, or `aria-labelledby` | Pass |
| 1.3.1 Info and relationships | Exactly one non-empty `h1` per screen | Pass |
| 2.3.3 Animation from interactions | `prefers-reduced-motion` honoured globally and in the sending animation | Pass |
| 4.1.3 Status messages | Route skeletons are `aria-busy` live regions; placeholders are `aria-hidden` | Pass |

### The checks were verified to fail

A check that has never failed is not evidence. Both new auditors were proven
against a deliberately broken build before being trusted:

- Lightening the muted grey from `#6B6675` to `#A9A5B0` produced `contrast 2.30:1 < 4.5` on every screen that uses it, with the correct surface identified in each case (paper, card, white).
- Replacing `outline: 2px solid var(--color-focus)` with `outline: none` produced a ringless report for every tab stop on every surface.

### Defects this audit found and fixed

| # | Defect | Fix |
|---|---|---|
| A-1 | Font sizes were px, so the browser text-size setting did nothing | Type scale converted to rem, line heights to unitless ratios |
| A-2 | At 200%, invoice subtotal, VAT and total ran off the right edge of a 360px phone | Amount rows wrap; the figure drops to its own line and stays right-aligned |
| A-3 | `Skeleton` and `ListSkeleton` existed in the design system and nothing imported them, so every route opened on a blank frame | `loading.tsx` for the supplier app and both consoles |
| A-4 | No `global-error` boundary: a crash in the root layout fell through to Next's grey "Application error" | `global-error.tsx` in brand voice, with the support number |
| A-5 | Error screens rendered their heading as `<p>`, so failure screens had no `h1` | `ErrorState` renders `h1`; `EmptyState` renders `h2` |
| A-6 | "Call 0700-STAMPA" was an 18px tap target on the help and invite screens | `shell.textLink` with a 48px minimum height |

### Known gap

Screen-reader behaviour is asserted structurally — roles, names, live regions,
heading order — but has not been listened to with NVDA, JAWS, VoiceOver or
TalkBack. Structural correctness is necessary and not sufficient; TalkBack on a
cheap Android is the one that matters here and it is not yet done.
