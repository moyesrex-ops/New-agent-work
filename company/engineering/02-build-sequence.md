# Phase 17 — Build Sequence and Tickets

Eight weeks, a team of three: one full-stack lead, one product engineer, one
designer-who-codes at roughly half time. Budget check in §17.5.

The sequence follows the required order with one justified deviation, flagged
below.

## 17.1 Workstreams

| | Workstream | Owner |
|---|---|---|
| WS1 | Foundations: tokens, shell, routing, CI, environments | Lead |
| WS2 | Identity: supplier OTP, buyer magic link, sessions, policy module | Lead |
| WS3 | Core objects and the gateway | Lead |
| WS4 | Supplier first-success path | Product engineer |
| WS5 | Trust, proof, history, PDF | Product engineer |
| WS6 | Buyer console: upload, exposure, invite, list | Product engineer |
| WS7 | Notifications: WhatsApp and SMS | Lead |
| WS8 | Operator console | Lead |
| WS9 | Edge states, polish, accessibility | Designer-who-codes |
| WS10 | Launch wrapper: store-less web launch, PWA, analytics, docs | All |

## 17.2 Week by week

| Week | Goal | Exit condition |
|---|---|---|
| **1** | Foundations + `FakeGateway` | Tokens generate; app shell routes; CI runs lint, types and tests on every push; `FakeGateway` returns deterministic IRNs and scripted failures. **APP partner conversation opened.** |
| **2** | Identity and core objects | A supplier can sign in with a phone and an OTP; a buyer with a magic link; the policy module is the only authorisation path; schema migrated. **Partner sandbox credentials are the week-2 gate** |
| **3** | First success, end to end on `FakeGateway` | Invite link → OTP → confirm → invoice → stamped card, working on a real cheap Android over throttled 3G |
| **4** | Real gateway + offline | `PartnerGateway` transmits to the sandbox and returns real IRNs. Offline outbox works with airplane mode toggled mid-flight. **Contingency decision point if no sandbox** |
| **5** | Trust, proof, history, PDF | QR verifies against the NRS. PDF renders identically in Chrome, Adobe Reader and Gmail, and prints correctly in mono on A4. History searches. Export works |
| **6** | Buyer console | CSV upload with column mapping, exposure report, invite composer, supplier list with live statuses, inbound invoice export |
| **7** | Notifications + operator console | WhatsApp and SMS on stamped and rejected, with SMS fallback proven by disabling WhatsApp. Failure queue, lookup, retry, flags, metrics |
| **8** | Edge states, accessibility, QA, launch | Phase 18 suite executed. S1 and S2 defects cleared. Backup restore rehearsed. Analytics verified firing |

**Payments are not in this plan at all**, by design — buyers are invoiced offline
in month 1 (§14.1 Flow 5).

### The one deviation from the required order

The required order puts trust and receipts (5) after the first-success path (4),
and notifications (7) after payments (6). I have kept trust at 5 but pulled the
**anti-scam copy, the read-only bank display and the "Stampa did not issue this
number" line into week 3**, inside the first-success path.

**Justification:** those three are not receipt features, they are the mechanism
that gets a suspicious supplier through the first screen at all. Building the
first-success path without them would mean testing a funnel that is missing its
main obstacle, and the week-3 exit condition — a real supplier completing on a
real phone — would be measuring the wrong thing.

## 17.3 Definition of ready / definition of done

**Ready.** A ticket may not enter a sprint without: the screen and states it
implements from §14.2; the exact copy from §14.3, not paraphrased; the tokens it
uses; its acceptance test in Given/When/Then; its analytics event if any; and its
failure behaviour on a bad network.

**Done.** Implements the ticket and nothing extra. Empty, loading, error and
success states all built. Copy matches the deck exactly. Uses tokens, no magic
numbers. Tests written and passing. Works on a 3GB Android over throttled 3G.
Keyboard-operable and screen-reader-labelled. No new `NEXT_PUBLIC_` variable
without review. Analytics fires and was observed firing. Reviewed against Phase
19 with a verdict of ACCEPT. Changelog updated.

## 17.4 Tickets

### P0 — Foundations

| ID | Ticket | Depends on | Notes |
|---|---|---|---|
| F-01 | Repo, TypeScript, ESLint, Prettier, CI on push | — | |
| F-02 | Generate tokens from `tokens.json`; wire CSS variables | — | Build fails if `tokens.css` is stale relative to `tokens.json` |
| F-03 | App shell, three route trees (`/s`, `/c`, `/ops`), 404 and 500 pages | F-01 | Error pages in brand voice, not framework defaults |
| F-04 | Component set: the fourteen from §15.1 | F-02 | `ErrorState` requires an action prop by type, so a dead end will not compile |
| F-05 | Docker Compose: app, Postgres, Caddy. Local seed script | F-01 | |
| F-06 | `.env.example`, environment loading, secret-shape validation at boot | F-01 | App refuses to start with a missing or malformed secret |
| F-07 | **`FakeGateway`** with deterministic IRNs and scripted failures | F-01 | **First functional ticket. Everything downstream depends on it** |
| F-08 | Nightly `pg_dump`, off-host shipping, restore script, **rehearsed restore** | F-05 | Not done until a restore has actually been performed and timed |

### P0 — Identity

| ID | Ticket | Depends on |
|---|---|---|
| A-01 | Phone normalisation (`0803…` ↔ `+234803…`), validation | F-01 |
| A-02 | OTP issue, verify, rate-limit, lockout, resend, voice fallback | A-01 |
| A-03 | Termii adapter + Africa's Talking fallback with automatic failover | A-02 |
| A-04 | Buyer email magic link, work-domain check | F-01 |
| A-05 | Sessions: signed HTTP-only cookies, rotation, device binding | A-02, A-04 |
| A-06 | **Policy module**: single server-side authorisation path | A-05 |
| A-07 | Column-level revocation of write on `SupplierLink.bank_*` | A-06 |

### P0 — Core objects and gateway

| ID | Ticket | Depends on |
|---|---|---|
| C-01 | Schema and migrations for all ten tables | F-05 |
| C-02 | Money as integer kobo, with a `Money` type and formatting helpers | C-01 |
| C-03 | `EInvoiceGateway` interface and error-code mapping table | F-07 |
| C-04 | UBL/BIS 3.0 invoice mapper | C-01, C-03 |
| C-05 | Transmission job table, worker with `SKIP LOCKED`, backoff and jitter | C-01 |
| C-06 | Idempotency keys, server-side deduplication | C-05 |
| C-07 | `AuditEvent` writer, in-transaction, append-only | C-01 |
| C-08 | `PartnerGateway` against the sandbox | C-03 |

### P0 — Supplier first-success (WS4)

| ID | Ticket | Screens |
|---|---|---|
| S-01 | Invite landing, buyer-branded, invalid and expired states | S1 |
| S-02 | Phone entry and OTP screens | S2, S3 |
| S-03 | Confirm business, pre-filled, bank read-only with the fraud line | S4 |
| S-04 | New invoice details, VAT computation, autosave | S6 |
| S-05 | Review screen | S7 |
| S-06 | Sending screen, honest estimate, 60-second copy change | S8 |
| S-07 | **Stamped card, stamp-press animation, QR** | S9 |
| S-08 | Not-stamped, all three fault variants | S10 |
| S-09 | Offline banner and outbox | S11 |
| S-10 | Home list: empty, populated, long, cached | S5 |
| S-11 | Anti-scam notice on first open and monthly | all |

### P0 — Trust and proof (WS5)

| ID | Ticket |
|---|---|
| T-01 | Invoice detail and re-share |
| T-02 | PDF generation, thermal-safe printable slip |
| T-03 | Share to WhatsApp with pre-written text, plus SMS/copy/download fallbacks |
| T-04 | History search |
| T-05 | Account screen, full export as ZIP |
| T-06 | Account deletion: soft, 30-day hard, blocked while transmissions pend |

### P0 — Buyer console (WS6)

| ID | Ticket |
|---|---|
| B-01 | CSV/XLSX upload, parse, **discard the raw file after extraction** |
| B-02 | Column mapping with auto-detection, including TIN leading-zero recovery |
| B-03 | Exposure computation and report screen, with the methodology line |
| B-04 | Supplier list, filters, virtualisation past 200 rows |
| B-05 | Invite composer, buyer-branded message, batched send with per-recipient results |
| B-06 | Supplier detail and nudge |
| B-07 | Inbound invoices and CSV export |
| B-08 | Overview, settings, plan display |

### P0 — Notifications (WS7)

| ID | Ticket |
|---|---|
| N-01 | WhatsApp Cloud API adapter, templates submitted for approval **in week 1** |
| N-02 | SMS fallback on every notification path |
| N-03 | Stamped and rejected notifications with deep links |
| N-04 | Day-3 nudge to suppliers who opened but did not finish |

### P0 — Operator console (WS8)

| ID | Ticket |
|---|---|
| O-01 | Failure queue grouped by error code, with retry and bulk retry |
| O-02 | Lookup across buyers, suppliers, invoices, IRNs |
| O-03 | Read-only record view, audit-logged, with a required reason |
| O-04 | TIN correction with an audit trail |
| O-05 | Flags: raise, suspend, dismiss |
| O-06 | Live metrics including the north-star counter |

### P0 — Polish and launch (WS9, WS10)

| ID | Ticket |
|---|---|
| P-01 | Every empty, loading, error state from §14.2 audited against the build |
| P-02 | Accessibility pass: focus, labels, live regions, 200% text scale |
| P-03 | Performance budget enforced in CI: 180KB JS, 40KB CSS |
| P-04 | PWA manifest, icons, installable, offline shell |
| P-05 | Analytics events verified firing, with no PII in properties |
| P-06 | README, runbook, changelog, incident-lite one-pager |

### P1 — after P0 ships, not before

Multi-line invoices · public verification page · disputes · direct supplier
signup · agent-assisted mode · Pidgin and Yoruba translations · Paystack for
buyer subscriptions · month-end reminders · in-app help articles · bulk re-invite
· cohort charts · haptics and sound.

### P2 — not in v1

Recurring invoices · photograph-a-paper-invoice · credit notes · NIBSS direct
debit · dark mode · ERP connectors · Ghana and Kenya.

## 17.5 Budget check

| Line | % | Amount | What it buys |
|---|---|---|---|
| Product definition and UX writing | 12% | $2,400 | Already produced: §12–14, including a complete copy deck |
| UI system, screens, states | 22% | $4,400 | 14 components, 31 screens, ~68 designed surfaces |
| Customer-facing build | 32% | $6,400 | WS4, WS5, WS6 |
| Backend, auth, data, integrations | 22% | $4,400 | WS2, WS3, WS7, gateway, jobs, audit |
| QA, launch, analytics, operator console | 12% | $2,400 | WS8, WS9, WS10, Phase 18 execution |
| **Total** | **100%** | **$20,000** | |

Running costs are outside the build budget and are small: Lagos VM and managed
Postgres roughly ₦60,000–₦120,000/month, SMS at ₦3.50–₦4.50 per message,
WhatsApp conversation fees, Sentry free tier. Call it ₦150,000–₦250,000/month at
launch scale.

**What is not in the budget and must be said plainly:** the APP partner's
commercial terms, NITDA SI accreditation if pursued later (~$7,000), legal
review of the buyer contract, and any of the founders' time on sales. The
$20,000 buys the product. It does not buy the company.
