# Phase 11 — Application Kit

Rendered in `application-kit.png`. Every surface below is built from the locked
tokens in `/design-tokens` and the locked assets in `logo/`.

The test this chapter has to pass: **the company must be recognisable outside the
app.** Most of what a Stampa user sees is not the app — it is a WhatsApp link, a
PDF, a printed slip, and a stranger's phone screen.

| Surface | Specification |
|---|---|
| **App icon** | 1024 master. Paper-coloured stamp, full bleed at 84% of the tile, on `stamp.700`. Light-on-dark chosen over dark-on-light after seeing it beside real launcher neighbours — it is the more visible of the two among a screen of saturated icons. Android adaptive: same artwork on a solid `stamp.700` background layer, mark inside the 66dp safe zone. |
| **Splash** | Solid `stamp.700`, stacked reversed lockup optically centred, tagline in `stamp.100` at the lower third. No spinner, no progress bar, no version number. Maximum 800ms; if the app is not ready, go to the screen anyway and let it fill in. |
| **In-app header** | `paper.raised`, hairline bottom border, mark at 26px, wordmark at 16/600, status chip on the right. Height 56. The header never carries navigation — the primary action lives in the thumb zone. |
| **Store screenshot frame** | `stamp.700` field, two lines of Archivo 600 white headline at the top, device screen inset with a 14px radius. Six frames, script in the handover pack. No device bezels, no floating hands, no "as seen in" badges. |
| **Social avatar** | The circular avatar asset. Cover images are `stamp.700` with the reversed horizontal lockup left-aligned at one-eighth width, and nothing else — no stock photography, no feature copy. |
| **Receipt / proof slip** | Thermal-safe. Pure black on white, 1-bit, mark at 40–44px, everything else IBM Plex Mono. Order: mark and STAMPA, IRN, counterparty, amount, timestamp, then `Verify at nrs.gov.ng`. Nothing decorative — every line on a thermal slip costs paper. |
| **Invoice / PDF letterhead** | `paper.raised` at A4. Horizontal lockup top-left at 126×40, hairline rule beneath, company legal block in 11.5/600 and 10.5/400: *Stampa Technologies Limited, RC 8814402, 12 Commercial Avenue, Yaba, Lagos*, contact line, then the tagline in `stamp.700`. The stamp block presses at −4° across the lower left; the QR sits lower right. |
| **Email header** | The same letterhead block at 600px width, on `paper`. Plain-text-first HTML — no hero images, no buttons wider than 240px, no tracking pixels in transactional mail. |
| **Support WhatsApp persona** | Display name **Stampa**, Official Business Account verification, avatar asset, business hours 8am–8pm WAT stated in the profile. Replies in the language the message arrived in. Never uses a first name that is not a real person's. |
| **Company one-pager** | Single column, 640px measure. Stacked lockup, one sentence of what it is, the exposure number, three proof points, one contact line. No team photos, no market-size triangle, no logo wall. |
| **Empty state** | Typographic only. A heading in 15/600, one or two lines of 12/400 `ink.500`, and the primary action. No illustration — this is a standing rule, not a budget compromise. |
| **Error state** | The what / why / next structure from the voice charter, with a status chip at the top. The reassurance sentence — *"Your invoice is saved"* — is mandatory on any error that occurs after the user has entered data. |
| **Verified state** | `stamp.100` wash, `stamp.700` heading, and the disclaiming sentence in `ink.500`: *"Stampa did not issue this number. Anyone can check it at nrs.gov.ng."* This is the single most important piece of copy in the product and it appears on every stamped object. |
| **Agent ID card** | `ink.900` field, reversed mark and wordmark, agent photo disc, name in 14/600, `AGENT 0114 LAGOS MAINLAND` in mono 10, and the anti-scam line at the foot: *"Stampa is free for suppliers. Never pay an agent."* Printed on the card the agent shows, because that is where the warning is actually needed. |
| **Privacy / terms tone** | Grade-8 English, short sections, a one-screen summary at the top saying what we hold and what we never hold, and a plain statement that the supplier can export and delete everything. No defined-terms glossary before the first plain sentence. |

## The rule that holds the kit together

Every surface answers the supplier's real first question — *is this a scam?* — in
the same four ways: an official-looking object, a reference number in mono, a
verification route that does not go through us, and a visible way to reach a
human. A surface that cannot do at least two of those four is not finished.
