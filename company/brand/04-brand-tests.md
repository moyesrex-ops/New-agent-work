# Phase 10 — Brand Testing

Rendered, not asserted. The evidence is `brand-tests.png` and
`application-kit.png` in this directory, regenerable with
`python3 build_brand_sheets.py`.

Testing began during Phase 9 rather than after it, which is why two logo
directions never reached this chapter — the round-1 and round-2 renders killed
them first. Failures found here are listed with the fix and the retest.

## Test 1 — Shrink

Mark rendered at 48, 32, 24, 20 and 16px in pure black.

**Result: PASS, with a documented handover.** The full perforated mark holds to
24px. Below that the perforations mush into the field and it reads as a dark
blob with a light S. The simplified mark takes over at 24px and down and stays
crisp at 16.

**This was a failure in round 1** — the original mark was a single asset expected
to work everywhere, and it did not. Fixed with a two-tier system rather than by
compromising the primary mark, which would have cost the perforated silhouette
that makes it recognisable in the first place.

## Test 2 — Monochrome, receipt, 1-bit

Mark at 44px in pure black on newsprint grey, alongside IBM Plex Mono at 10–12px,
simulating a thermal-printed proof slip.

**Result: PASS.** The mark is entirely solid shapes and negative space with no
strokes below 7 units, which is exactly what survives a 203dpi thermal head.
Reference numbers in mono at 12px stay legible.

This test is the reason the round-1 "official seal" direction died. Its 2-unit
inner ring would have vanished, and a Nigerian supplier's proof of payment often
ends up on a thermal slip.

## Test 3 — Distance / stranger's phone

App icon rendered at 48px and the small mark at 16px, then scaled up to simulate
a glance across a market stall or a cracked screen.

**Result: PASS.** The perforated silhouette is the thing that survives — even
when the S softens, the outline still reads as a stamp. That is the intended
behaviour: recognition is carried by the shape, legibility by the letter.

## Test 4 — Confusion

The app icon placed beside six deliberately hostile neighbours: a Nigerian bank
tile, a government-portal tile, a lottery tile, a green loan-app tile, a dating
tile, and a blue OTP-page tile.

**Result: PASS on all six.**
- Not a bank: banks here are navy, burgundy or gold, with initials rather than a pictorial mark.
- Not a government portal: green is the tax authority's colour family, so it is banned from the palette. The mark is violet.
- Not a lottery: no bright red, no yellow, no exclamation, no starburst. We killed the name **Gbam** for exactly this reason after finding it is a licensed Nigerian lottery brand.
- Not a loan app: no gradient, no urgent green, no naira glyph.
- Not dating: no heart, no coral, no flame.
- Not an OTP page: no blue, no shield, no padlock.

## Test 5 — Cultural trust in Lagos

Assessed against the cultural notes in the brand strategy rather than by a
survey, and marked as such: this is **INFERRED**, not tested with users. The
honest limitation of this exercise is that no Lagos supplier has seen this mark.
The first item in the 90-day plan's research budget should be showing it to
twenty of them.

What the reasoning supports: the mark is an *official object*, and officialdom is
the trust currency in this market. It is violet, which is the ink colour of the
rubber stamp pads that sit on every counter in a Nigerian office. It is not
green, so it is not the tax collector. It is not gradient, so it is not a loan
app. It has no illustration, so it is not a donor programme.

What worries me: violet is also Kuda's colour family. Kuda is a licensed bank
with strong brand recognition. Our violet is deeper and desaturated and we never
pair it with a gradient, so the surfaces do not resemble each other — but a
one-second glance at a purple app icon could plausibly cue "Kuda." **Logged as an
open risk rather than resolved.** The mitigation available today is that our icon
is a *pictorial stamp on violet*, not a violet field with a wordmark.

## Test 6 — Word of mouth

The test the brief asks for is whether someone can transmit the brand verbally.
The relevant scenario is not two friends chatting; it is **how the supplier
actually arrives**, which the simulations established is a WhatsApp link from a
customer.

Rendered as a WhatsApp thread: the buyer's message, then the link preview showing
the avatar, `stampa.ng/s/AGB-4471`, and the tagline.

**Result: PASS with one weakness carried forward.** The preview does the work
that speech cannot — the name is *read*, not heard, at the decisive moment. That
substantially defuses the `/st/`-onset weakness identified in Phase 7, because
first contact is visual.

The weakness remains real for agent-led and market word-of-mouth acquisition,
where the name is spoken across noise. Mitigation stays as documented: the mark
is recognised visually, and the name is always said with the tagline.

## Test 7 — Surfaces

Twelve surfaces built and inspected: app icon on a launcher next to real
neighbours, splash, in-app header, first-success screen, four status states,
PDF letterhead, email header, store screenshot frame, empty state, error state,
verified-state language, support persona, agent ID card, thermal receipt, and
the stamped invoice itself.

### Failures found, and they were real

| # | Failure | Cause | Fix | Retest |
|---|---|---|---|---|
| F1 | The splash rendered the logo in ink on a violet field — effectively invisible | There was no reversed *stacked* lockup in the asset set. I had built a reversed horizontal lockup and assumed the stacked one existed | Added `stampa-lockup-stacked-reversed.svg` to the build script | PASS |
| F2 | On the letterhead, the lockup overlapped the company address block | `<image>` elements were given a width but no height, so the renderer used the intrinsic height and stretched the artwork | Every `<image>` now carries explicit width **and** height | PASS |
| F3 | On the first-success screen, the QR code overlapped the amount | Layout error in the mockup | Repositioned | PASS |
| F4 | Two section labels collided | Labels too long for their columns | Shortened | PASS |
| F5 | Circular avatar lost the perforated silhouette entirely | A square mark cropped to a circle discards the only distinctive part of it | Dedicated avatar variant: the S alone on a violet disc, documented as a permitted exception | PASS |

F2 is the one worth keeping in mind: it is exactly the class of bug — a logo
silently stretched out of proportion — that ships in real products because nobody
renders the surface and looks at it.

### The surface that matters most

The stamped invoice. It is what the supplier forwards, what the buyer's AP clerk
opens, and what anyone judging whether this is real will actually see.

Rendered, it reads as a document: hairline rules, tabular figures in mono,
aligned columns, no shadow, the violet stamp block pressed at an angle across the
lower left, and the QR at the lower right with *"Verify at nrs.gov.ng"* beneath
it. The line that does the most work is that last one — we point the reader at
the authority rather than at ourselves, which is the whole trust strategy
compressed into four words.

**Result: PASS.** This is the surface I would put in front of a Financial
Controller.

## Verdict

Seven tests. Five clean passes, one pass with a documented handover (shrink), one
pass with an unresolved open risk (violet adjacency to Kuda). Five surface
failures found and fixed, all retested.

**The identity is locked.** No colour, type, mark geometry or lockup changes from
this point without reopening Phase 9.
