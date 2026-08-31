# Operator runbook

For whoever is on support. Written to be read at 9am with a supplier already on
the phone, so the answers come before the explanations.

The console is at `/ops`. You get in with a magic link sent to an address
listed in `STAMPA_OPERATORS`. If your address is not in that list you cannot
get in, and no amount of clicking will change that — ask for it to be added and
redeployed.

**Every action you take in here is written to an append-only audit log with
your name on it, including the reason you typed.** That is not a threat, it is
the point: this console can see a supplier's tax identity, and the log is what
makes that safe.

---

## The one screen that matters: `/ops`

Six numbers. The only question they answer is whether the north star moved
today.

| Number | What it means | When to worry |
|---|---|---|
| Stamped today | Invoices that got an IRN since midnight WAT | Zero after 10am on a working day |
| Stamped this week | Same, rolling seven days | Falling week on week |
| Suppliers live | Finished onboarding and can invoice | Flat while invites go out |
| Suppliers stuck | Opened the invite and did not finish | Growing faster than "live" |
| Queued | Waiting on transmission right now | Above single digits, or not draining |
| Failing | Rejected and not resolved | Any sustained rise |

**Suppliers stuck is the one people ignore.** It is a supplier who tapped the
link, saw the screen, and stopped. Every one of them is a phone call that
converts, and they are the reason the buyer bought the product.

---

## When an invoice does not get stamped

### First, know whose fault it is

Every rejection is classified into one of three faults, and the fault decides
who you call. The supplier's screen already says the right thing; this is so
you say the same thing.

| Fault | Meaning | Who fixes it | What you say |
|---|---|---|---|
| **supplier** | Something in the invoice the supplier controls — a total that does not add up, a malformed TIN, a missing field | The supplier | "Change this one thing and send it again." The Edit button pre-fills their last invoice |
| **buyer** | The NRS does not recognise the customer's TIN, or the customer is not set up | The buyer, not the supplier | "This is your customer's side. We are telling them. Your invoice is saved." Never make the supplier chase their own customer |
| **neither** | The NRS or our partner is down, a timeout, an unmapped error code | Us | "Nothing is wrong with your invoice. We are retrying it." |

Getting this wrong is worse than saying nothing. Telling a supplier to fix an
invoice that is already correct sends them to a competitor, and telling them to
wait when their total is wrong loses them a week.

### Then, check whether a retry is still coming

Transmission retries automatically **six times**, with backoff at roughly 2s,
8s, 32s, 2 minutes, 8.5 minutes, capped at 15 minutes, jittered so a partner
outage does not produce a thundering herd the moment it recovers.

The failure queue at `/ops/failures` shows **Attempt** (`3 of 6`) and **Next
try**. If Next try says **Stopped**, the retries are exhausted and nothing more
will happen on its own. Rows that have stopped sort to the top, because they
are the only ones that need a human.

**Do not tell a supplier "we are retrying" when the queue says Stopped.** The
supplier's own screen is careful about this distinction and so should you be.

### Then act

- **Retry one** — a single transmission. Use when you believe the cause has cleared.
- **Retry all in this group** — every transmission failing on the same error code. Use after a partner confirms an outage is over. It asks for a reason; write the real one, it goes in the audit log.
- **Neither** — if the fault is `supplier`, retrying achieves nothing. The invoice will fail identically. Call them.

---

## Common situations

### "My invoice says rejected and I do not understand why"

`/ops/lookup`, search the supplier's name or phone. Open the invoice. Read the
fault class and the offending value — money values are shown in naira, not
kobo, so you can read it to them as-is.

If the fault is `supplier`, tell them exactly which field and what to change.
The Edit button on their screen pre-fills the rejected invoice, so they are not
retyping it.

### "The NRS number never arrived but my customer says they paid"

Payment and stamping are separate. We do not move money and we never see it.
Check whether the invoice has an IRN; if it does, the supplier can forward the
stamp card and the customer can verify it against the NRS QR, not against us.

### A partner outage

Symptoms: `queued` climbing, failures grouped under one `neither`-fault code,
Next try populated on all of them.

1. Confirm with the partner before touching anything. Retrying into a dead endpoint burns attempts and pushes invoices toward Stopped.
2. Wait. Six attempts across roughly fifteen minutes of backoff covers most outages without intervention.
3. When the partner confirms recovery, use **Retry all** on the group and write the outage reference as the reason.
4. Anything already Stopped needs a manual retry. Those are the ones where a supplier was told the wrong thing if nobody looked.

### A supplier's TIN is wrong

`/ops/lookup` → open the record → Fix TIN. It asks for a reason and it is
audited. Opening a supplier record is itself audited, before you see anything.

TINs are masked in lookup **results** because you are scanning third-party data
you may not need to see. They are unmasked once you deliberately open a record.
They are never masked on the buyer's own screens — a buyer's vendors' TINs are
the buyer's own data and hiding them is theatre.

### Someone reports a scam

Someone will eventually charge a supplier to "register" them. The product is
free for suppliers, permanently, and every supplier-facing screen says so.

Raise a flag at `/ops/flags` with what was reported. Flags are reviewed and
resolved with a decision and a reason, both audited.

---

## What you must not do

- **Never edit bank details.** You cannot; there is no field. Neither can the buyer, and neither can the supplier. Bank data is read-only from the buyer's vendor master. Anyone asking you to change a supplier's account number is running the payment-diversion attack, and the correct response is to refuse and raise a flag.
- **Never ask for a BVN, a NIN, or a full account number.** We do not store them, we have no use for them, and asking teaches suppliers that it is normal to hand them over.
- **Never tell a supplier to pay for anything.**
- **Never open a supplier record without a reason you would be comfortable reading back in the audit log.** You will be typing one either way.

---

## Deployment notes

- **Migrations are an explicit step.** `npm run migrate` before the new build serves traffic. PGlite applies them automatically in development; production does not, deliberately.
- **The app refuses to boot if a required environment variable is missing.** If a deploy fails at startup, read the boot error first — it names the variable.
- **`STAMPA_GATEWAY=fake` in production would issue simulated references.** Every surface that shows a fake stamp says so out loud, which is the safety net, but the correct value in production is `partner`.
- **Rotating `OTP_PEPPER` invalidates codes in flight.** They live ten minutes, so rotate it when nobody is signing in, and expect a handful of "my code does not work" calls if you do it at 9am.
