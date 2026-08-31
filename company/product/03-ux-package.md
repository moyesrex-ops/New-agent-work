# Phase 14 — UX Package

Sitemap is in `02-feature-pack.md` §13.10.

## 14.1 Flows

### Flow 1 — First success (supplier). The one that has to work.

Target: **under 3 minutes from tapping the link to a forwarded stamp card.**

```
WhatsApp message from the buyer
  v
[1] Invite landing                      buyer's registered name, why you are here,
  |                                     what it costs (nothing), one button
  v  Get started
[2] Phone + OTP                         phone pre-filled from the vendor master
  |                                     where available; 6-digit code; autofill
  v
[3] Confirm your business               name, TIN, address, bank -- all pre-filled,
  |                                     bank shown read-only with a lock and a reason
  v  This is correct
[4] New invoice                         customer already selected and locked
  |                                     description, quantity, unit price
  |                                     VAT computed and shown, not entered
  v  Review
[5] Review                              exactly what will be sent, nothing hidden
  v  Send to NRS
[6] Sending                             progress with an honest time estimate
  |                                     "About 20 seconds"
  v
[7] STAMPED                             stamp press animation, IRN, QR, amount
  v  Send on WhatsApp
[8] WhatsApp share sheet                pre-written message with the PDF attached
  v
Back to [7] with "Sent to your customer"
```

**Where this flow can die, and what catches it.**

| Failure point | Catch |
|---|---|
| Phone number differs from the vendor master | Accept any number; flag the mismatch to the buyer rather than blocking the supplier |
| OTP does not arrive | Resend after 30s; fall back to a voice call at 60s; WhatsApp OTP as a third option |
| Pre-filled details are wrong | Every field editable except bank. Corrections queue to the buyer for confirmation and are audit-logged |
| Network drops at step 6 | Invoice is already persisted. Transmission resumes automatically. The user can close the app |
| NRS rejects | Flow 3 |
| Supplier has no WhatsApp | Share sheet offers SMS, email, copy link, download PDF |

### Flow 2 — Repeat job (supplier)

```
Home  ->  New invoice  ->  pick customer (or the only one)  ->  amount
      ->  Review  ->  Send  ->  Stamped  ->  Share
```

Target: **under 45 seconds.** Previous description and unit price are offered as
one-tap suggestions. The customer list is ordered by most recent.

The moment worth instrumenting: when a supplier taps **Add another customer**.
That is the network effect becoming real, and it fires the
`supplier_added_second_buyer` event.

### Flow 3 — Failure, dispute, recovery

```
Send  ->  NRS rejects
  v
[Not stamped]     what: "Not stamped."
                  why:  the actual NRS error, translated into plain English,
                        with the offending value shown
                  next: one primary action
                  plus: "Your invoice is saved." always
  |
  |-- Fixable by the supplier (amount mismatch, wrong description)
  |     -> Edit, then Try again
  |
  |-- Fixable by the buyer (bad customer TIN)
  |     -> "We have told Agbara Foods. We will message you when it is fixed."
  |     -> buyer sees it in their console failure list
  |
  |-- Not fixable by either (NRS down, schema error)
  |     -> case number, automatic retry with backoff,
  |        "This one is with the NRS, not with you. Case 4471."
  |     -> operator failure queue
  '
Dispute (P1): supplier flags a stamped invoice as wrong
  -> invoice marked disputed for both sides, operator notified,
     credit note is the resolution path
```

**The rule:** the supplier is never asked to fix something they cannot see. If
the broken field came from the buyer, the buyer is chased, not the supplier.

### Flow 4 — Buyer first value

```
[1] Sign in with work email  ->  magic link
[2] Upload vendor master     ->  CSV or XLSX, drag or browse
[3] Column mapping           ->  auto-detected, confirm in one screen
[4] EXPOSURE REPORT          ->  "412 of your 612 vendors have never transmitted
                                  a compliant invoice. Estimated input VAT at
                                  risk this quarter: NGN 38,400,000."
                                  <- the screenshot that gets sent to the FC
[5] Select suppliers         ->  filter, select all, or pick 50
[6] Review the message       ->  sent in the buyer's name, editable
[7] Send invitations         ->  WhatsApp + SMS
[8] Supplier list            ->  live status: invited / opened / live / stuck
```

Target: **exposure number within 5 minutes of first sign-in.** Steps 1–4 are the
free wedge and require no contract.

### Flow 5 — Payment (buyer)

P0 is deliberately manual. The console shows the plan, the active-supplier count,
and the next invoice date. A Stampa PDF invoice is issued by the founders and
paid by bank transfer. Nothing in the product takes a card in v1.

**Rationale:** payments are the last thing to build, not the first. The brief says
never start payments before the core job works, and with fewer than twenty
customers a bank transfer is not a bottleneck.

### Flow 6 — Notify and return

```
Invoice stamped        -> WhatsApp: "Stamped. INV-0032 to Agbara Foods,
                          NGN 1,850,075.00. IRN-7K2M-88QX-2026." + deep link
Invoice rejected       -> WhatsApp: what / why / next + deep link to the fix
Buyer nudge (day 3)    -> to suppliers who opened but did not finish
Buyer month-end (P1)   -> three days before the filing date
```

Every notification deep-links to the exact screen that resolves it. No
notification ever says "you have an update."

### Flow 7 — Account deletion and export

```
Account -> Your data
  |- Download everything          -> ZIP: PDFs of every stamped invoice + CSV
  '- Delete my account
       -> plain-language screen: what is deleted, what the law requires us
          to keep (transmitted invoices are tax records), and for how long
       -> type DELETE to confirm
       -> immediate soft delete, sign-out, 30-day hard delete
       -> confirmation by WhatsApp and email
```

No retention offer. No "are you sure you want to lose all your data?" No dark
pattern. The supplier walked in with a WhatsApp link and can walk out the same way.

## 14.2 Screen inventory

Thirty-one surfaces. For each: purpose, primary action, and the four states that
are usually skipped.

### Supplier app

| # | Screen | Purpose | Primary action | Empty | Loading | Error | Edge cases |
|---|---|---|---|---|---|---|---|
| S1 | Invite landing | Convert suspicion into a first tap | Get started | n/a | Buyer name skeleton | Invalid or expired code: "This link is not active. Ask your customer for a new one." + help | Code already used by another phone; buyer has since churned; supplier opens on desktop |
| S2 | Phone entry | Identify without friction | Send code | n/a | Button spinner, field stays live | Invalid format shown inline, not on submit | Number differs from vendor master; dual-SIM; +234 vs 0 prefix |
| S3 | OTP | Verify | Auto-submits on 6th digit | n/a | Inline | "That code is not right. Check the last message." Resend at 30s, voice at 60s | SMS delayed 2 min; user pastes with spaces; SIM swap re-verification |
| S4 | Confirm business | Show we already know them — the trust flip | This is correct | n/a | Field skeletons | Save failure keeps values and offers retry | TIN missing from vendor master; name mismatch; supplier disputes the bank details |
| S5 | Home / invoices | The return surface | New invoice | "No invoices yet. Your first one takes about ninety seconds." + button | Three row skeletons | Load failure shows cached list and an offline banner | 500+ invoices; all drafts; all failed |
| S6 | New invoice — details | Capture the minimum | Review | Description empty, amount 0, Review disabled with a reason | n/a | Inline per-field; never a top-of-page error block | Amount > ₦100m confirm step; zero amount; non-VAT item |
| S7 | New invoice — review | No surprises before transmission | Send to NRS | n/a | n/a | n/a | Long descriptions truncate with a Show all |
| S8 | Sending | Honesty during the wait | Cancel is not offered; Close app is safe | n/a | Determinate-feeling progress + "About 20 seconds" | After 60s: "Taking longer than usual. We will message you when it is done. You can close the app." | NRS timeout; app backgrounded; screen locked |
| S9 | **Stamped** | The signature moment | Send on WhatsApp | n/a | n/a | n/a | Very long buyer name; amount over 10 digits; QR fails to render → show the IRN large |
| S10 | Not stamped | Recover without shame | Depends on cause: Try again / Edit / nothing | n/a | n/a | This screen *is* the error state | Unknown error code → generic copy + case number, never a raw code |
| S11 | Offline / saved | Remove fear of lost work | Nothing — it resolves itself | n/a | n/a | n/a | Airplane mode; captive-portal wifi that looks online |
| S12 | Invoice detail | Re-find and re-share proof | Share | n/a | Skeleton | Falls back to cached | Deleted buyer; disputed invoice; draft |
| S13 | Help | Reach a human | WhatsApp us | n/a | n/a | n/a | Outside 8am–8pm → shows hours and promises a morning reply |
| S14 | Account | Control and exit | Download everything | n/a | n/a | n/a | Export over 50MB → emailed link |
| S15 | Delete account | Leave cleanly | Delete my account | n/a | n/a | n/a | Pending transmissions block deletion with an explanation |

### Buyer console

| # | Screen | Purpose | Primary action | Empty | Loading | Error | Edge cases |
|---|---|---|---|---|---|---|---|
| B1 | Sign in | Enter | Send magic link | n/a | Inline | Non-corporate domain → "Use your work email." | Link expired; opened in another browser |
| B2 | Overview | The monthly return reason | Invite suppliers | "Upload your vendor list to see your exposure." | Card skeletons | Stale-data banner with last-updated time | Zero suppliers; all live |
| B3 | Upload | Get their data in | Upload | Drop zone with a sample CSV to download | Progress with row count | Bad file: names the row and the problem | XLSX with merged cells; 5,000 rows; no TIN column at all |
| B4 | Column mapping | Handle messy exports | Confirm mapping | n/a | n/a | Unmappable required column blocks with a clear reason | Duplicate headers; TIN formatted as a number with a lost leading zero |
| B5 | **Exposure report** | The wedge. The screenshot | Invite these suppliers | "Good news — all 612 vendors are compliant." (rare, must be designed) | Computed-live progress | Partial results shown with what failed | 100% exposed; TIN data too poor to compute → shows coverage instead |
| B6 | Supplier list | Operational surface | Invite / Nudge | "No suppliers yet." | Table skeleton | Retry inline | 5,000 rows → virtualised; every status filter empty |
| B7 | Supplier detail | Chase one vendor | Nudge | n/a | Skeleton | | Supplier requested a data correction; supplier deleted their account |
| B8 | Invite composer | Message in the buyer's name | Send invitations | n/a | Send progress per channel | Per-recipient failures listed, not a blanket error | Invalid numbers; 500 at once → batched with a visible queue |
| B9 | Inbound invoices | Feed the VAT return | Export CSV | "No stamped invoices yet." | Skeleton | | Date range with no data; export over 10k rows |
| B10 | Settings | Company, team, plan | Save | n/a | | | Sole admin cannot remove themselves |

### Operator console

| # | Screen | Purpose | Primary action |
|---|---|---|---|
| O1 | Metrics | Is the north-star moving today | — |
| O2 | Failure queue | Fix transmissions | Retry / Retry all in group |
| O3 | Lookup | Answer a support call in under 30 seconds | Open record |
| O4 | Record view | Read-only impersonation, audit-logged | Correct TIN |
| O5 | Flags | Act on scam reports | Suspend / Dismiss |
| O6 | Audit log | Who did what | Export |

**Count:** 31 screens. With the distinct designed states above, roughly 68
designed surfaces. That is inside the brief's 18–35 *screen* target and above its
state bar, which is the right way round.

## 14.3 UX copy deck

Complete, in brand voice, no placeholder text anywhere.

### S1 Invite landing
> **Agbara Foods Plc asked you to send your invoices through Stampa.**
>
> From July 2026 they can only pay invoices that carry a government reference
> number. Stampa gets that number for you.
>
> It takes about ninety seconds. **It is free for suppliers — you will never be
> asked to pay.**
>
> `[ Get started ]`
>
> Not sure about this? Call us on 0700-STAMPA.

### S2 Phone entry
> **What is your phone number?**
> We will send you a 6-digit code.
> `[ 0803 000 0000 ]`
> `[ Send code ]`
> We use your number to sign you in. We never share it.

### S3 OTP
> **Enter the code**
> Sent to 0803 000 0000. `Change`
> `[ _ _ _ _ _ _ ]`
> Did not arrive? **Resend** (available in 30s) · **Call me instead**

### S4 Confirm business
> **Is this your business?**
> Agbara Foods sent us these details.
>
> Business name — Emeka Aluminium Works Ltd
> TIN — 20481166-0001
> Address — 14 Ladipo Street, Oshodi, Lagos
> Paid into — 🔒 Zenith Bank ••••4471
>
> *Your bank details come from your customer and cannot be changed here. If they
> are wrong, tell your customer directly. This protects you from fraud.*
>
> `[ This is correct ]`   `Something is wrong`

### S6 New invoice — details
> **New invoice**
> To — Agbara Foods Plc  *(locked)*
> What did you supply? `[ Aluminium railings ]`
> Quantity `[ 42 ]`   Price each `[ 40,976.19 ]`
> Subtotal 1,721,000.00 · VAT 7.5% 129,075.00
> **Total NGN 1,850,075.00**
> `[ Review ]`

### S8 Sending
> **Sending to NRS**
> This takes about 20 seconds.
> Your invoice is saved. You can close the app — we will message you when it is done.

*After 60 seconds:*
> **Taking longer than usual.** The NRS is slow right now. We are still trying and
> we will message you when it is done. Nothing is lost.

### S9 Stamped — the hero
> **Stamped.**
> Invoice INV-0032 to Agbara Foods Plc
> **NGN 1,850,075.00** (including VAT 129,075.00)
> NRS reference **IRN-7K2M-88QX-2026**
> Stamped 14 Sep 2026, 10:42 WAT
>
> `[QR]` *Stampa did not issue this number. Anyone can check it at nrs.gov.ng.*
>
> `[ Send on WhatsApp ]`   `Download PDF`

WhatsApp share text:
> Invoice INV-0032 from Emeka Aluminium Works Ltd. NGN 1,850,075.00. NRS
> reference IRN-7K2M-88QX-2026. Verify at nrs.gov.ng.

### S10 Not stamped — three causes, three copies

*Supplier can fix:*
> **Not stamped.**
> The NRS says the VAT total does not match the line items.
> Check the amounts, then send again. Your invoice is saved.
> `[ Edit invoice ]`

*Buyer must fix:*
> **Not stamped.**
> The NRS does not recognise Agbara Foods' TIN: 10229384-0001.
> This is on your customer's side, not yours. We have told them. We will message
> you as soon as it is fixed. Your invoice is saved.
> `[ Tell me when it is fixed ]`

*Neither can fix:*
> **Not stamped yet.**
> The NRS is not responding. This one is with them, not with you.
> We are retrying automatically and we will message you. Case 4471.
> Your invoice is saved.
> `[ Call us ]`

### S11 Offline
> **No network.** Saved. We will send it when you are back online.

### S5 Home, empty
> **No invoices yet.** Your first one takes about ninety seconds.
> `[ New invoice ]`

### S13 Help
> **Need help?**
> Call **0700-STAMPA**, 8am–8pm.
> Or `[ Message us on WhatsApp ]` — we usually reply in a few minutes.
>
> **Stampa is free for suppliers.** Nobody should ever ask you to pay to register.
> If someone does, call us.

*Outside hours:* We are closed now. Send a message and we will reply from 8am.

### S15 Delete account
> **Delete your account**
> We will delete your profile, your drafts and your contact details immediately.
>
> Invoices that have already been stamped are tax records. The law requires them
> to be kept for six years, so those stay — but they are no longer linked to your
> account, and you can download them now.
>
> `Download everything first`
> Type **DELETE** to confirm. `[ ______ ]`
> `[ Delete my account ]`

### B5 Exposure report
> **412 of your 612 vendors have never sent a compliant invoice.**
> Estimated input VAT at risk this quarter
> **NGN 38,400,000**
>
> Based on 612 vendors uploaded on 14 Sep 2026 and NRS transmission records.
> 78 vendors could not be checked because their TIN is missing or malformed.
> `See the list`
>
> `[ Invite these suppliers ]`

### B8 Invite composer
> **Invite 50 suppliers**
> They will receive this from Agbara Foods Plc, on WhatsApp and SMS.
>
> > *Agbara Foods Plc: From now on we can only pay invoices with an NRS
> > reference number. Use this free link to send yours: stampa.ng/s/AGB-4471.
> > It takes about ninety seconds. You will never be asked to pay for it.*
>
> `Edit message`   `[ Send invitations ]`

### Support macros
Reproduced from the voice charter §8.2 without alteration, so the product and the
phone say the same thing.

## 14.4 Trust script — the exact UI mechanisms

Suspicion is the primary obstacle. Nine mechanisms, each attached to a specific
screen.

| # | Moment | Mechanism |
|---|---|---|
| 1 | Before the first tap | The invite landing leads with the **buyer's registered legal name**, not ours. The authority the supplier already accepts is the first thing on screen |
| 2 | Before the first tap | *"It is free for suppliers — you will never be asked to pay"* appears above the fold, before any field |
| 3 | Sign-in | Phone + OTP only. No password, no email, no BVN, no NIN, no document upload. Nothing that a scam would ask for |
| 4 | Confirm business | We show what we already know. A scam asks; a legitimate system already has it. **This is the single strongest trust move in the product** |
| 5 | Confirm business | Bank details rendered with a lock icon, read-only, with the reason stated: *"This protects you from fraud."* |
| 6 | Every wait | An honest time estimate and an explicit permission to leave |
| 7 | Every failure after data entry | *"Your invoice is saved."* Mandatory. Never omitted |
| 8 | Every stamped object | *"Stampa did not issue this number. Anyone can check it at nrs.gov.ng."* We hand the user the means to doubt us, which is the only durable way to be believed |
| 9 | Every screen, plus monthly | The anti-scam line and a phone number that a human answers |

## 14.5 Context notes

Where this is actually used, and what each context demands.

| Context | Demand |
|---|---|
| **Workshop, generator running** | Nothing depends on sound. The stamp sound is a bonus, off by default. All confirmations are visual and persistent |
| **Direct sunlight, cracked screen** | 15.8:1 body contrast, 18px base body text, no thin weights below 500 at small sizes, no colour-only status |
| **One hand, holding something in the other** | Primary action in the bottom third, 56px tall, full width minus gutters. Nothing critical in the top corners |
| **On a danfo, 3G, moving** | Every field autosaves. Transmission survives backgrounding. Offline queue is P0 |
| **Metered data** | First load budget: 180KB JS, 40KB CSS. No web fonts on the critical path — system fallback renders first, Archivo swaps in. No images above the fold |
| **Night, low battery** | Dark mode is P2, but the paper palette at low brightness is legible and no screen is a wall of white |
| **An agent helping someone else** | Nothing on screen is embarrassing to have read aloud. No credit-score language, no "you are non-compliant." The agent-assisted mode (P1) shows the agent's code in the header so the supplier can see who is helping them |
| **A buyer's AP clerk opening the PDF** | The PDF renders identically in Chrome, Adobe Reader and Gmail's viewer, and prints correctly on A4 in mono |

## 14.6 Localisation plan

**v1 ships in English only**, and that is a considered decision rather than a
budget excuse: the copy is written at grade 6 with Pidgin-sayable sentence
structures, and every Lagos supplier in the beachhead reads functional English.
Support is multilingual from day one — the phone and WhatsApp answer in Pidgin,
Yoruba, Igbo and Hausa — because the hard conversations are spoken, not read.

**Built for translation from the start.** All copy in a single message catalogue,
no concatenated strings, ICU plurals, no text baked into images.

**P1 order, and the reasoning:** Nigerian Pidgin first (widest reach, and the
register the market actually speaks), then Yoruba (the beachhead city), then
Hausa (northern expansion, and the largest single-language population), then Igbo.

**Formats are locale-correct from v1:** `NGN 1,850,075.00`, dates as
`14 Sep 2026`, times with an explicit `WAT` suffix, phone numbers displayed as
`0803 000 0000` and stored as `+234803...`.

## 14.7 Accessibility

- **Contrast:** body 15.8:1, secondary 5.1:1, primary button 9.6:1. All exceed AA.
- **No colour-only status.** Every state is a colour, an icon and a word.
- **Targets:** 48px minimum, 56px for primary actions, 8px minimum spacing between adjacent targets.
- **Type:** 16px base, 18px body in the supplier app, and the app respects OS text scaling to 200% without horizontal scroll or clipped buttons.
- **Focus:** a 2px `stamp.700` outline at 2px offset on every interactive element. Never removed. Full keyboard operability in the console, which is where keyboard users actually are.
- **Semantics:** real `<button>`, real `<label>`, real `<form>`. Live regions announce state changes on the Sending screen. The stamp card is a labelled region so a screen reader announces "Stamped, invoice INV-0032, one million eight hundred and fifty thousand and seventy five naira."
- **Motion:** `prefers-reduced-motion` disables the stamp press and shows the final state directly.
- **Inputs:** `inputmode="numeric"` on amounts and OTP, `autocomplete="one-time-code"`, correct keyboards everywhere. Getting the keyboard wrong on a phone is an accessibility failure, not a nicety.
