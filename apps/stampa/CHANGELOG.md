# Changelog

Nothing has shipped to a user yet, so there are no released versions. This is
the build log for P0 — what exists, in the order it came to exist, and what
each step was for.

## Unreleased — P0

- **Production cutover.** Demo doors and one-click fake sessions are gone. `/` is the public site. Production refuses `STAMPA_GATEWAY=fake`, `STAMPA_DEMO`, a missing Termii key, and a missing mailer. OTP goes out on Termii DND, then WhatsApp, then voice. Magic links go out through AgentMail (`stampa-support@agentmail.to`) or Resend. `PartnerGateway` talks to Interswitch SwitchTax. Support is 0816 509 6822. Store listing copy lives in `apps/stampa/stores/`; uploads need developer accounts this environment does not have.

### Foundations

- **Domain primitives.** Money as integer kobo end to end, TIN parsing and validation, Nigerian phone normalisation, deterministic PDF generation without a headless browser, ID generation.
- **Gateway.** One `transmit()` interface with three implementations: `fake`, `sandbox`, `partner`. Partner error codes mapped to a supplier/buyer/neither fault class, because the screen a supplier sees depends entirely on whose problem it is. `FakeGateway` fails on demand so every failure path is exercised rather than imagined.
- **Schema and access policy.** Drizzle over Postgres, append-only audit logging for anything touching money or identity, and a policy layer that decides what each actor may see before a query runs.
- **Auth.** Phone plus one-time code for suppliers, magic link for buyers and operators. No passwords anywhere. Codes are peppered before hashing.

### Supplier app (`/s`)

- Invite, phone, code, confirm pre-filled details, new invoice, review, send, outcome.
- The supplier types neither their own TIN nor their customer's. Both arrive from the buyer's vendor master. This is the claim the product is built on, and the walk asserts it on every run.
- Rejection screens per fault class, with a pre-filled Edit for anything they can fix themselves.
- Offline banner, invoice history with SQL-side search, account and deletion, help.

### Buyer console (`/c`)

- Magic-link sign-in, vendor-master upload with column mapping, input-VAT exposure report, invitations, inbound invoice list, supplier detail, settings.
- Uploaded files are parsed in memory and discarded. Nothing raw is written to disk or to the database.

### Operator console (`/ops`)

- Metrics against the north star, failure queue grouped by error code with retry state, audited lookup, TIN correction, flags, audit trail.
- Reads are audited before the record opens, not after.

### Notifications

- WhatsApp with SMS fallback, idempotent sends recorded in a `notifications` table so a retry cannot double-send and an operator can see what a supplier actually received. Day-three nudge for suppliers who opened an invite and stopped.

### Quality

- **238 tests** against a real Postgres via PGlite, not a mock.
- **Config contract.** Every environment variable declared with a schema and description in one place, validated at boot, with `.env.example` generated from it and a check that fails when the two drift.
- **Migrations as an explicit deploy step** in production; automatic on PGlite.
- **Copy discipline.** Every customer-facing string in one catalogue, with an automated check that fails the build on a literal in a governed component, on banned words, and on sentences over twenty words.
- **Browser walk.** All 37 screens driven in a real browser at two viewports, auditing headings, overflow, tap targets, labels, touching text runs, image sizing, WCAG AA contrast, keyboard operability and focus visibility — plus uncaught errors, hydration mismatches and any response at 400 or above.
- **Performance budget** measured against a production build: 159.5KB JS against a 180KB ceiling, first paint at 1.5s on an emulated weak 3G cell.

### Defects found and fixed during review

The walk and the eyeball pass found these. They are listed because a build log
that only records features is a sales document.

- Totals rendered as raw kobo in the buyer and operator consoles.
- A rejection screen promised an automatic retry after the retries were already exhausted.
- "Edit invoice" on a rejected invoice opened an empty form, losing everything the supplier had typed.
- The exposure report claimed the vendor list was uploaded today regardless of when it was actually uploaded.
- Error screens rendered their heading as a paragraph, so failure screens had no `h1`.
- "Call 0700-STAMPA" was an 18px tap target against a 48px floor.
- Text runs rendered flush against each other — "To" and a buyer name reading as one word.
- TINs were masked on buyer screens showing the buyer's own vendors, which is theatre, and unmasked in operator lookup results, which is backwards. Both corrected.
- Suppliers imported but never invited displayed as "draft", which misrepresented them.
- Font sizes were px, so browser text scaling did nothing. At 200% the invoice totals ran off the edge of a phone.
- `Skeleton` and `ListSkeleton` existed in the design system and nothing imported them, so every route opened on a blank frame on a slow connection.
- No `global-error` boundary, so a crash in the root layout fell through to Next's grey "Application error".

### Known gaps

- No real handset testing and no screen reader listened to. TalkBack on a cheap Android is the one that matters and it has not been done.
- The `partner` gateway has never spoken to a real accredited provider. Everything is proven against `fake` and the interface it implements.
- No field performance data, because there are no users.
