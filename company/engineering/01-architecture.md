# Phase 16 — Technical Plan and Architecture Review

## 16.1 Stack

A boring stack, chosen against a $20,000 budget and a 6–10 week window.

| Layer | Choice | Why this and not the alternative |
|---|---|---|
| **Client + server** | **Next.js 15, App Router, TypeScript** | The supplier arrives from a WhatsApp link. An install step between the link and the invoice would destroy the funnel that makes this candidate work, so mobile web is not a compromise — it is the correct channel. Rejected Flutter/React Native for exactly that reason, and because they would mean a second surface for the console anyway |
| **UI** | Radix primitives + hand-built components on the locked tokens | Fourteen components (§15.1). Rejected a component library because "default theme soup" is a named failure mode and every such library has a recognisable default look |
| **Database** | **PostgreSQL 16**, managed, Lagos-hosted | Boring, relational, and the data is intensely relational. Rejected Firebase/Supabase-hosted because neither offers Nigerian data residency, which is a procurement blocker with a corporate buyer |
| **ORM** | Drizzle | Typed SQL, tiny runtime, migrations that read like SQL. Rejected Prisma for bundle size and its engine binary on a small VM |
| **Auth** | Custom phone + OTP (supplier), email magic link (buyer), both on signed HTTP-only cookies with rotating sessions | Rejected Auth0/Clerk: per-MAU pricing against a free supplier tier is a business-model mismatch, and neither is data-resident |
| **SMS / OTP** | **Termii** (primary), Africa's Talking (fallback) | Nigerian providers with DND-route handling, which matters — a large share of Nigerian numbers are on the DND list and generic international SMS silently fails to them |
| **WhatsApp** | **WhatsApp Cloud API** (Meta), Business verified | Notifications and the share flow. This is the channel the market actually lives in |
| **E-invoicing transmission** | **Accredited APP/SI partner REST API**, abstracted behind one adapter | See §16.7. This is the decision that keeps v1 inside budget |
| **Object storage** | S3-compatible, Lagos-resident (MinIO on the app host in v1) | PDFs of stamped invoices |
| **Hosting** | Single Lagos-hosted VM (Rack Centre CloudOnGround or Galaxy Backbone GxCP), Docker Compose, Caddy for TLS | Cheap, resident, boring. Reviewed and revised in §16.9 |
| **Errors / uptime** | Sentry, plus an external uptime check | |
| **Analytics** | Self-hosted PostHog, or plain event rows in Postgres | Cheaper and resident. Event volume at this scale is trivial |

**Deliberately not used:** Kubernetes, microservices, a queue broker, GraphQL, a
CDN for anything but static assets, an AI anything, and a mobile app.

## 16.2 Data model, in plain language

- **Organisation** — a buyer. Legal name, RC number, TIN, plan, active-supplier cap.
- **Supplier** — a small business. Business name, TIN, address, contact phone. A supplier exists once across the whole platform, no matter how many buyers know them. This is what makes the network effect mechanical rather than aspirational.
- **SupplierLink** — the relationship between one supplier and one buyer. Vendor code, category, bank name and last four digits, invited/opened/activated timestamps, status. Bank data lives here because it belongs to the buyer's vendor master, not to the supplier's identity.
- **Invitation** — code, channel, sent/opened timestamps. One per link, single-use for binding, re-openable afterwards.
- **Invoice** — supplier, buyer, invoice number, currency, subtotal, VAT, total, status, IRN, stamped timestamp. Amounts stored as **integer minor units (kobo)**, never floats.
- **InvoiceLine** — description, quantity, unit price, service code, VAT rate.
- **Transmission** — one row per attempt against an invoice: attempt number, idempotency key, request hash, response code, NRS error code, latency. The failure queue is a view over this table.
- **AuditEvent** — actor, action, subject type and id, before and after, IP, user agent, timestamp. Append-only.
- **Flag** — abuse or scam report against a supplier, an organisation or a phone number.
- **AnalyticsEvent** — name, actor, properties, timestamp.

**Amounts are integers in kobo. Everywhere. No exceptions.** A rounding
discrepancy in a VAT figure is a rejected invoice and an unpaid supplier.

## 16.3 Roles and permissions

| Role | Can |
|---|---|
| `supplier_owner` | Read and write their own supplier record and invoices. Read the SupplierLink but **never write bank fields**. Export and delete their own data |
| `buyer_admin` | Everything within their organisation: upload, invite, view suppliers and inbound invoices, manage team and plan |
| `buyer_member` | Read-only within their organisation, plus send invitations |
| `operator` | Read across all organisations. Write only: retry a transmission, correct a TIN, suspend an account, resolve a flag. **Every operator write is audit-logged with a required reason string** |

Enforced in one place — a server-side policy module consulted by every mutation.
Never in the client, never duplicated per route.

**The single most important permission in the system:** no role can write
`SupplierLink.bank_*`. Not the supplier, not the buyer admin, not an operator.
Bank data changes only through a fresh vendor-master upload, which is
audit-logged and diffed. This closes the payment-diversion attack identified in
Simulation 8, and it is enforced at the database layer with a column-level
revocation, not merely in application code.

## 16.4 Secrets and environments

Three environments: `local` (Docker Compose, seeded), `staging` (same VM,
separate database and separate APP-partner sandbox credentials), `production`.

`.env.example` is committed and complete. Real secrets live in the host's
environment and are never in the repository, never in a client bundle, and never
in an error message. Any variable that must reach the browser is prefixed
`NEXT_PUBLIC_` and reviewed line by line — the review checklist has an item for it.

Rotation: APP-partner and WhatsApp credentials quarterly, session signing key
annually or on any suspected compromise.

## 16.5 PII minimisation

What we hold: business name, TIN, business address, contact phone, invoice
contents, bank *name* and *last four digits*.

**What we deliberately do not hold, and this list is the design:**

- **No BVN. No NIN. No ID document images.** We are not a KYC platform and holding identity documents would make us a target while adding nothing to the job.
- **No full bank account numbers.** We display the last four for recognition and never need the rest, because we never move money. This is the cheapest large risk reduction available and it costs nothing.
- **No passwords.** OTP and magic links only.
- **No location, no contacts, no device identifiers beyond a session.**
- **No supplier credit or compliance scores.** Refused on ethical grounds in Phase 6 and therefore never modelled.

Retention: stamped invoices are tax records and are kept per statutory
requirement, unlinked from a deleted account. Everything else is hard-deleted 30
days after an account deletion request.

## 16.6 Audit logging

Every action that touches money or identity writes an `AuditEvent` in the same
transaction as the change. Non-negotiable list: supplier record created or
edited, bank fields changed by an upload, invoice created, transmitted, stamped
or rejected, invitation sent or opened, operator read of another org's data,
operator write of any kind, role change, account deletion.

The audit log is append-only. There is no delete path in the code.

## 16.7 The e-invoicing integration, and the decision that saves v1

Direct NRS accreditation as a System Integrator requires a ₦1m application fee
and ₦10m paid-up share capital, plus HSM-backed signing infrastructure. That is
roughly $7,000 in fees against a $20,000 total budget, before the hardware, and
the accreditation process is a schedule risk nobody can control.

**v1 transmits through an already-accredited APP/SI partner.** This removes the
capital requirement and the accreditation timeline from the critical path
entirely, and Simulation 10 identified partnering with an accredited provider as
the mitigation for the top competitive risk anyway — the same move solves both
problems.

Everything NRS-specific lives behind **one interface**:

```
EInvoiceGateway
  transmit(invoice, idempotencyKey) -> { irn, stampedAt, qrPayload } | GatewayError
  status(transmissionId)            -> Pending | Stamped | Rejected(code, message)
  verifyUrl(irn)                    -> string
```

Three implementations: `PartnerGateway` (production), `SandboxGateway`
(the partner's test environment), `FakeGateway` (deterministic, for tests and
local development, including scripted failure modes). Swapping to direct NRS
accreditation later replaces one file.

**Error codes are translated once**, in a single mapping table from partner and
NRS codes to the three copy variants in §14.3: supplier-fixable,
buyer-fixable, neither. An unmapped code falls through to the "neither" copy with
a case number and raises an operator alert — silence is never the fallback.

## 16.8 Bad-network posture

The user is on 3G in a workshop. This is the section that decides whether the
product is usable.

- **Offline outbox.** Drafts and completed invoices persist to IndexedDB before any network call. A service worker retries transmission with exponential backoff and jitter.
- **Idempotency everywhere.** Every transmission carries a client-generated key. The server deduplicates on it. **A duplicate invoice transmitted to the tax authority is a serious defect**, and this is the mechanism that prevents it.
- **Server-side resumption.** The transmission is a server-side job keyed to the invoice. Once submitted, the client can close, crash or lose power — the transmission completes and the WhatsApp notification arrives.
- **Optimistic, honest UI.** Saved locally means "Saved". Sent to the server means "Sending". Only an IRN means "Stamped". The three are never conflated.
- **Cache posture.** App shell and tokens cached on first load. Invoice list is stale-while-revalidate with a visible last-updated time. Amounts are never served from cache without that timestamp.
- **Payload budget.** 180KB JS and 40KB CSS on the critical path. Fonts are not render-blocking. No images above the fold.

## 16.9 ARCHITECTURE REVIEW

Conducted before tickets, as required. I am reviewing my own plan and the
findings changed it.

### What is overbuilt

| Finding | Action |
|---|---|
| **Self-hosted PostHog.** A second service, a second database and a second thing to patch, for an event volume of a few thousand rows a month | **CUT.** Analytics events go into a Postgres table and are queried with SQL. Revisit above ~1M events |
| **MinIO for object storage.** A whole S3 server to hold PDFs that are deterministically regenerable from invoice rows | **CUT.** PDFs are generated on demand and cached on disk. Removes a service, a set of credentials and a backup target |
| **Separate staging VM** | **CUT.** Staging is a second Compose stack on the same host with its own database. Saves roughly ₦35,000/month, and at this stage staging exists to test the partner sandbox, not to load-test |
| **A queue broker for retries** | **CUT.** Postgres `SELECT ... FOR UPDATE SKIP LOCKED` with a polling worker handles this volume comfortably. Adding Redis or a broker here is résumé architecture |
| **Multi-line invoices in the data model** | **KEPT.** The `InvoiceLine` table stays even though the UI is single-line in P0. Modelling it now costs nothing; retrofitting it later costs a migration on live tax records |

### Single points of failure

| SPOF | Assessment | Mitigation |
|---|---|---|
| **One VM hosting app, database and worker** | Real. A host failure takes everything down | Accepted for v1 with fewer than 20 buyers, **on three conditions**: nightly encrypted `pg_dump` shipped off-host, a documented and *rehearsed* restore under 30 minutes, and daily automated restore verification. An untested backup is not a backup |
| **The APP partner** | The most severe. If they go down, no invoice can be stamped | The gateway interface makes a second partner a config change rather than a rewrite. Commercially, sign one partner in v1 and a second before ten buyers. Product-side, a partner outage must degrade gracefully: the invoice is queued and the user is told the truth |
| **Termii for OTP** | Moderate | Africa's Talking configured as a fallback from day one, with automatic failover after two consecutive send failures |
| **WhatsApp Cloud API** | Moderate. Template rejections and number bans are common | SMS fallback for every notification. Never make WhatsApp the only path to a notification |
| **Founder-led sales** | Not a technical SPOF but the one that actually kills the company. Named in the risk register | |

### Data we should not be holding yet

- **Full bank account numbers.** Removed from the model in this review. Last four and bank name only.
- **Supplier email addresses.** Collected out of habit; nothing in P0 sends email to a supplier. **Cut.**
- **The buyer's complete vendor master.** We were about to store every uploaded column verbatim. **Revised:** parse, extract the eight fields we need, and discard the raw file after processing. Do not become the custodian of a corporate's full supplier database, because that is a much larger breach than anything else here and it buys us nothing.
- **Full invoice line descriptions in analytics events.** Commercially sensitive. Analytics stores amount buckets and status, never content.

### The integration most likely to slip

**The APP partner, and it is not close.** Specifically: sandbox access requiring a
signed commercial agreement first, undocumented schema fields discovered only on
rejection, error codes that do not match the published list, and rate limits
nobody mentions until you hit them.

**Mitigations, all scheduled into week 1:**
1. `FakeGateway` is built first, with scripted failure modes, so every downstream ticket can be built and tested without partner access.
2. Partner conversations start in week 1, before any code depends on them, and sandbox credentials are a week-2 gate.
3. The UBL 3.0 mapping is written against the published BIS Billing 3.0 schema, which the Nigerian format is based on, so the partner-specific delta is small.
4. **Contingency:** if no partner sandbox by week 4, the demo runs on `FakeGateway` with an explicit, honest label, and the P0 definition of done is amended in writing rather than quietly.

### Revisions carried into Phase 17

1. Analytics into Postgres. No PostHog.
2. No MinIO. PDFs generated on demand.
3. Staging as a second Compose stack, not a second host.
4. No queue broker. Postgres-backed job table.
5. Bank account numbers reduced to bank name plus last four, with a column-level write revocation.
6. Supplier email removed from the model.
7. Raw vendor-master files discarded after parsing.
8. `FakeGateway` promoted to the **first ticket in the build**, ahead of everything except tokens and the app shell.
9. Backup restore rehearsal added as an explicit P0 ticket with a named owner.

## 16.10 Analytics events, tied to the north-star

| Event | Fires when | Why it exists |
|---|---|---|
| `invite_opened` | Supplier opens the invite link | Top of the funnel we control least |
| `supplier_verified` | OTP accepted | |
| `supplier_confirmed_details` | Confirm-business completed | The step most likely to leak |
| `invoice_created` | Draft saved | |
| `invoice_transmitted` | Sent to the gateway | |
| **`supplier_invoice_irn_issued`** | **IRN returned** | **North star. The only event that means value existed** |
| `invoice_rejected` | Gateway returns a rejection | Property: fault = supplier / buyer / neither |
| `stamp_shared` | Share action completed | The forwarding loop |
| `supplier_added_second_buyer` | Supplier invoices a buyer who did not invite them | The network effect, measured rather than asserted |
| `buyer_exposure_computed` | Exposure report rendered | The wedge |
| `buyer_invites_sent` | Invitations dispatched | Property: count |
| `buyer_export_downloaded` | VAT register exported | Proxy for the monthly job being done |

No event carries an invoice description, a full TIN, or a phone number. Actor ids
are internal ids, never phone numbers.

## 16.11 What the founder still does manually in month 1

Named honestly, because pretending otherwise is how first deployments fail.

1. Every buyer contract, and the invoice for it, by hand.
2. The first ~100 supplier onboardings per buyer, by phone, in English, Pidgin, Yoruba, Igbo or Hausa.
3. Cleaning the buyer's vendor master before upload, because the first ones will be a mess.
4. Triaging the failure queue every morning and calling the affected suppliers.
5. All WhatsApp support, personally.
6. The relationship with the APP partner, including chasing their outages.
7. A weekly call with each buyer's Tax Manager for the first six weeks.

This is not a gap in the product. For the first 1,000 users it is the product,
and the operator console exists to make it survivable.
