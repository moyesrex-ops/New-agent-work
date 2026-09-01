# Phase 22 — Quality gate, and the handover pack

**Date:** 2026-08-31. **Subject:** Stampa, the decision and the P0 build.

This is the last document in the exercise and the first one a stranger should
read after `06-comparison.md`. It does two jobs. It answers the fifteen gate
questions the brief set, honestly enough that a hostile reviewer has something
to bite. Then it hands the thing over: what exists, what is load-bearing, what
must be done before a real Nigerian supplier is allowed to touch it, and what I
would attack first if I were the person picking this up tomorrow.

**Verdict up front: eleven clean passes, four qualified, no fails.** The four
qualified answers are all the same shape — *the mechanism is real and the
commercial proof is absent*, because nobody has paid for this and no invoice
has ever been transmitted to the actual Nigeria Revenue Service. That is the
honest position at the end of a paper exercise with a working build, and any
document that claimed otherwise would be lying.

---

## 22.1 The gate

### 1. Is the problem real, or merely interesting?

Real, dated, and enforced against somebody who is not the user of most
compliance software. Nigeria runs a clearance model: an invoice becomes a
legally valid tax invoice only when the NRS validates it and returns an Invoice
Reference Number and cryptographic stamp. Since **31 July 2026** large
taxpayers must *receive* only IRN-bearing invoices; medium taxpayers went live
1 July 2026. The invoice that arrives without an IRN is not a document with a
formatting problem — it is input VAT the buyer cannot recover and, in many AP
policies, a payment the buyer will not make.

The evidence that this is not a Nigerian curiosity is India, which ran the same
experiment three years earlier and produced the documented behaviour the whole
thesis rests on: *"the buyer's accounts payable team withholds payment or
demands rectification, placing commercial pressure on the small supplier that
the GST law, by itself, does not impose."*

**Pass.** Sources and dates in `01-method-and-sources.md` and `04-the-five.md`.

### 2. Who exactly hurts, and can they act?

Ify, Tax Manager at a ₦40bn-turnover FMCG manufacturer in Agbara. She has a
vendor master with 612 rows, TIN data for about 60% of them, two circulars that
went unread, and a Financial Controller who has asked her in writing what the
input-VAT exposure is. She has a budget, a deadline that has already passed,
and a career interest in the audit not blowing up.

That is the whole answer to the question most compliance startups get wrong.
The person in pain is not the person the market assumes. Emeka the fabricator
feels the pain second-hand, has no enforcement date until 2028, and — on
Kippa's evidence — will not pay. He is the user. She is the customer. The
product is built so those two facts never collide: **the supplier never pays,
permanently, as an ethics constraint rather than a launch promise.**

**Pass.**

### 3. Why now, and is the date verifiable?

31 July 2026 is a published NRS compliance milestone, not an industry
prediction. The window is narrow in the right direction: enforcement on the
buyer is live, enforcement on the small supplier is not until 2028, and that
two-year gap *is* the business. If both dates were live the tail would have its
own reason to self-serve and the buyer would not need us. If neither were live
there would be no product.

The gap is also the expiry date. This thesis is worth less every quarter after
2028, which is a good property in a why-now and a bad one in a five-year plan.

**Pass.**

### 4. Why do users arrive without advertising?

Two arrival paths, neither of which requires us to be persuasive. The buyer
arrives because a deadline passed and someone senior asked for a number. The
supplier arrives because his customer sent him a WhatsApp link and his money
depends on opening it. The invitation carries the buyer's authority, not ours,
which is also why the supplier's first screen shows the buyer's name before it
shows ours.

The qualification: **this is a two-step pull, and the first step is a
founder-led enterprise sale.** Nothing happens until a buyer sends invitations.
The supplier's pull is genuinely structural; the buyer's is a deadline plus a
cold email. The sensitivity table in `06-comparison.md` §5.3 says the same
thing in colder terms — C2 survives every external shock and dies to exactly
one internal failure, which is the team being unable to close a corporate.

**Qualified pass.** Structural for the user, conventional for the customer.

### 5. Is the wedge one job?

*Turn a small vendor's invoice into an IRN-bearing compliant invoice in under
two minutes on a cheap Android with bad network, using data the buyer already
has.* Plus the buyer console that makes the tail visible and inviteable.

The discipline held into the code. The supplier app has no dashboard, no
analytics, no chat, no ledger, no bookkeeping. The invoice form has four
fields, one of which is pre-filled from the buyer's vendor master. Everything
that was tempting is in `product/02-feature-pack.md` marked P1 or P2, and the
reason the wedge survived is that it was written down before there was code to
defend.

**Pass.**

### 6. Why does this survive contact with competitors — and with the state?

This is the weakest answer in the gate and it should be.

There are 61 accredited providers in Nigeria and at least four funded SME
invoicing apps. The defence is not technology; it is position. The accredited
providers sell ERP integration to the buyer's finance system and have no
interest in onboarding a caterer with a 4GB Android. The SME apps sell to the
supplier, who does not pay. Stampa sits in the seam: paid by the buyer, used by
the tail. The stated moat is workflow lock-in inside the buyer's AP process, an
accumulating verified-supplier graph, and NITDA System Integrator accreditation
at roughly $7,000 all-in — real, but none of it exists on day one.

The sharper threat is the state. Kenya's KRA already shipped buyer-initiated
invoicing itself, free, on eCitizen and `*222#` under TPA s.23A(3A). That is
not a hypothetical; it is a dated precedent for a government productising this
exact legal mechanic, and it is logged as risk #11 with the mitigation being to
compete on the workflow the state will not build — vendor-master
reconciliation, exposure reporting, Pidgin support, retry and evidence handling
— and never on the bare mechanic.

**Qualified pass.** The moat is a plan, not an asset.

### 7. Can it make money, and is the price defensible?

The hypothesis is ₦1,500–₦3,000 per active supplier per month with a ₦150k
monthly floor, priced against roughly ₦52m of stranded VAT on ₦400m of
purchases at a mid-size manufacturer. When the alternative is a number with
seven digits in it, a six-figure annual contract is not a close call, and the
buyer already spends more than that on the AP clerk currently chasing vendors
on WhatsApp.

What makes this only a qualified pass is that it is arithmetic, not a signed
contract. No Nigerian finance manager has been shown this price. The 90-day
plan's month-4 kill criterion exists precisely because willingness-to-pay is
the assumption most likely to be wrong, and the free Exposure Report is
designed to produce the buyer's own number before the price is ever mentioned.

**Qualified pass.**

### 8. What would have to be true for this to be wrong, and would I notice?

Six kill criteria, dated, in `06-comparison.md` §6.11. The two that would
actually fire: no paid contract and fewer than two pilots by month 4, and
supplier first-invoice completion below 35% at month 6 *despite* pre-filled
data — which would mean the product does not work for the user it was built
for. The metrics dictionary was written to make those visible rather than
flattering: the north star is `supplier_invoice_irn_issued`, not signups, and
"registered suppliers" is explicitly named as vanity because registration is
the buyer's action rather than the supplier's.

The uncomfortable one is #6: if buyers respond to a non-compliant tail by
dropping small vendors instead of onboarding them, the product's premise is
false and its social justification inverts. That is a real possible world and
it is written into the register rather than argued away.

**Pass.**

### 9. Is the brand a system or a logo?

A system, and it was tested rather than admired. Seven brand tests in
`brand/04-brand-tests.md`: five clean passes, one pass with a documented
handover (the perforated mark loses its perforation at small sizes, so a solid
variant ships and is specified), and one pass carrying an unresolved risk —
the violet sits close to Kuda's, in a market where Kuda is the more famous
brand. Five surface failures were found and fixed. The identity renders from a
committed build script, the tokens are the source the app compiles from, and
`npm run tokens:check` fails the build if a colour in the CSS ever drifts from
`design-tokens/tokens.json`.

The name survives the tests that matter for this user: pronounceable in
Nigerian English and Pidgin, spellable over a phone call to a support line, and
no unfortunate reading in Yoruba, Igbo or Hausa that I could find.

**Pass.**

### 10. Does the design work for the actual device and the actual hands?

Measured, not asserted. Every cold-open screen paints in about 1.5 seconds on
emulated weak 3G at 200kbps with 400ms latency, with 152–160KB of JavaScript
against a 180KB ceiling, because the HTML is 4–9KB and the CSS is 5KB and
neither waits on the bundle. Contrast, keyboard operability, focus visibility,
target size, labels, heading structure and reduced motion are all checked in
the scripted walk across 37 screens and fail the run rather than printing a
warning. The whole walk re-runs at 200% text scale.

Two gaps, both stated in `qa/02-performance-and-accessibility.md`: no real
handset on a real Nigerian cell, and no screen reader has ever been listened
to. Structural correctness is necessary and not sufficient, and TalkBack on a
cheap Android is the one that matters here.

**Pass**, with the gaps named.

### 11. Is it built, and does it do what the documents say?

It runs. 30 routes across three surfaces, 258 tests in 16 files against a real
Postgres, 383 governed copy strings, a production payload measured against a
production build. Money is integer kobo end to end and `kobo()` refuses a
non-integer at construction. Every partner error maps to supplier / buyer /
neither fault once, at the boundary, so four surfaces derive who-to-call from
one table.

The qualification is Phase 21's finding. Of twenty acceptance tests written
before any code existed, sixteen passed outright, **two described behaviour
that had never been implemented** — invite takeover and the 30-day hard delete
— and two are partial. Both unimplemented ones were critical and both are now
fixed with tests that were verified to fail without the fix. The lesson is in
the self review and it is not a flattering one: both defects were code that
described the right behaviour without performing it, and both read as correct.

**Qualified pass.** It does what the documents say *now*; it did not last week,
and only walking the acceptance list one line at a time caught the difference.

### 12. Is what was *not* built written down where it cannot be missed?

Yes, and this is the answer I would most want a reviewer to check, because it
is the cheapest place to have lied. The architecture claimed an offline outbox
with a service worker and an IndexedDB queue. None of it was built. There is an
offline *banner* driven by `navigator.onLine` and nothing behind it. Rather
than quietly dropping the acceptance test, D-06 carries the defect, the
architecture document carries a dated correction in place, and the honest v1
position is stated: composing offline is not supported and the banner says so.

The same rule was applied to the research record. A late stream proved an
earlier claim wrong — that buyer-initiated invoicing "is not productised
anywhere I could find" — and the correction sits next to the original claim in
`01-method-and-sources.md` §0.2 rather than replacing it.

**Pass.**

### 13. Is it safe, given the power asymmetry it sits inside?

The product stands between a large buyer and a small supplier, so the
constraints are structural rather than aspirational. Bank details are read-only
from the buyer's vendor master and cannot be written by anybody through any
path in the codebase, which closes the payment-diversion vector. No lending, no
supplier data sold to lenders, and no compliance score a buyer could use as a
delisting weapon. Analytics has a closed event list and a runtime guard that
throws if a property key or value looks like a phone number, a TIN or an
amount. Operator reads are logged and refused without a stated reason. Raw
uploaded vendor files are parsed in memory and never persisted.

Two honest holes. Bank immutability is enforced by policy and by the absence of
a write path, **not by a database constraint** — a future migration could undo
it, which is why D-05 is a launch blocker rather than a backlog item. And the
supplier's right to leave with their data is CSV plus per-invoice PDF, not the
ZIP of PDFs the acceptance test described.

**Qualified pass**, with one named launch blocker.

### 14. Could somebody else pick this up and run it?

That is what the rest of this document is for. The short version: the decision
and its reasoning are in one file, the build is one `npm install` away from
running with no database to install, `npm run verify` is a single gate that
covers tokens, environment, brand assets, copy, types, lint and tests, and
`npm run walk` drives all 37 screens in a real browser and audits each one.
There is a runbook for the support desk and a changelog that lists the defects
rather than hiding them.

**Pass.**

### 15. Would I back it?

Yes, with one condition and one reservation.

The condition is a seller. C2's only fatal risk is internal — the team failing
to close a corporate — and I would not fund this without somebody who has
personally sold a six-figure annual contract to a Nigerian manufacturer's
finance function. Everything else in the sensitivity table survives; that one
does not.

The reservation is the expiry date. The wedge is a two-year gap between the
buyer's enforcement and the supplier's, and month 12 of the plan asks for a
Ghana or Kenya pilot precisely because a thesis with a 2028 fuse needs to prove
transferability before the fuse burns down. If the twelve-month milestones land
— 20 paying buyers, ₦6m+ MRR, 4,000+ active suppliers, one second country —
this is a business. If month 4 arrives with no signed pilot, the kill criterion
should be honoured rather than renegotiated, which is the whole reason it was
written before anyone was emotionally invested.

**Pass.**

### Gate summary

| # | Question | Verdict |
|---|---|---|
| 1 | Problem real, not merely interesting | Pass |
| 2 | Who hurts, and can they act | Pass |
| 3 | Why now, verifiably | Pass |
| 4 | Arrival without advertising | Qualified — structural for the user, a cold sale for the customer |
| 5 | One-job wedge | Pass |
| 6 | Survives competitors and the state | Qualified — the moat is a plan, not an asset |
| 7 | Monetisation defensible | Qualified — arithmetic, not a signed contract |
| 8 | Falsifiable, with dated kill criteria | Pass |
| 9 | Brand is a tested system | Pass |
| 10 | Works on the real device | Pass, with no handset and no screen reader yet |
| 11 | Built, and matches its documents | Qualified — two acceptance tests had no code until Phase 21 |
| 12 | What is missing is written down | Pass |
| 13 | Safe given the power asymmetry | Qualified — one launch blocker at the database layer |
| 14 | Somebody else could run it | Pass |
| 15 | Would I back it | Pass, conditional on a seller |

---

## 22.2 The handover pack

### What exists

| Layer | Where | Size |
|---|---|---|
| Decision memo, phases 0–6 | `company/01…06-*.md` | 6 documents |
| Regional research behind Phase 1 | `research/` | 4 streams, primary sources dated and labelled |
| Brand system | `company/brand/`, `design-tokens/` | Naming, voice, identity, 7 tests, application kit, rendered assets |
| Product design | `company/product/` | Translation, feature pack, full UX package, visual finish |
| Engineering plan | `company/engineering/` | Architecture, build sequence, code review standard |
| Quality | `company/qa/` | Test plan written before the code, measured performance and accessibility, execution and defects |
| The build | `apps/stampa/` | 133 source files, ~17,200 lines, 30 routes, 258 tests |
| Operations | `apps/stampa/RUNBOOK.md`, `CHANGELOG.md` | Support desk procedure, defect record |

### The five files that carry the weight

1. `company/06-comparison.md` — the decision, the four candidates it beat, the sensitivity table, kill criteria, ethics, risk register, metrics dictionary. If only one file survives, this one.
2. `company/product/03-ux-package.md` — every screen, every state, every string's intent.
3. `company/engineering/01-architecture.md` — including the dated corrections about what was not built.
4. `company/qa/03-execution-and-defects.md` — the traceability matrix and the self review. The uncomfortable parts are the useful parts.
5. `apps/stampa/README.md` — how to run it, and the list of things the code is not allowed to do.

### Running it

```bash
cd apps/stampa && npm install && npm run seed && npm run dev
```

Open `/s/i/AGB-4471` for the supplier path. No database to install: local
development runs Postgres compiled to WebAssembly, in-process, which is also
what the tests run against, which is why the SQL under test is the SQL that
ships.

`npm run verify` is the gate — tokens, environment example, brand assets, copy
discipline, types, lint, 258 tests. `npm run walk` drives 37 screens in a real
browser at two viewports and audits each one; `WALK_TEXT_SCALE=2` re-runs the
whole thing at 200%. `npm run budget` measures the production payload on
emulated weak 3G. All three fail loudly rather than warning.

### Launch blockers — nothing real touches this until these are done

These are not backlog items. Each one is a way a real supplier gets hurt.

1. **Bank immutability at the database layer** (D-05). A trigger or a revoked column grant on the production instance. Policy plus the absence of a write path is not the same as a constraint, and this column is the fraud vector.
2. **The transmission path does not exist.** `PartnerGateway` is ticket C-08 and is unimplemented; `getGateway()` throws rather than falling back, deliberately, because silently issuing invented tax references to real suppliers is the worst failure this product could have. Requires a contract with an accredited APP/SI and sandbox credentials. Everything currently green ran against `FakeGateway`.
3. **No live messaging.** WhatsApp and SMS are fakes. Real delivery needs a WhatsApp BSP with approved templates, an SMS sender ID registered on the Nigerian DND route, and a mailer for the operator console's magic links — all of which have external lead times measured in weeks and none of which are code.
4. **Production Postgres, in Lagos, with migrations as an explicit deploy step** (`npm run migrate`), plus a backup and a rehearsed restore. The purge job (`npm run purge`) must be scheduled daily and monitored like a backup, because it is the only thing keeping the 30-day deletion promise the audit log makes.
5. **NDPA registration, a data processing agreement with each buyer, and terms.** The product holds supplier phone numbers and TINs on the buyer's instruction. That relationship needs paper before it needs users.
6. **One real handset on a real Nigerian network, and one TalkBack pass.** The performance and accessibility numbers are emulator numbers.

### The first fortnight for whoever picks this up

Do the commercial work before the engineering work, because the engineering
work is not what is uncertain.

- Build the named list. 220 in-scope entities, 150 named humans, from the `mbs.gov.ng` service-provider directory cross-referenced with MAN membership and listed manufacturers.
- Run the free Exposure Report against three real vendor masters. It works today, it needs no gateway, and it produces the buyer's own number rather than our pitch. If three finance managers will not hand over a vendor master, that is signal, and it arrives in two weeks rather than four months.
- Open the accredited-APP conversation from both ends at once: as a supplier of the transmission path, and as a white-label channel. Risk #2 and blocker #2 are the same phone call.
- Leave the code alone until one of those produces a reason to change it.

### Open decisions I deliberately did not make

- **Price.** A range and a floor, not a number. It should be set against a real buyer's own exposure figure, not chosen in advance.
- **Accreditation timing.** NITDA SI accreditation is in the moat and in the month-9 milestone, but whether to file before or after the first paid contract is a cash decision that depends on the runway of whoever is holding it.
- **Second country.** Ghana is the stated first expansion market on enforcement grounds; Kenya has more evidence and more competition. Month 12, on data, not now.
- **Multi-line invoices.** The schema supports them, the P0 UI does not, and `exportInvoicesCsv` has a bug that only bites when they arrive. It is named in the self review with its arrival date.

### What I would do differently

Write the acceptance tests first — that part worked — and then check them
against the code *continuously* rather than at the end. Both critical defects
survived weeks of tidy-looking code and died in ten minutes once somebody asked,
of each test in turn, which line proves this. That question is cheap enough to
be a standing gate and it was run once, late.

And I would have built the browser walk earlier. Every visual and accessibility
defect in the record came from driving a browser, not from an assertion. A unit
test cannot see a total running off the edge of a phone at 200% zoom, and a
person can see it instantly.
