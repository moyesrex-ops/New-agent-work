# Phase 21 — Test plan executed, defect log, self code review

**Run:** 2026-08-31, against the P0 build at `apps/stampa`.
**Automated suite:** 258 tests, 16 files, against a real Postgres via PGlite.
**Browser walk:** 37 screens at two viewports, plus a 200% text-scale pass.
**Payload:** measured against a production build.

The point of this phase was not to run the suite and report green. It was to
take the twenty acceptance tests written in Phase 18, before any code existed,
and ask of each one whether code actually exists behind it. Two did not, and
both were defects rather than omissions.

---

## 21.1 Acceptance test traceability

| # | Acceptance test | Covered by | Status |
|---|---|---|---|
| AT-01 | Invite binding | `auth.test.ts` — invite landing, binding a verified phone | Pass |
| AT-02 | Invite reuse by a second number | `auth.test.ts` — "once an invitation has been claimed" | **Was unimplemented. Fixed, see D-01** |
| AT-03 | Pre-filled identity, supplier types no TIN | `auth.test.ts` confirm; walk asserts a non-blank TIN on S4 every run | Pass |
| AT-04 | Bank immutability from any path | `policy.test.ts` bank fence, `auth.test.ts` smuggling attempt, `buyer.test.ts` audit; walk asserts no bank input exists on any screen | Pass at the policy layer. **Not enforced by a database constraint** — see D-05 |
| AT-05 | VAT computation, no floats | `vat.test.ts` worked example, `money.test.ts` float round trip | Pass |
| AT-06 | Successful transmission | `invoices.test.ts` — stamped, IRN stored, north star fires | Pass |
| AT-07 | Idempotency | `invoices.test.ts`, `gateway.test.ts` | Pass |
| AT-08 | Supplier-fixable rejection | `invoices.test.ts`, `copy.test.ts` | Pass |
| AT-09 | Buyer-fixable rejection | `invoices.test.ts`, `copy.test.ts`, `notify.test.ts` | Pass |
| AT-10 | Unmapped error code | `gateway.test.ts` never falls silent; `invoices.test.ts` flags for the operator; `operator.test.ts` sorts unmapped to the top | Pass |
| AT-11 | Offline compose and send | — | **Not implemented. See D-06** |
| AT-12 | Cross-supplier access refused | `policy.test.ts`, `invoices.test.ts` scoping | Pass on refusal. **The 404-not-403 disclosure rule is not asserted** — see D-07 |
| AT-13 | Exposure computation | `buyer.test.ts` — uncheckable rows, spend provenance, load date | Pass |
| AT-14 | Raw upload discarded | `vendor-master.test.ts` parses from memory; no filesystem write exists in the path | Pass by construction. **No test asserts the absence** — see D-08 |
| AT-15 | Invitation dispatch, per-recipient results | `buyer.test.ts` | Pass |
| AT-16 | Notification fallback, exactly once | `notify.test.ts` | Pass |
| AT-17 | Operator read is logged, refused without a reason | `operator.test.ts` | Pass |
| AT-18 | Account deletion and 30-day hard delete | `account.test.ts` — 17 tests | **Hard delete was unimplemented. Fixed, see D-02** |
| AT-19 | Export completeness | `account.test.ts` CSV export | Partial. **CSV yes, bulk PDF ZIP no** — see D-09 |
| AT-20 | No PII in analytics | `policy.test.ts` analytics guard | Pass |

**Sixteen of twenty pass outright. Two were unimplemented and are now fixed.
Two are partial and logged.**

---

## 21.2 Defect log

Severity is about the user, not the code. **Critical** means somebody loses
money, access, or privacy. **Major** means the product lies to somebody.
**Minor** means it looks unfinished.

### Found in this phase

| # | Severity | Defect | Status |
|---|---|---|---|
| **D-01** | **Critical** | **Invite takeover.** `bindSupplierToInvite` never checked whether an invitation was already claimed. `mergeSupplierPhone` repoints the supplier record at whichever number verified last, so the second person to open a forwarded invite silently took over the first supplier's account and their whole invoice history. Invites travel by WhatsApp forward — that is the distribution mechanic, so this is an ordinary Tuesday, not an exotic path | **Fixed.** A claimed invitation refuses a different number; the rightful number can still re-verify; the caller clears the cookie and explains. Test verified to fail without the guard |
| **D-02** | **Critical** | **A deletion promise nothing kept.** `softDeleteAccount` wrote an audit row recording `hardDeleteAfterDays: 30`. No code anywhere performed that hard delete. A supplier who deleted their account kept their phone number, TIN and business name in the database indefinitely, while the audit log asserted otherwise | **Fixed.** `purgeDeletedAccounts`, a `purged_at` column, and `npm run purge` for the daily cron. Runbook lists it as a scheduled job to monitor like a backup |
| **D-03** | Major | `account.ts` — export and deletion — had **no tests at all**, despite being the only path in the product that destroys data | **Fixed.** 17 tests |
| **D-04** | Minor | A user-facing string (`no_account`) sat as a literal in `s/start/page.tsx` and had escaped the copy check | **Fixed.** Moved into the catalogue |

### Carried, with reasons

| # | Severity | Defect | Decision |
|---|---|---|---|
| **D-05** | Major | Bank immutability is enforced at the policy layer and by the absence of any write path, but **not by a database constraint**. AT-04 asks for both. A future migration or a direct SQL session could write the column | **Carried.** A trigger or a revoked column grant is the right fix and belongs with the production database, which does not exist yet. Listed as a launch blocker in the handover |
| **D-06** | Major | **No offline compose.** There is an offline *banner* driven by `navigator.onLine`, but no service worker, no IndexedDB queue, and no local persistence. AT-11 and the architecture both describe offline-first behaviour that is not built | **Carried, and the claim corrected.** Building a correct offline queue on top of Server Actions is a genuine piece of work, not a flag: it needs a client-side draft store, a replay path that cannot double-transmit, and a conflict story. Given transmission is already idempotent and retried server-side, the honest v1 position is *composing offline is not supported, and the banner says so.* The architecture note overstated this and has been corrected |
| **D-07** | Minor | Cross-supplier access is refused, but no test asserts it is a 404 rather than a 403. Existence disclosure is the point of the rule | **Carried.** Cheap to add; needs a route-level test harness the suite does not currently have |
| **D-08** | Minor | Nothing *asserts* the raw vendor-master file is never persisted. It is true by construction — the parse path has no filesystem call — but a future change could break it silently | **Carried.** The right fix is a test that fails if any write API is reachable from that module, which is a lint rule rather than a unit test |
| **D-09** | Minor | Export is CSV only. AT-19 describes a ZIP of PDFs plus a CSV | **Carried deliberately.** Per-invoice PDF download exists, and the CSV carries every field including the IRN. A P0 supplier has a handful of invoices, and a ZIP writer is real code for a problem nobody has yet |

### Fixed earlier in the build, recorded for completeness

Currency rendered as raw kobo in both consoles; a rejection screen promising a
retry after the retries were spent; "Edit invoice" opening an empty form and
discarding the supplier's typing; the exposure report claiming today's date
regardless of when the vendor list was loaded; error screens with no `h1`; an
18px tap target against a 48px floor; text runs rendering flush together; TIN
masking applied backwards; imported-but-never-invited suppliers displayed as
"draft"; px font sizes defeating browser text scaling; totals running off the
edge of a phone at 200%; unused skeletons leaving every route blank on a slow
connection; no `global-error` boundary.

Full list in `apps/stampa/CHANGELOG.md`.

---

## 21.3 Self code review

Reviewed against `company/engineering/03-code-review-standard.md`. The
interesting output of a self review is the part that is uncomfortable, so that
is what is written down.

### What holds up

**The fault classification is the best decision in the codebase.** Mapping every
partner error to supplier / buyer / neither, once, at the boundary, means every
screen, notification and operator view derives who-to-call from one table.
Adding a partner error code is one line and four surfaces update correctly.

**Money never touches a float.** Integer kobo from parse to database to PDF,
with `kobo()` refusing a non-integer at construction. The VAT tests reproduce
the worked example from the copy deck exactly.

**Tests run against a real Postgres.** PGlite means the SQL under test is the
SQL that ships — including the `ILIKE` search, the unique index that forced the
phone tombstone in the purge, and the transaction boundaries. A mocked
repository would have hidden all three.

**The copy catalogue earns its cost.** 383 strings in one file with an automated
check. It caught a literal in `s/start/page.tsx` that had been there for days,
and it is the reason the product can be translated without an archaeology
exercise.

**The walk finds what tests cannot.** Every visual and accessibility defect in
the list above came from driving a browser, not from an assertion. Text running
off the edge of a phone at 200% is invisible to a unit test and obvious to a
person.

### What I would challenge in review

**`softDeleteAccount` was the clearest smell and I missed it for days.** It
wrote `hardDeleteAfterDays: 30` into an audit record. A function that records a
future obligation in a log and does not schedule it is a function lying to its
own audit trail. The tell was there in plain text and I read past it because
the surrounding code was tidy. Tidy code reads as correct code, which is
exactly the failure mode.

**`bindSupplierToInvite` computed `phoneMismatch` and did nothing with it but
flag.** A boolean called "mismatch" that never gates anything should have
prompted the question "so what happens when it does mismatch?" It flagged, it
audited, and it handed over the account. Computing a risk signal and not acting
on it is worse than not computing it, because it looks like the case was
considered.

**`exportInvoicesCsv` takes `lines[0].unitPriceKobo` while summing quantity
across all lines.** For a multi-line invoice the unit price column would be
wrong. P0 is single-line so it cannot bite today, and the `InvoiceLine` table
exists precisely because multi-line is coming. This is a bug with a scheduled
arrival date.

**Three route `loading.tsx` files are near-identical.** The buyer and operator
ones differ by a comment. That is duplication I would flag in someone else's
PR, and the argument for keeping it — the surfaces will diverge — is the same
argument everyone makes right before they do not diverge.

**`walk.mts` is over 900 lines and does four jobs:** process supervision,
navigation, auditing, and reporting. It has earned its keep several times over,
but it is now the largest single file in the repository and the auditor inside
it should be its own module with its own tests. A test tool with no tests is a
tool that can silently stop testing — I only know the contrast and keyboard
checks work because I deliberately broke the app to watch them fail, and that
is a manual ritual rather than a guarantee.

**The `__name` shim in the walk is a hack.** Injecting a no-op for the
transpiler's `keepNames` helper into the page is the kind of thing that works
until it does not. The alternative is configuring the transpiler, which is the
correct fix and which I did not do.

### The pattern in my own mistakes

Both critical defects are the same shape: **code that describes the right
behaviour without performing it.** One audited a deletion it never performed;
the other computed a mismatch it never acted on. Neither was a logic error, a
typo, or a missing edge case. Both read correctly, and reading correctly is
what let them survive.

The thing that caught them was not review and not the test suite. It was
walking the acceptance-test list written before the code and asking, one at a
time, *which test proves this?* Four had no answer. That question is cheap and
it should be a standing gate rather than a Phase 21 activity.
