# Phase 12 — Product Translation

## 12.1 The product in one line

**Stampa turns a small supplier's invoice into a government-stamped invoice in
about ninety seconds, using data their customer already has.**

## 12.2 The promise a user would repeat

*Supplier:* "My customer sent me a link. I put in the amount, and it came back
with the government number. Then they paid me."

*Buyer:* "I uploaded my vendor list and it told me which four hundred vendors
were going to break my VAT return, then it onboarded them for me."

Note that neither sentence contains an adjective.

## 12.3 Jobs to be done

**Primary job (supplier):** *Give my customer a document their accounts
department will accept, today, so they release my money.*

**Primary job (buyer):** *Stop my vendor tail producing invoices I cannot
deduct, without hiring three people.*

**Secondary jobs allowed in v1:**
- Supplier: reuse the tool for a *different* customer. Allowed because it is the
  leading indicator of the network effect and costs almost nothing to support.
- Supplier: find and re-share a past stamped invoice.
- Buyer: see which suppliers are live, stuck, or silent, and chase the stuck ones.
- Buyer: export the compliant-invoice register for the VAT return.

**Explicit non-goals for v1.** Written down so they can be pointed at in week six
when someone wants to add them:

- Not bookkeeping. Not expenses, not stock, not payroll. Kippa is the graveyard.
- Not payments. We never move money and we never hold money.
- Not lending or factoring. Not in v1, and never without explicit supplier opt-in.
- Not ERP integration. CSV in, CSV out. Integrations are a P1 sales objection, not a P0 feature.
- Not a supplier directory or marketplace.
- Not supplier scoring. Refused permanently on ethical grounds — it would become a delisting weapon.
- Not multi-country. Nigeria only. Ghana and Kenya are year-two.
- Not a native app. Mobile web first, for reasons argued in Phase 16.

## 12.4 Beachhead user portrait, in the detail the build needs

**Emeka — the supplier.**

| | |
|---|---|
| Device | Android 11–13, 3–4GB RAM, 720×1600, cracked screen protector |
| Browser | Chrome, sometimes Opera Mini |
| Network | 3G/4G, intermittent. Data is metered and he notices |
| Literacy | Reads English; prefers Pidgin spoken. Not a "computer person" |
| Payment rail | Bank transfer via a Moniepoint or Opay app; POS agent for cash |
| Identity | Has a BVN and NIN. Has a TIN but cannot recite it |
| Context | Standing in a workshop with a generator running, phone in one hand |
| **Fear** | **That this is a scam, or that it is the government coming for him** |

**Ify — the buyer.**

| | |
|---|---|
| Device | Windows laptop, Chrome, 1366×768 — design for that, not for a 27-inch monitor |
| Data | A vendor master export from SAP or Sage, as CSV or XLSX, with inconsistent TIN formatting |
| Literacy | High. Impatient. Will judge the product in the first sixty seconds |
| Context | Between meetings, with a Financial Controller waiting for a number |
| **Fear** | **Being the person who could not explain the VAT gap in the audit** |

## 12.5 Success, defined

| Horizon | Supplier | Buyer |
|---|---|---|
| **Session 1** | One invoice stamped with a real IRN and forwarded to the customer, within 3 minutes of opening the link | An exposure number produced from their own vendor master within 5 minutes, and 50 invitations sent |
| **Day 7** | A second invoice stamped without needing help | 40%+ of invited suppliers have opened the link; the buyer has chased the rest from inside the console |
| **Day 30** | Stamping routinely, including for at least one customer who did not invite them | The month-end VAT return referenced the platform's register; the buyer renews |

## 12.6 North-star action

**`supplier_invoice_irn_issued`** — a supplier who was not previously compliant
transmits an invoice that receives a valid IRN, to a buyer on the platform.

Everything else in the analytics is diagnostic. This is the only event that means
value was created, because it is simultaneously the moment the supplier can be
paid and the moment the buyer can deduct.

## 12.7 The signature moment

**The stamp card.** When the IRN returns, a violet stamp block presses onto the
invoice — one 220ms animation, a 4° settle, the sound of a rubber stamp if the
supplier has left sound on. The card shows STAMPED, the IRN in mono, the
timestamp, the amount, and a QR that verifies at `nrs.gov.ng`.

Then one button: **Send on WhatsApp.**

This is the object the whole company is built around. It is what gets forwarded,
what proves the product worked, and what a competitor cannot copy without
rebuilding the trust argument underneath it. It is worth more craft than any
other screen and it should get it.

## 12.8 Constraints inherited from $20,000

| Constraint | Consequence |
|---|---|
| One codebase | Mobile web + console + operator tools in a single Next.js app. No native app, no second repo |
| No design system purchase | Tokens plus Radix primitives plus hand-built components. Roughly 14 components, not 60 |
| No ERP connectors | CSV upload only. Named as a roadmap item in sales, not built |
| No HSM, no direct NRS accreditation in v1 | Transmit through an already-accredited APP partner. Removes ~₦11m of capital requirement and months of process from the critical path |
| No payment integration | Buyers are invoiced offline in month 1. Two invoices a month is not a product problem |
| No in-house support tooling beyond the operator console | The founders answer WhatsApp. This is a feature for the first 1,000 users, not a gap |
| Two to three people, six to ten weeks | P0 is roughly 30 surfaces including states. Anything beyond that is P1 |

## 12.9 Principles this product is built on

1. **Time-to-proof beats time-to-account.** The supplier sees the invoice form
   before he is asked to confirm anything about himself.
2. **Status is always visible.** Nothing is ever "pending" without a reason and a
   time. Silence is the enemy the brand was built to fight.
3. **Important actions produce receipts.** Every stamped invoice is a portable,
   forwardable, independently verifiable object the user owns.
4. **One primary button per screen**, in the bottom third, at least 56px tall.
5. **Trust UI is product, not footer legal.** The line *"Stampa did not issue this
   number"* is on the hero screen, not in the terms.
6. **Stuck users get recovery.** Every dead end has a path out, and every error
   after data entry says *"your invoice is saved."*
7. **Beauty is restraint.** No illustration, no gradient, no colour until
   something becomes official.
8. **The powerless party never pays.** Enforced in code by there being no billing
   surface in the supplier app at all.
