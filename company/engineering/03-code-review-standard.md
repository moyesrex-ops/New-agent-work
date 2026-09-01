# Phase 19 — Code Review Standard

This exists **before** Phase 20 so that the code is written to it rather than
judged against it afterwards.

## 19.1 Review output format

Every milestone produces exactly this, in this order:

```
AREA REVIEWED
  <what was looked at, by file or feature>

BLOCKERS
  <defects that make the milestone unshippable. Numbered.>

REQUIRED CHANGES
  <must fix before the next milestone, but not shipping-blocking>

OPTIONAL NITS
  <taste, naming, small refactors. May be declined with a reason.>

VERDICT
  REJECT | REVISE | ACCEPT
```

**No ACCEPT while any blocker is open.** REJECT means the approach is wrong and
the work should be redone rather than patched. REVISE means the approach is right
and the defects are addressable.

## 19.2 Checklist

Fourteen items, applied to every milestone.

**1. Implements the ticket and nothing extra.**
Scope creep in a review is easier to catch than in a sprint. A ticket that
shipped a P1 feature is REVISE even if the feature is good.

**2. Readable names.**
`transmitInvoice`, not `doIt`. `bankLast4`, not `bl4`. Nigerian domain terms
spelled out: `invoiceReferenceNumber` in the type, `irn` only where it is the
literal API field. No abbreviation a new engineer would have to look up.

**3. No secretly duplicated state.**
One source of truth per fact. Invoice status is derived from the transmission
record, not stored twice and hoped to agree. If a value exists in two places, the
review asks which one is authoritative and why the other exists.

**4. Errors shown in brand voice with a next step.**
Every user-visible error must match the §14.3 copy deck. A raw exception, a
gateway code, or a stack trace reaching the UI is a **blocker**. The `ErrorState`
component requires an action prop by type, so a dead end should not compile — a
review that finds one has also found a hole in the type.

**5. Secrets out of client code.**
Every `NEXT_PUBLIC_` variable is read individually and justified. Any credential,
partner endpoint or signing key in a client bundle is a **blocker**. `grep` the
built bundle, do not trust the import graph.

**6. PII minimised.**
Does this code store anything beyond the §16.5 list? A new column holding a full
bank account number, an email, a BVN or a raw uploaded file is a **blocker**.
The question is not "is it useful" but "would losing it hurt someone."

**7. Analytics correct and privacy-safe.**
Event fires exactly once, at the right moment, with properties from the allow-list.
No phone numbers, no full TINs, no invoice descriptions. Double-fires and
never-fires are both defects.

**8. Loading, empty, error and success all handled.**
All four, in the code, matching §14.2. A component with only a happy path is
REVISE. "We'll add the empty state later" is how products come to look cheap.

**9. No dead code, dummy data, or commented-out junk in the main path.**
No `TODO` without a ticket id. No seeded demo rows reachable in production. No
`console.log`.

**10. A second engineer can find the core loop in ten minutes.**
Concretely: from a clean checkout and the README, can a new engineer locate where
an invoice becomes stamped? If the answer requires a tour, the structure is
wrong.

**11. UI uses tokens, not magic numbers.**
No hex colours in components. No arbitrary pixel values outside the spacing
scale. CI fails on a raw hex in `src/components`.

**12. Tests exist for money, identity and permission paths.**
Non-negotiable coverage: VAT and money arithmetic, phone normalisation, OTP
lifecycle, the policy module, idempotency, gateway error mapping, and bank-field
immutability. A change to any of these without a test is a **blocker**.

**13. No P2 extras smuggled in.**
Checked against the §17.4 cut list.

**14. Accessibility basics not broken.**
Real semantic elements, labels bound to inputs, focus visible and never removed,
targets at least 48px, no colour-only status, correct `inputmode`.

## 19.3 Three additions specific to this product

**15. Money is integer kobo.**
Any `number` holding naira with a decimal point, any use of `parseFloat` on an
amount, any `toFixed` in a calculation path: **blocker**. Formatting for display
is the only place decimals appear.

**16. Idempotency on anything that reaches the tax authority.**
Any new call path to the gateway without an idempotency key is a **blocker**. A
duplicate invoice transmitted to the NRS is a real-world harm to a real supplier.

**17. Audit before response.**
An action that changes money or identity must write its `AuditEvent` inside the
same database transaction as the change, not afterwards and not fire-and-forget.
If the audit write fails, the action fails.

## 19.4 Severity definitions, used in Phase 21

| Severity | Definition | Rule |
|---|---|---|
| **S1 — ship-killer** | Data loss, duplicate transmission, a permission bypass, money or identity handled wrongly, first-run broken on the beachhead device, or a security hole | **Open S1 means not done.** No exceptions, no "known issue" |
| **S2 — major** | A core flow is completable but degraded: a missing state, an error without a next step, a broken fallback, an accessibility failure | Must be fixed before launch |
| **S3 — polish** | Spacing, wording outside the highest-traffic strings, a nit in a rarely-seen state | May ship, must be logged |
