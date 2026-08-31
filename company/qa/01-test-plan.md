# Phase 18 — Test Everything

The bar: **the P0 suite must be executable by one human QA in a day**, on real
devices, with no engineer present. Everything below is written to that standard.

Automated tests live in `apps/stampa/src/**/*.test.ts` and
`apps/stampa/tests/`. Manual scripts are written to be followed literally.

## 18.1 Product scripts

Fourteen scripts. Each has a setup, numbered steps, and a pass condition that
does not require judgement.

### PS-01 First run to first success
**Setup:** clean browser profile, a valid invite code, a real Android phone on 4G.
1. Open the invite link from a WhatsApp message.
2. Confirm the buyer's legal name is the largest text on screen.
3. Confirm the free-for-suppliers line is visible without scrolling.
4. Tap Get started, enter a phone number, receive and enter the OTP.
5. Confirm the business details are pre-filled and the bank row is locked with a stated reason.
6. Enter a description, quantity and unit price. Confirm VAT is computed, not typed.
7. Review, send.
8. Observe the Sending screen and its time estimate.
9. Observe the stamp press. Read the IRN.
10. Share to WhatsApp.

**Pass:** an IRN is returned, the stamp card renders with a scannable QR, the
WhatsApp message contains the IRN and a PDF, and **total elapsed time from step 1
to step 10 is under 3 minutes.**

### PS-02 Return user repeats the job
**Setup:** an account with one stamped invoice.
1. Open the app from the home screen.
2. New invoice. Confirm the previous description and unit price are offered as suggestions.
3. Change the amount. Review. Send.

**Pass:** stamped in **under 45 seconds** from step 1.

### PS-03 Low-literacy, one-thumb
**Setup:** phone held in one hand, other hand occupied. OS text size at 150%.
1. Complete PS-01 without using the second hand.
2. Confirm no primary action requires reaching the top third of the screen.
3. Confirm no text is clipped or overlapping at 150%, and repeat at 200%.

**Pass:** completed one-handed; no clipping at 200%; every button at least 48px.

### PS-04 Bad network
**Setup:** Chrome DevTools throttled to Slow 3G, then a real 3G-only SIM.
1. Complete PS-01 under Slow 3G.
2. Note first-contentful-paint and the total JS transferred.

**Pass:** the flow completes; JS on the critical path is under 180KB; the Sending
screen's estimate is shown; nothing appears frozen for more than 2 seconds
without feedback.

### PS-05 Interruption and resume
1. Begin an invoice, fill two fields, background the app for 5 minutes.
2. Return. Confirm the values are still there.
3. Tap Send, then immediately enable airplane mode.
4. Wait 30 seconds, disable airplane mode.
5. Kill the app entirely during transmission on a second run.

**Pass:** no data loss in any case. The invoice is stamped exactly once. **A
duplicate IRN for one invoice is an automatic S1.**

### PS-06 Wrong input
1. Submit an empty description. 2. Enter a zero amount. 3. Enter ₦999,999,999.99.
4. Enter letters in the amount field. 5. Paste an OTP with spaces.
6. Enter a 10-digit phone number.

**Pass:** every error is inline, adjacent to its field, names the problem in the
copy-deck voice, and never blocks with a generic top-of-page banner. The
₦100m-plus case shows a confirmation step rather than an error.

### PS-07 Scam and abuse
1. Attempt to change bank details as a supplier, via the UI and by crafting the request directly.
2. Attempt to change bank details as a buyer admin, both ways.
3. Attempt to open an invite code already bound to a different phone.
4. Attempt to create an invoice against an organisation the supplier has no link to.
5. Replay a captured OTP after use.
6. Request 20 OTPs in a minute.

**Pass:** all six rejected server-side. **Any client-only enforcement is an
automatic S1.** Rate limits engage. Every rejection is audit-logged.

### PS-08 Dispute
1. As a supplier, flag a stamped invoice as wrong.
**Pass (P1 feature, verified as spec in v1):** the invoice shows as disputed to
both parties and an operator is notified. In v1 the disputed path is exercised as
a manual operator action and the operator screen is tested.

### PS-09 Duplicate submission
1. Double-tap Send.
2. Send, go back in the browser, send again.
3. Replay the same idempotency key against the API twice.

**Pass:** exactly one transmission, one IRN, one row in `Transmission` marked
successful. The second attempt returns the first result.

### PS-10 Permission denial
1. Deny camera when asked to scan.
2. Deny notifications.

**Pass:** the app explains what is lost and offers the alternative path. No dead
end, no repeated prompt, no broken layout.

### PS-11 Account deletion and privacy
1. Download everything. Open the ZIP.
2. Delete the account with a transmission pending.
3. Delete the account with nothing pending.

**Pass:** the export contains every stamped PDF and a CSV. Deletion is blocked
with an explanation while a transmission is pending. Otherwise the account is
soft-deleted immediately, the session ends, and a confirmation arrives. The
statutory-retention explanation is shown in plain language before confirmation.

### PS-12 Empty database
1. Fresh buyer, no upload. 2. Fresh supplier, no invoices. 3. Every supplier-list filter with no matches.

**Pass:** every one shows a designed empty state with a next action. No blank
screens, no zero-row tables with just headers.

### PS-13 Huge history
**Setup:** seed 500 invoices and a 5,000-row vendor master.
1. Scroll the supplier history. 2. Search it. 3. Load the supplier list. 4. Export inbound invoices.

**Pass:** the list virtualises and stays smooth; search returns in under 500ms;
the export completes or is emailed with a clear message.

### PS-14 Agent-assisted (P1, spec-verified in v1)
1. An agent opens the flow for a supplier who is standing beside them.
**Pass:** nothing on screen is embarrassing to read aloud. No credit language, no
"non-compliant" wording. In v1 this is verified by reading every screen's copy
against the rule, and recorded as a copy audit rather than a feature test.

## 18.2 Acceptance tests — Given / When / Then

Every P0 flow. These are the automated integration tests.

**AT-01 Invite binding**
> **Given** a valid, unused invitation for supplier S at buyer B
> **When** a user opens the link and verifies phone P
> **Then** a session for S is created, the invitation is marked opened and bound to P, and an `invite_opened` event is recorded.

**AT-02 Invite reuse**
> **Given** an invitation already bound to phone P1
> **When** phone P2 opens it
> **Then** access is refused with the "not active" copy and a help route, and no session is created.

**AT-03 Pre-filled identity**
> **Given** supplier S with a TIN in buyer B's vendor master
> **When** S reaches Confirm business
> **Then** name, TIN and address are pre-filled, the bank row is read-only, and **S has typed neither their own TIN nor B's TIN at any point.**

**AT-04 Bank immutability**
> **Given** any authenticated actor of any role
> **When** they attempt to write `SupplierLink.bank_last4` or `bank_name` by any route
> **Then** the write is refused at the policy layer *and* at the database layer, and the attempt is audit-logged.

**AT-05 VAT computation**
> **Given** a line of quantity 42 at ₦40,976.19
> **When** the invoice is prepared
> **Then** subtotal is 172,100,000 kobo, VAT at 7.5% is 12,907,500 kobo, total is 185,007,500 kobo, and **no float appears anywhere in the calculation.**

**AT-06 Successful transmission**
> **Given** a valid invoice and a gateway that returns an IRN
> **When** it is transmitted
> **Then** the invoice becomes `STAMPED`, the IRN and timestamp are stored, an `AuditEvent` is written in the same transaction, and `supplier_invoice_irn_issued` fires exactly once.

**AT-07 Idempotency**
> **Given** an invoice transmitted with idempotency key K
> **When** a second transmission with key K arrives
> **Then** the stored result is returned, no second gateway call is made, and exactly one successful `Transmission` row exists.

**AT-08 Supplier-fixable rejection**
> **Given** a gateway rejection with a VAT-mismatch code
> **When** the response is handled
> **Then** the invoice becomes `REJECTED` with fault `supplier`, the S10 supplier-fixable copy is shown with the offending value, the Edit action is offered, and the draft is retained.

**AT-09 Buyer-fixable rejection**
> **Given** a rejection with an unknown-customer-TIN code
> **When** handled
> **Then** fault is `buyer`, the supplier sees the buyer-fault copy, the item appears in the buyer's console failure list, and the supplier is not asked to fix it.

**AT-10 Unmapped error**
> **Given** a gateway error code not present in the mapping table
> **When** handled
> **Then** the "neither" copy is shown with a case number, an operator alert is raised, and the raw code is never rendered to the user.

**AT-11 Offline compose**
> **Given** no network
> **When** an invoice is composed and Send is pressed
> **Then** it persists locally, the offline banner shows, and on reconnection it transmits exactly once.

**AT-12 Session and policy**
> **Given** a supplier session for S
> **When** a request is made for an invoice belonging to a different supplier
> **Then** it is refused by the policy module with a 404, not a 403 — existence is not disclosed.

**AT-13 Exposure computation**
> **Given** a 612-row vendor master where 412 rows have no transmission history and 78 have malformed TINs
> **Then** the report states 412 exposed, discloses the 78 uncheckable rows, and shows the methodology line with the upload date.

**AT-14 Raw file discarded**
> **Given** an uploaded vendor master
> **When** parsing completes
> **Then** the extracted fields are stored and **no copy of the raw file remains** on disk or in object storage.

**AT-15 Invitation dispatch**
> **Given** 50 selected suppliers
> **When** invitations are sent
> **Then** each gets a unique single-use code, WhatsApp is attempted first and SMS on failure, and per-recipient results are reported rather than a blanket success.

**AT-16 Notification fallback**
> **Given** the WhatsApp adapter is failing
> **When** an invoice is stamped
> **Then** the notification is delivered by SMS and the failure is logged. **The user is notified exactly once.**

**AT-17 Operator read is logged**
> **Given** an operator opens a supplier record in another organisation
> **Then** an `AuditEvent` records actor, subject, reason string and timestamp, and the action is refused without a reason.

**AT-18 Account deletion**
> **Given** a supplier with stamped invoices and no pending transmissions
> **When** deletion is confirmed
> **Then** the profile is soft-deleted, the session ends, stamped invoices are retained but unlinked, and a hard delete is scheduled for 30 days.

**AT-19 Export completeness**
> **Given** a supplier with 12 stamped invoices
> **When** they download everything
> **Then** the ZIP contains 12 PDFs and a CSV with 12 rows, and every PDF opens.

**AT-20 No PII in analytics**
> **Given** any analytics event
> **Then** its properties contain no phone number, no full TIN, and no invoice description. Enforced by an automated property allow-list test.

## 18.3 Device matrix

| Device | Why it is on the list | Priority |
|---|---|---|
| **Tecno Spark / Infinix Hot, Android 11–13, 3GB RAM, 720×1600, Chrome** | This is the beachhead device. Not an emulator — a real handset | **P0** |
| Samsung Galaxy A-series, Android 14, Chrome | Current mainstream Android | P0 |
| Opera Mini, extreme data-saving mode | Genuinely used in this market. Confirm the app either works or shows a clear "please use Chrome" message rather than breaking silently | P0 |
| iPhone SE (small viewport), Safari | The smallest iOS surface. iOS is a minority of the supplier base but present among buyers | P1 |
| Chrome on Windows 1366×768 | **The buyer console's actual device.** Not a 27-inch monitor | **P0** |
| Firefox and Safari desktop | Console cross-browser | P1 |

Network conditions on each: 4G, throttled Slow 3G, and airplane-mode interruption
mid-flow.

## 18.4 Trust tests

| ID | Attack | Pass condition |
|---|---|---|
| TT-01 | Fake counterpart: create an invoice to an organisation the supplier is not linked to | Refused server-side, audit-logged |
| TT-02 | Fake receipt: alter the amount in the PDF and re-share | The QR still resolves to the NRS record showing the true amount. **Our PDF is not the source of truth and the test proves it** |
| TT-03 | Replayed OTP after successful use | Refused. Codes are single-use and time-boxed |
| TT-04 | Impersonation: bind a stolen invite code to an attacker's phone | Single-use binding; the buyer sees the phone mismatch flagged; bank details remain unwritable so no payment can be diverted |
| TT-05 | SIM swap: sign in from a new device | Re-verification required before any invoice submission |
| TT-06 | Phishing clone of the invite page | Not preventable by us. **Mitigation tested instead:** the anti-scam copy appears on first open and monthly, the support number is on every screen, and we never ask for a bank detail or a password — so the clone has nothing valuable to harvest |
| TT-07 | Malicious CSV: formula injection (`=cmd|…`) in a vendor name | Neutralised on import and on export |
| TT-08 | Operator abuse: read another org without a reason | Refused; reason string is mandatory and logged |

## 18.5 Brand-in-product tests

| ID | Check | Pass |
|---|---|---|
| BT-01 | Contrast on every text/background pair | All ≥ 4.5:1; automated check in CI |
| BT-02 | Truncated buyer name: "Nigerian Bottling Company Limited (Coca-Cola Hellenic)" | Wraps to two lines, never ellipsised mid-word, never overlaps the mark |
| BT-03 | Lockup on the printed receipt at 44px, 1-bit | Mark solid and legible; nothing thinner than 7 units |
| BT-04 | Correct icon on splash, launcher, favicon, notification, WhatsApp avatar | Each uses its documented variant; the full mark never appears below 24px |
| BT-05 | No stretched artwork anywhere | Every `<img>` has explicit width and height. **This is the F2 failure from Phase 10 turned into a permanent test** |
| BT-06 | Copy matches the deck verbatim | Automated string check on the ten highest-traffic strings |
| BT-07 | No banned word appears in the UI | Automated check against the §8.2 ban list, including `!` in transactional strings |

## 18.6 Release tests

| ID | Check |
|---|---|
| RT-01 | First launch on a clean profile does not error; the service worker installs |
| RT-02 | Permission prompts carry the explanatory copy before the OS dialog |
| RT-03 | Store/PWA listing text matches the product exactly — no claim the product cannot keep |
| RT-04 | `supplier_invoice_irn_issued` observed firing in production, once, with correct properties |
| RT-05 | Sentry receives a deliberately triggered error with a source map |
| RT-06 | **Backup restore rehearsal completed and timed under 30 minutes** |
| RT-07 | Secret-shape validation blocks boot with a missing variable |
| RT-08 | Health endpoint reports database, gateway and SMS reachability |

## 18.7 One-day execution plan for a single QA

| Time | Block |
|---|---|
| 09:00–10:00 | RT-01…RT-08 on staging |
| 10:00–12:00 | PS-01…PS-05 on the Tecno, then on the Samsung |
| 12:00–13:00 | PS-06, PS-09, PS-10, PS-12 |
| 14:00–15:30 | TT-01…TT-08 |
| 15:30–16:30 | Buyer console: AT-13…AT-15 manually, plus PS-13 |
| 16:30–17:30 | BT-01…BT-07, and the copy audit for PS-14 |
| 17:30–18:00 | Defect log written up and severities assigned |

Automated tests (AT-01…AT-20) run in CI on every push and are not part of the
manual day.
