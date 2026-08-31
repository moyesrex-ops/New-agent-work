# Phase 15 — Visual Finish

Every customer-facing screen specified through the locked brand. No orphan
styles, no second personality in settings, no leftover operator console.

## 15.1 The component set

Fourteen components carry all 31 screens. That number is a budget decision and a
quality decision at once — a small set built well beats a large set built
approximately.

| Component | Specification |
|---|---|
| `Button` | `md` radius 10. Primary: `stamp.700` fill, `paper.raised` text, 56px tall in the supplier app, 40px in the console. Pressed: `stamp.900`, no scale transform. Secondary: transparent, `ink.900` text, `ink.100` 1px border. Destructive: `danger.700` text on transparent, filled only inside a confirm dialog. Disabled buttons are never used without adjacent text saying what is missing |
| `Field` | Label 14/500 `ink.700` above, input 18/400 in a `paper.sunken` well, radius 6, 1px `ink.100`, 52px tall. Focus: 2px `stamp.700` outline at 2px offset. Error: 1px `danger.700` border plus a 13px message below. Never a red field with no explanation |
| `AmountField` | Same, but IBM Plex Mono, tabular, right-aligned, `NGN` prefix as a static adornment in `ink.500`. Thousands separators inserted while typing |
| `StatusChip` | 26px, radius 6, tinted background at the `-100` token, dot plus label at 12.5/600 in the `-700` token. Six only: Stamped, Waiting, Not stamped, Offline, Draft, Disputed |
| `Card` | `paper.raised`, radius 10, `raised` elevation. The default container everywhere |
| `DocumentCard` | `paper.raised`, radius 8, **hairline border and no shadow**. Reserved for objects that represent paper. The distinction between `Card` and `DocumentCard` is the whole visual thesis |
| `StampBlock` | The signature object. 1.8px `stamp.700` border, radius 6, pressed at −4°, containing the mark at 40px, `STAMPED` in 15/700 tracked +1.4, the IRN in mono 11/500, and the timestamp in mono 9.5 `ink.500` |
| `ListRow` | 72px tall, hairline separator, counterparty in 15/600, amount in mono 14 right-aligned, `StatusChip` beneath. Whole row is one tap target |
| `EmptyState` | Heading 15/600, one or two lines of 12/400 `ink.500`, primary button. No illustration, ever |
| `ErrorState` | `StatusChip` at the top, then what / why / next, then the reassurance line. Structurally impossible to render without a next action, because the component requires an action prop |
| `Skeleton` | `paper.sunken` blocks matched to the real content shape. A 1.4s pulse. Never a spinner over a blank page |
| `Sheet` | Bottom sheet on mobile, centred dialog on desktop. `lg` radius 16, `overlay` elevation, scrim `rgba(20,18,26,.45)` |
| `Banner` | Full-width, tinted, one line, one optional action. Used for offline and stale-data only |
| `DataTable` | Console only. 44px rows, hairline separators, sticky header, mono for all numeric columns, virtualised past 200 rows |

## 15.2 Screen-by-screen finish notes

**S1 Invite landing.** The buyer's legal name is the largest text on the screen at
24/600 — larger than "Stampa". This is deliberate: the authority being borrowed is
theirs. Stampa's mark sits at 26px in the header, subordinate. The free-for-suppliers
line is 16/600 in `success.700` above the fold. One button, bottom third.

**S4 Confirm business.** Rendered as a `DocumentCard`, because it is a record, not
a form. Fields are display rows with a small `Edit` affordance, not open inputs —
the user is confirming, not filling. The bank row has a lock glyph, `paper.sunken`
background, and the fraud-protection sentence in 12/400 `ink.500` directly beneath
it, not in a tooltip.

**S6 New invoice.** One `Field` per line, generous 20px gutters, the VAT breakdown
as a quiet two-row summary in `ink.500` with the total in `mono-lg` `ink.900`. The
customer row is locked and styled as a chip, not a disabled select — a disabled
control reads as broken, a chip reads as decided.

**S8 Sending.** The most under-designed screen in most products and one of the most
important here. Centred, generous white space, a determinate-feeling progress bar
(not a spinner), the honest estimate, and the permission-to-leave line in
`ink.500`. At 60 seconds the copy changes and the bar switches to indeterminate —
honesty about not knowing beats a fake progress bar that reaches 99% and stops.

**S9 Stamped.** The hero. `DocumentCard` filling the viewport width minus gutters.
Order top to bottom: `StampBlock` pressed across the upper area, counterparty,
amount in `mono-lg`, IRN, timestamp, QR at 62px, then the disclaiming sentence in
12/400 `ink.500`, then the primary button. The stamp press animation runs once:
scale 1.06 → 1.00 with the 4° settle over 220ms. Nothing else on the screen moves.

**S10 Not stamped.** Same `DocumentCard` frame as S9, so the user recognises where
they are — the failure is not a different place, it is the same document in a
different state. `StatusChip` in danger, then what / why / next, then the
reassurance. The offending value is shown in mono so it can be read aloud on the
phone to support.

**B5 Exposure report.** Built to be screenshotted. The number is `display` 32/600
in `ink.900` — not violet, because it is bad news, and colouring bad news in the
brand accent would be tone-deaf. The methodology line sits directly beneath in
12/400 `ink.500`, because a number a Financial Controller cannot source is a number
they will not forward. The uncheckable-vendor caveat is in the same block, not
hidden.

**Console generally.** Denser: 40px buttons, 44px table rows, 32px gutters, 16px
base. Same tokens, same components, quieter. The console has *less* colour than the
supplier app, not more — the only accent is the primary button and the status chips.

**Operator console.** Same components again, `paper.sunken` page background instead
of `paper` so it is visibly a different context, and a persistent `ink.900` bar
across the top reading `OPERATOR — actions are logged`. It is quieter, never
leftover: the failure queue uses the same `DataTable` and the same `StatusChip` as
the buyer console.

## 15.3 The confirmation screens must look official enough to screenshot

Three things make S9 and the PDF read as documents rather than as app screens:

1. **Hairlines, not shadows.** Paper on a desk does not glow.
2. **Tabular figures in mono, right-aligned, with a rule above the total.** This
   is what makes a table of numbers read as an account rather than as a list.
3. **A reference number rendered in monospace.** An IRN in a proportional font
   looks like marketing copy. In mono it looks like a record.

## 15.4 Cheap tells — checked against the brief's list

| Tell | Status |
|---|---|
| Lorem ipsum | None. The copy deck in §14.3 is complete and final |
| Default theme soup | Archivo, not Inter. Hand-built components on Radix primitives, not a component library's defaults |
| 14-field signup before value | Two fields before value: phone, then a 6-digit code. The invoice form appears third |
| Hamburger dumping ground | No hamburger anywhere. Four routes in the supplier app |
| Mixed icon packs | Lucide only, one weight, 1.75px |
| Fake scarcity, fake reviews, fake activity | None. The seed-data plan in the handover pack explicitly forbids fake-active production data |
| Unfinished admin beside a loud marketing surface | The operator console is P0 in full and built from the same tokens |
| Dark patterns | Deletion is two taps and one typed word, with no retention offer |
| Tutorial required to understand the primary action | No onboarding carousel exists. If a screen needs one, the screen is wrong |

## 15.5 The eight-second feel bar

What a stranger sees in the first eight seconds of the invite landing:

Confident type at a real size. One violet element on the screen and it is the
button. A named, recognisable company at the top — theirs, not ours. A sentence
saying it is free. Enormous amounts of white space. No illustration, no gradient,
no badge, no carousel, no cookie banner fighting for the same corner.

The intended reaction is not "this is beautiful." It is **"this is real."**
