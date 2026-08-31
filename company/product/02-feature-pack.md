# Phase 13 — Feature Pack, Cuts, Information Architecture

Layers A–H, then a forced P0/P1/P2 ranking, then the cut list. Taste is visible
in what gets refused, so the cut list is the important half of this chapter.

## 13.1 Layer A — Arrival

| Feature | Rank |
|---|---|
| Buyer-branded invite landing page at `stampa.ng/s/<code>`, showing the buyer's registered name and why the supplier is here | **P0** |
| Phone + OTP sign-in. No email, no password, no BVN | **P0** |
| Pre-filled business identity from the buyer's vendor master — name, TIN, contact | **P0** |
| Buyer sign-in by work email + magic link | **P0** |
| Direct supplier signup without an invite | P1 |
| WhatsApp-native onboarding via the Cloud API | P1 |
| Agent-assisted onboarding mode with an agent code | P1 |

**The decision that defines the product:** the supplier never types his own TIN
or his customer's TIN. Both arrive from the buyer. Simulation 4 identified those
two fields as the wall that made the supplier-side candidate unbuildable, and
this is the fix.

## 13.2 Layer B — Core loop (60% of the craft, 3–7 excellent screens)

| Feature | Rank |
|---|---|
| New invoice: customer pre-selected, description, quantity, unit price | **P0** |
| Automatic 7.5% VAT calculation with a visible breakdown | **P0** |
| Default HS/service code inferred from the buyer's vendor category, editable | **P0** |
| Review screen showing exactly what will be sent | **P0** |
| Transmit to the NRS via the APP partner, poll for the IRN | **P0** |
| The stamp card: IRN, QR, amount, counterparty, timestamp | **P0** |
| Share to WhatsApp with a pre-written message | **P0** |
| Save-as-draft, automatic, on every field change | **P0** |
| Offline queue: compose offline, transmit when the network returns | **P0** |
| Multi-line invoices (more than one item) | P1 |
| Credit notes | P1 |
| Recurring invoices | P2 |
| Photograph a paper invoice and extract the fields | P2 |

**Why offline is P0 and not P1.** The user is standing in a workshop on 3G. An
invoicing tool that loses work on a dropped connection is not a tool, it is a
liability, and the second failure will lose the user permanently.

**Why multi-line is P1.** A single well-described line covers the large majority
of tail-vendor invoices, and multi-line doubles the form complexity for the
hardest user in the product. Ship one line, watch, then add.

## 13.3 Layer C — Trust and proof

| Feature | Rank |
|---|---|
| QR that verifies against the NRS, not against Stampa | **P0** |
| The disclaiming line on every stamped object: *"Stampa did not issue this number"* | **P0** |
| Bank details displayed read-only, sourced from the buyer, never editable by anyone in the app | **P0** |
| Anti-scam notice on first open and monthly: *"Stampa is free for suppliers"* | **P0** |
| Full invoice history with search | **P0** |
| PDF export of any stamped invoice | **P0** |
| Audit log on every identity and invoice action | **P0** |
| Public verification page at `stampa.ng/v/<irn>` that mirrors the NRS result | P1 |
| Supplier-initiated dispute on an invoice | P1 |

## 13.4 Layer D — Retention glue

| Feature | Rank |
|---|---|
| WhatsApp notification when an invoice is stamped, and when it fails | **P0** |
| Buyer-side nudge to suppliers who opened but did not finish | **P0** |
| Month-end reminder to the buyer three days before the VAT filing date | P1 |
| "Your customer viewed this invoice" read receipt | P1 |
| Supplier prompt to add a second customer after their third stamped invoice | P1 |
| Weekly digest email to the buyer | P1 |

## 13.5 Layer E — Money and named local rails

| Feature | Rank |
|---|---|
| Buyer plan and active-supplier count visible in the console | **P0** |
| Buyers invoiced offline by bank transfer in month 1 | **P0** (manual) |
| Paystack or Flutterwave card and transfer collection for buyer subscriptions | P1 |
| Direct debit via NIBSS for buyer subscriptions | P2 |
| Anything at all charged to a supplier | **NEVER** |

## 13.6 Layer F — Care and support

| Feature | Rank |
|---|---|
| Visible help on every screen: WhatsApp button and 0700-STAMPA | **P0** |
| Error copy that names what failed, why, and the next action | **P0** |
| Case number generated on any failed transmission | **P0** |
| Account deletion and full data export, self-serve | **P0** |
| In-app help articles | P1 |
| Pidgin, Yoruba, Igbo and Hausa interface translations | P1 |

**Account deletion is P0** because it is a legal requirement under the NDPA and
because a product that holds a small business's commercial history and makes
leaving hard is precisely the extractive behaviour the ethics constraints forbid.

## 13.7 Layer G — Operator console

| Feature | Rank |
|---|---|
| Buyer and supplier lookup by name, TIN, phone, IRN | **P0** |
| Transmission failure queue with error codes, grouped by cause | **P0** |
| Manual retry of a failed transmission | **P0** |
| Impersonate-to-view (read-only) for support, fully audit-logged | **P0** |
| Abuse and scam-report flags | **P0** |
| Live metrics: north-star count, completion rate, median time-to-IRN, active suppliers per buyer | **P0** |
| Manual TIN correction with an audit trail | **P0** |
| Bulk re-invite | P1 |
| Cohort retention charts | P1 |

The operator console is P0 in its entirety. Simulation 7 established that the
first two buyer deployments are concierge — the founders onboard the first
hundred suppliers per buyer by phone. Without this console, that is not
survivable, and "we will use the database" is how the first thousand users become
chaos.

## 13.8 Layer H — The polish that creates the $20k feel

| Feature | Rank |
|---|---|
| The stamp-press animation, once, at the moment the IRN returns | **P0** |
| Tabular figures everywhere a number appears | **P0** |
| Every empty, loading, error and success state designed, not defaulted | **P0** |
| Skeletons matched to the real content shape, never a spinner over a blank page | **P0** |
| Optimistic offline banner: *"Saved. We will send it when you are back online."* | **P0** |
| Thermal-safe printable proof slip | **P0** |
| Haptic tap on stamp success | P1 |
| Sound on stamp success, off by default | P1 |
| Dark mode | P2 |

## 13.9 The cut list — what is refused, and why

These are the things a worse version of this product would ship.

| Refused | Why |
|---|---|
| **Bookkeeping, stock, expenses, payroll** | This is the Kippa trap. It is the single most tempting adjacent feature set and it converts a painkiller into a vitamin |
| **A supplier subscription tier** | Breaks ethics constraint #1 permanently. There is no billing surface in the supplier app, which makes this hard to add by accident |
| **Invoice factoring in v1** | The Factoring Regulation Bill has not passed, and the brief forbids depending on a law that has not passed. Also CycleFlow already exists with IFC backing |
| **Supplier compliance scoring** | Would immediately become a tool for buyers to deselect small vendors, which is the exact harm this product exists to prevent |
| **An AI chatbot** | AI as perfume. There is no costly human bottleneck here that a chatbot compresses. The bottleneck is data the buyer already owns |
| **A native mobile app in v1** | The supplier arrives from a WhatsApp link. An install requirement between the link and the invoice would destroy the funnel that makes this candidate work |
| **ERP connectors** | A sales objection, not a product need. CSV covers every ERP that can export, which is all of them |
| **Multi-country** | Ghana and Kenya each need their own schema, their own accreditation and their own trust story |
| **A supplier directory** | A platform on day one. Forbidden |
| **Gamification, streaks, badges** | Emeka runs a business with a payroll |
| **Referral rewards for suppliers** | Creates exactly the "pay to register" scam surface the anti-scam copy exists to close |
| **Onboarding tutorial carousel** | If the primary action needs a tutorial, the screen is wrong |

**One genuinely hard cut.** Multi-line invoices are P1 and I am not fully
comfortable with it. Some tail vendors — the printer, the caterer — genuinely
invoice several items at once. The mitigation is that the description field
accepts free text and the total is what the NRS validates, so a two-item invoice
can be expressed as one line with a fuller description. If completion data shows
users fighting this in week two, it is the first P1 to be promoted.

## 13.10 Information architecture

### Supplier app — mobile web, one thumb

```
stampa.ng/s/<invite-code>          Invite landing (buyer-branded)
  |- /verify                        Phone + OTP
  |- /confirm                       Confirm your business  (pre-filled)
  '- /app
       |- /                         Invoices  (home)
       |- /new                      New invoice
       |     |- ?step=details
       |     '- ?step=review
       |- /i/<id>                   Invoice detail + stamp card
       |- /help                     Help
       '- /account                  Account, export, delete
```

Four levels maximum, no hamburger, no tab bar. Home is a list of invoices with a
single primary button. There is nowhere in this app to get lost, which is the
point.

### Buyer console — desktop web

```
stampa.ng/c
  |- /                              Overview: exposure, active suppliers, this month
  |- /upload                        Upload vendor master
  |- /exposure                      Exposure report  (the free wedge)
  |- /suppliers                     Supplier list, filterable by status
  |     '- /<id>                    Supplier detail, invite history, invoices
  |- /invoices                      Inbound stamped invoices, exportable
  |- /invite                        Invite composer
  '- /settings                      Company, team, plan
```

### Operator console — internal

```
stampa.ng/ops
  |- /                              Live metrics
  |- /failures                      Transmission failure queue
  |- /lookup                        Search across buyers, suppliers, invoices
  |- /flags                         Abuse and scam reports
  '- /audit                         Audit log
```

Separate route tree, separate authorisation, quieter visual treatment — but built
to the same tokens, never left over.
