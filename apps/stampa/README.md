# Stampa

Get a small Nigerian supplier's invoice an NRS reference number, in about
ninety seconds, on a cheap Android phone with bad network — using data the
buyer already has.

Three surfaces, one codebase:

| Path | Who | What it is for |
|---|---|---|
| `/s` | Supplier | Accept an invite, confirm pre-filled details, issue an invoice, see whether it was stamped |
| `/c` | Buyer | Upload the vendor master, see input-VAT exposure, invite the tail, watch invoices arrive |
| `/ops` | Us | Failure queue, lookup, flags, audit trail |

The decision behind the product is in `company/06-comparison.md`. The
architecture and the reasoning for each choice is in
`company/engineering/01-architecture.md`. This file is only how to run it.

---

## Run it

```bash
npm install
npm run seed     # embedded Postgres, demo buyer, six suppliers, real invoice history
npm run dev
```

Then open the seeded supplier invite: <http://localhost:3000/s/i/AGB-4471>.

No database to install. `DATABASE_URL` defaults to `pglite://./.data/dev`,
which is Postgres compiled to WebAssembly running in-process. Production uses
the same SQL against a managed Postgres, so nothing in the app knows which one
it is talking to.

### Signing in locally

There are no passwords anywhere in the product.

- **Supplier** — phone plus a six-digit code. The code is not sent anywhere in development; it is printed to the server log as `[dev] OTP for +234…: 123456`.
- **Buyer and operator** — magic link by email. The link is printed to the server log the same way.

Seeded credentials: supplier `08030000001`, buyer
`tax.manager@agbarafoods.com`, operator whatever you put in
`STAMPA_OPERATORS`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run seed` | Fresh demo data: one buyer, six suppliers at every onboarding stage, stamped and rejected invoice history |
| `npm run migrate` | Apply SQL migrations. Automatic on PGlite, an explicit deploy step in production |
| `npm run verify` | The gate: tokens, env example, assets, copy discipline, types, lint, 238 tests |
| `npm run walk` | Drive all 37 screens in a real browser and audit each one |
| `npm run budget` | Build for production and measure the first-load payload |
| `npm run tokens` | Regenerate `src/styles/tokens.css` and `tokens.ts` from `design-tokens/tokens.json` |
| `npm run env:example` | Regenerate `.env.example` from the schema in `src/lib/env.ts` |

`npm run verify` is the one to run before committing. It is the same set of
checks that has to pass for the work to be considered done.

### The walk

`npm run walk` seeds a database, starts the app, and drives all three surfaces
in Chromium at 360×740 and 1366×768. On every screen it asserts: exactly one
non-empty `h1`, nothing wider than the viewport, tap targets at or above the
floor, every form control labelled, no text runs rendering flush against each
other, no image without intrinsic size, and WCAG AA contrast computed from the
rendered colours. It also watches for uncaught errors, hydration mismatches and
any response at 400 or above. Screenshots land in `.walk/`.

```bash
npm run walk                      # the standard run
WALK_TEXT_SCALE=2 npm run walk    # everything again at 200% browser text size
```

It has found real defects that the unit tests could not see — a total running
off the edge of a phone at 200% text, an error screen with no heading, a
promise of a retry that was never coming. Run it after any UI change.

---

## Configuration

Every variable is declared with a schema and a description in
`src/lib/env.ts`, validated at boot from `instrumentation.ts`, and
`.env.example` is generated from it. `npm run env:check` fails if the two drift
apart. The short version:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | `pglite://` locally, `postgres://` in production |
| `APP_URL` | Absolute origin. Every WhatsApp and SMS deep link is built from it |
| `OTP_PEPPER` | Peppers one-time codes before hashing. `openssl rand -base64 32` |
| `STAMPA_GATEWAY` | `fake`, `sandbox` or `partner` |
| `STAMPA_OPERATORS` | Comma-separated emails allowed into `/ops`. Empty means nobody, which is the right default |
| `APP_PARTNER_*` | Accredited partner credentials, read only when the gateway is not `fake` |

The app refuses to boot in production if a required variable is missing. That
is deliberate: a half-configured deployment that starts is worse than one that
does not.

---

## The gateway

We are not accredited, and getting accredited was not going to happen inside
the v1 budget or timeline. Transmission goes through an accredited APP/SI
partner, behind one interface:

```ts
transmit(invoice, idempotencyKey) -> { irn, stampedAt, qrPayload } | GatewayError
```

Three implementations: `fake` (deterministic, used by every test and the walk),
`sandbox`, and `partner`. Swapping providers — or becoming our own provider
once accredited — is one module.

`FakeGateway` fails on demand so the failure paths are exercised rather than
imagined. Put a trigger string in an invoice description and it rejects with
that class of error: supplier fault, buyer fault, an unmapped partner code, or
NRS being down. See `FAKE_TRIGGERS` in `src/lib/gateway`.

Rejections are classified by fault, because the screen a supplier sees depends
entirely on whose problem it is. Something they can fix reads differently from
something their customer must fix, which reads differently again from an outage
that is nobody's fault.

---

## What the code will not do

These are constraints, not conventions, and the tests enforce them.

- **Bank details are read-only everywhere.** Not editable by the supplier, not editable by the buyer, not editable by us. This closes the payment-diversion attack and it is the reason the walk asserts no bank input exists on any screen.
- **No BVN, no NIN, no full account numbers.** Last four digits only.
- **Uploaded vendor-master files are never written to disk or to the database.** Parsed in memory, mapped, discarded.
- **Analytics events carry no identifiers.** The scrubber rejects `phone`, `tin`, `email`, `name`, `address` and friends as string values; a boolean derived from one is allowed.
- **Money is integer minor units.** Kobo, everywhere, all the way to the database. No floats.
- **Every user-facing string lives in `src/lib/copy.ts`.** `npm run copy:check` fails the build on a literal in a customer-facing component, on banned words, and on sentences over twenty words.
- **Audit logging is append-only** for anything touching money or identity.

---

## Measurement

North-star event: `supplier_invoice_irn_issued` — a supplier who was not
previously compliant transmits an invoice that receives a valid IRN, to a buyer
on the platform. Not signups, not invoices created. The IRN is the moment value
exists, because it is the moment the buyer can deduct and the supplier can be
paid.

The full event list is `AnalyticsEventName` in `src/lib/analytics.ts`.

---

## Layout

```
src/
  app/            Routes. /s supplier, /c buyer, /ops operator
  components/     Shared UI, CSS modules, design-token driven
  lib/
    copy.ts       Every user-facing string
    db/           Drizzle schema and client
    gateway/      E-invoicing transmission, fault classification
    services/     Business logic: invoices, buyer, operator, onboarding, seed
    env.ts        Environment schema, the source of .env.example
  tests/          Vitest, against a real PGlite database
scripts/          seed, migrate, walk, budget, token and asset builders
drizzle/          SQL migrations, applied in filename order
```
