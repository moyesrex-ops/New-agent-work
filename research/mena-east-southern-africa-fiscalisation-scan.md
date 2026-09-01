# Stream B — North Africa, Middle East, East Africa, Southern Africa

**Research date:** 2026-08-31. **Window:** 2024–2026 unless noted.
**Evidence labels:** `OBSERVED` (primary document / official portal / earnings release) · `REPORTED` (named journalism, advisory-firm alert) · `INFERRED` (my reading of those facts) · `SPECULATIVE` (hypothesis, not sourced).

This stream ran late and landed after the Phase 6 decision. It did not change the
decision. It did change two things in the record, both written up in §0 below,
and one of them is a correction to a claim I made in `company/01-method-and-sources.md`.

---

## 0. What this changes, and what it does not

### 0.1 Correction: the buyer-initiated invoice **is** productised — by the tax authority itself

In `company/01-method-and-sources.md` §0.2 I called Kenya's buyer-initiated
invoice "the single most transferable mechanism I found" and wrote: *"It exists
in Kenya. It is not productised anywhere I could find."*

The second sentence is wrong, and this stream is what corrects it. `OBSERVED`:
KRA ships buyer-initiated invoicing itself, free, through two consumer channels —
eCitizen and the `*222#` USSD menu — with CSV batch upload, automatic
onboarding of the seller, and SMS consent. It is not a gap in the market. It is
a government feature with a statutory hook (Tax Procedures Act **s.23A(3A)**).

What I got right is that nobody has productised the *workflow around* it. What I
got wrong is the assumption that the mechanic was lying unclaimed. In the one
jurisdiction that has the mechanic, the state is the incumbent.

**Consequence for Stampa:** this becomes a named risk rather than an unexamined
assumption. See §0.2. It does not invalidate the thesis — Nigeria's NRS has
shipped no equivalent, and Stampa's product is supplier onboarding plus buyer
workflow rather than the bare legal mechanic — but "the revenue service builds
it for free" now has a dated precedent in a directly comparable jurisdiction,
which is a much stronger form of risk than a hypothetical.

### 0.2 One new entry for the risk register

The existing register has *"an accredited APP ships this first"* as risk #2. This
stream shows the more dangerous version: **the revenue service ships it first**,
free, on rails the merchant already has (USSD). Added to
`company/06-comparison.md` as risk #11, with the KRA precedent as the trigger to
watch.

### 0.3 Evidence that strengthens the premise

`REPORTED`. Kenyan eTIMS adoption, which is the closest available proxy for
"will the informal supplier tail onboard itself if the software is free":

| Date | Figure |
|---|---|
| Start of 2024 | **<1%** of eligible businesses |
| Sep 2024 | ~**323,000** onboarded |
| 30 Sep 2025 | **>500,000** onboarded, ~50% of KRA's target |
| Late 2025 | of those onboarded, only ~**49% actively transmit** |

`INFERRED`. Free government software, three channels including USSD, a statutory
deduction penalty on the buyer, two years of runway — and roughly half of the
registered tail still does not transmit. Registration is not adoption. This is
the strongest external evidence I have found for Stampa's core premise: **the
tail does not onboard itself, and the buyer's deduction is the only thing with
enough force to move it.** KRA's own response to this failure was to build BII,
which is a state admission that the tail cannot be onboarded directly.

### 0.4 What did not change

The Phase 6 decision, the wedge, the pricing model, and the P0 scope are
untouched. Nothing in this stream contradicts the Nigeria-specific evidence the
decision rests on.

---

## 1. Kenya — eTIMS, deductibility, and buyer-initiated invoicing

### 1.1 The legal ratchet

`OBSERVED`.
- Finance Act 2023 → Income Tax Act **s.16(1)(c)**: from **1 Jan 2024**, business expenses not supported by an eTIMS/TIMS invoice are **non-deductible**. Exemptions live in TPA **s.23A** (PAYE emoluments, EAC imports, investment allowances, airline tickets, financial-institution interest and fees, items under final withholding tax).
- Electronic Tax Invoice Regulations **2024**: applies to **all persons carrying on business**, VAT-registered or not.
- KRA public notice **7 Nov 2025**: from **1 Jan 2026** KRA validates income and expenses in returns against eTIMS, withholding tax and Customs data. Applies to **2025 year-of-income** returns.
- Escape hatch: an iTax menu item, *"Manual & Non eTIMS/TIMS Invoices"* — upload supporting documents, then declare in the tax computation sheet. `INFERRED`: a residual, not a strategy; heavy use flags the file.

### 1.2 Buyer-Initiated Invoicing — mechanics

**Statutory hook.** `OBSERVED`. TPA **s.23A(3A)**: where a supply comes from a
small business or small-scale farmer with **annual turnover ≤ KES 5 million**,
**the purchaser shall issue** the tax invoice so the purchase remains deductible.

**BII is not the same as Reverse Invoicing.** KRA separates them:

| | Buyer-Initiated Invoicing | Reverse Invoicing |
|---|---|---|
| Channel | eCitizen / `*222#` | Buyer's own billing system via OSCU/VSCU |
| Approval | Self-serve | KRA KYC approval |
| Device | None | Unique secondary device per seller |
| Cost | Free | Buyer bears all cost |
| Built for | Any buyer with small suppliers | Processors/exporters with hundreds of farmers |

**Flow.** `OBSERVED` (KRA BII page 2026; Bowmans, 9 Apr 2025):
1. Buyer signs in to their KRA profile on eCitizen, or dials `*222#` → Buyer Initiated Module. Selects **"Initiate Buyer Invoice."**
2. Enters seller ID/PIN, date, description, quantity, price — or uploads a **.csv** batch.
3. System validates the seller PIN and eTIMS status, and **blocks VAT-registered sellers**.
4. Seller is auto-onboarded if not already. SMS/USSD notifies them of a pending invoice and the buyer's name.
5. Seller **accepts or rejects within 30 days**; otherwise **auto-reject**.
6. On approval the invoice transmits to eTIMS in real time. Misuse leads the Tax Service Office to deactivate the buyer's eTIMS.

Bowmans tested it: *"We have tested the purchaser invoicing on eCitizen and
confirm that the reverse invoicing works as envisaged."* And on who it helps:
*"this may add to the administrative burden of purchasers… For Small Businesses,
it is a relief from… technical glitches, complex user interfaces and lack of
proper technology."*

`INFERRED`. Real users are large buyers of produce and informal services —
processors, exporters, construction, hospitality procurement — who otherwise lose
the deduction. Not dukas selling to walk-in cash customers, because there is no
"buyer" with an eCitizen workflow. `SPECULATIVE`: the ≤5m turnover test is
unenforceable against informal turnover, so PIN-level VAT status is the real
gate and the turnover figure is a legal fig leaf.

### 1.3 Cost, and where the money actually is

Official KRA software is **free** (Lite web, Lite USSD `*222#`, the "eTIMS Non
VAT" mobile app, the eTIMS Client for VAT filers). Users pay data and USSD
session fees. The paid layer sits above it — `REPORTED`, vendor sites 2025–26:
ESD/eTIMS integration at **KES 12,000–15,000**; OSCU eTIMS API at **KES 50,000**
ex-VAT; SME integrator projects at **KES 50,000–300,000+** setup plus recurring.

`INFERRED`. The money is not in Lite. It is in system-to-system for VAT shops
that already run a POS, in expense-side reclaim for SMEs whose costs sit in
M-Pesa, and in accountant workflow tooling for the Jan 2026 validation.

### 1.4 Reliability as a live grievance

`REPORTED`. 22–24 Jul 2026: a scheduled 20-hour maintenance window slipped.
Kiplang'at Godia: *"It's baffling that KRA made eTIMS mandatory for claiming
expenses, yet the system remains so unreliable."* `INFERRED`: once deduction is
gated on a rail, the rail's downtime becomes the taxpayer's liability, and the
mismatch surfaces at filing rather than on the day. This is a direct argument
for the store-and-forward queue Stampa already builds.

---

## 2. Uganda — the EFRIS trader revolt, and what a climb-down is worth

`OBSERVED / REPORTED`. On **8 Apr 2024** FUTA shut Kikuubo, Nabugabo, William
Street and Ben Kiwanuka; KACITA joined within the week; police used teargas
after tyre-burning. URA's Commissioner General had previously put Kikuubo at
**60–70% of the country's business transactions**. The strike was called off
**20 Apr 2024** after Museveni met 61 trade leaders at Entebbe, with a public
follow-up at Kololo on **7 May 2024**.

**What traders actually objected to** — five stacked grievances, and none of them
is "computers":

1. **Opacity.** Godfrey Katongole (KATA): *"We're protesting against Electronic fiscal receipting and invoice solution which is being put on us, yet we don't know how it works."*
2. **A flat UGX 6 million penalty per unissued e-invoice**, regardless of ticket size. Finance State Minister Henry Musasizi conceded the point to Parliament on **4 Apr 2025**: *"Concerns have been raised regarding the high penalties of Shs6M per invoice, regardless of the value of the transaction."*
3. **Hardware cost.** An accredited supplier sold the EFD at **UGX 1,100,000** installed. App and web portal were free, but the mandate was experienced as "buy the machine."
4. **Enforcement theatre** — goods intercepted between shops and bus parks, armed URA personnel in the hubs.
5. **Bundled tax politics** — 35% garment import duty, 18% VAT, rents up.

**What the climb-down bought.** Penalties suspended then waived for first-time
users; URA directed not to insist on the EFD (*"The people who cannot buy it
should be allowed to use the cheaper option"* — Museveni, Kololo); a downtown URA
office. **What it did not buy:** EFRIS itself (*"EFRIS is not problematic"*), or
the threshold rise from UGX 150m to UGX 1bn that FUTA demanded.

**And then it widened.** `OBSERVED`. General Notice **2218 of 2025**, effective
**1 Jul 2025**, pulls **non-VAT** businesses across 12 sectors into the mandate,
and the penalty is rewritten to **twice the tax due** for VAT-threshold
businesses.

`INFERRED`, and this is the transferable lesson: **a presidential climb-down buys
months, not a repeal.** URA had trained 15,023 traders door-to-door across 110
arcades before the strike. Training did not substitute for a penalty that could
exceed the day's cash. Design for the expansion wave, not the strike.

---

## 3. Egypt, Saudi, UAE, Turkey, Morocco — mandate calendar

| Jurisdiction | State on 2026-08-31 | Label |
|---|---|---|
| **Egypt** | B2B clearance live; paper invalid for input VAT since 2022. B2C e-receipt phased, 72-hour window. VAT/e-invoice threshold cut **EGP 500k → 250k**, newly in-scope register by **31 Mar 2026**, penalties from 1 Jan 2026. | `REPORTED` |
| **Egypt, Law 6/2025** | Turnover tax replaces profit tax below EGP 20m: **0.4%** (<500k) → **1.5%** (10–20m), five-year lock-in. ETA Chair Rasha Abdel Aal: e-invoice **and** e-receipt compliance is a *condition* of the regime. | `OBSERVED` (Gazette PDF) |
| **Saudi** | ZATCA Fatoora Phase 2 waves: 22 (>SAR 1m) 31 Dec 2025; 23 (>SAR 750k) 31 Mar 2026; **24 (>SAR 375k) 30 Jun 2026** — the VAT registration floor. Up to **SAR 2,500** subsidy per establishment ≤SAR 3m turnover. | `OBSERVED` via firm alerts |
| **UAE** | Peppol 5-corner, PINT-AE. Pilot 1 Jul 2026; **Phase 1 ≥AED 50m** live 1 Jan 2027 (ASP appointed by 30 Oct 2026); **<AED 50m** live 1 Jul 2027. 32 ASPs approved. | `OBSERVED` (MD 243/244 of 2025, amended 10 May 2026) |
| **Turkey** | e-Fatura at TRY 3m prior-year gross; **e-Arşiv per-invoice TRY 3,000 floor removed 1 Jan 2026** — every invoice, or an exemption. Schema churn continues (UBL-TR v1.43 live 14 Sep 2026). | `REPORTED` |
| **Morocco** | CGI Art. 145-IX is the hook. DGI DG signalled 2026 rollout, large B2B first; draft decree with SGG April 2026, **not in the Bulletin Officiel as of 2 Jul 2026**. SME dates forecast 2027–28. | `OBSERVED` as pending |

`INFERRED`. Egypt and Saudi are both ratcheting the threshold **down** toward the
micro-merchant. UAE is an enterprise ASP market in 2026 and an SME market only in
2H 2027. Morocco has no gazetted mandate to sell against. None of these is a
better first market than Nigeria for this product, and three of them are worse.

---

## 4. South Africa — the counter-example

`OBSERVED`. SARS's VAT modernisation consultation paper (Aug 2026) puts a
five-corner e-invoicing mandate on this path: draft regulations 2026/27, build
2027/28, QA 2028/29, voluntary pilot 2029/30, **phased mandate from 2030 plus
roughly 36 months**, large taxpayers first. Budget 2026 also **raised** the VAT
compulsory registration threshold **R1m → R2.3m**.

`INFERRED`. South Africa is moving in the opposite direction from Egypt and
Saudi: taking small firms *off* VAT and deferring the mandate by half a decade.
Any vendor selling 2028 urgency into South Africa is ahead of SARS's own paper.
Confirms the Phase 3 decision to drop South Africa from the longlist.

**Spaza registration, as a formalisation-by-mandate case study.** `OBSERVED`.
After 22 child deaths from foodborne illness in the weeks to 15 Nov 2024, a
directive gave every spaza 21 days to register. Registration closed 28 Feb 2025
with ~**82,000** registered → **44,696** verified → ~**15,000** licensed. DSBD
DG Thulisile Manzini, May 2026: *"Registration does not equate to licensing."*
`INFERRED`. A deadline plus an existential threat produced a dirty list, not a
formalised sector. Software that assumes *registered = licensed = banked* will
bounce — the same funnel-decay lesson as Kenya's 49% transmission rate.

---

## 5. Rest of the region

| Country | State 2026 | Read |
|---|---|---|
| **Rwanda** | EBM mandatory for every taxable activity, VAT or not. Android EBM 2.1 for micro. | Already done; the deduction link is the next move, not the device |
| **Tanzania** | VFD/EFDMS, TZS 14m turnover or VAT, pre-clearance QR | Hardware-to-virtual shift is the vendor slot |
| **Ethiopia** | Directive 1142/2026; accredited software; supplier bank guarantees **USD 10k–250k** | Accreditation cartel; effectively closed to a foreign SaaS |
| **Zambia** | Smart Invoice live 1 Jul 2024, penalties 1 Oct 2024; mobile app is turnover-tax only | Free ZRA apps; room in VSDC for ERPs, not for micro-merchants |
| **Zimbabwe** | Fiscalisation + FDMS, TaRMS integration from Dec 2025 | Currency and power risk dominate |

---

## 6. Graveyard, 2022–2026

| Firm | Fate | Cause of death | Quote |
|---|---|---|---|
| **Twiga** | Nairobi ops frozen ~60 days from late May 2025; ~319/435 staff cut; NewCo + 3PL | Owned the trucks; VC-opex distribution of fresh + FMCG | Internal: distribution centre at **$16–18k/mo vs $165k** today |
| **MarketForce / RejaReja** | B2B wound down Apr 2024; pivot to Chpter. Peak 270k merchants, $42.5m raised | FMCG unit economics, price wars, a flaking investor | Mbaabu: *"razor-thin margins… The segment is also highly price elastic"* |
| **Copia** | Administration May 2024; administrators petition insolvency May 2026. $123m raised | Last-mile to villages, agent float, no more rounds | Could not meet payroll; revival failed |
| **Wasoko–MaxAB** | Merged Aug 2024, markets cut to 5; Morocco e-commerce slowed 2025; VNV marked Wasoko −15% | Thin FMCG margin across eight-country opex; the merger was a cash-conservation event | Benzakour: *"we have decided to slow down our e-commerce activities"* |
| **Sky.Garden** | Insolvency Sep 2022, acquired by Lipa Later Dec 2022; Lipa Later itself in administration Mar 2025 | 8% take-rate marketplace carrying its own fulfilment | Majlund: *"we saw no other option than to file for insolvency"* |
| **Zumi** | Closed Mar 2023. $20m GMV, 5k retailers | Non-food B2B marketplace, no scale, no Series A | McCarren: *"our business was not able to achieve sustainability in time to survive"* |
| **Sendy** | Shut Aug 2023, asset sale | Logistics + Sendy Supply; key investor walked | Ran out of money ~2 months before close |
| **iProcure** | Administration 26 Apr 2024 | Agri-input B2B; debts due in the funding winter | Cannot pay debts as they fall due |
| **Gro Intelligence** | Shut May/Jun 2024. $117–125m raised | Agri-data platform with no sticky workflow; bridge died | *"use cases are endless"* — which is the post-mortem |

`INFERRED`, cause-class: **asset-heavy B2B commerce and data platforms without a
workflow died. Asset-light marketplaces with local-currency credit (Cartona) and
POS/fiscalisation software (Yoco, Foodics, Rewaa, Fawry) did not.** Consistent
with the Phase 2 West Africa graveyard reading on Kippa, and with the Phase 6
decision to sit on a mandate rather than move boxes.

---

## 7. Verified figures

| Metric | Figure | Date | Label |
|---|---|---|---|
| EFRIS device price | UGX 1.1m | 2024–25 | `OBSERVED` |
| EFRIS penalty, old → new | UGX 6m/invoice → 2× tax due | to Jun 2025 → from 1 Jul 2025 | `OBSERVED` |
| eTIMS onboarded | 323k → >500k | Sep 2024 → late 2025 | `REPORTED` |
| eTIMS actively transmitting | ~49% of onboarded | late 2025 | `REPORTED` |
| BII seller cap | KES 5m turnover | TPA s.23A(3A) | `OBSERVED` |
| Kenya expense deductibility | eTIMS invoice required | 1 Jan 2024; validated from 1 Jan 2026 | `OBSERVED` |
| Egypt SME turnover tax | 0.4–1.5% below EGP 20m | Law 6/2025, 1 Mar 2025 | `OBSERVED` |
| ZATCA Wave 24 | SAR 375k, 30 Jun 2026 | announced 26 Sep 2025 | `OBSERVED` via firm alerts |
| UAE Phase 1 | ≥AED 50m, live 1 Jan 2027 | MD 244/2025 as amended | `OBSERVED` |
| SARS e-invoicing mandate | phased from 2030 | consultation paper 2026 | `OBSERVED` |
| Spaza: registered → verified → licensed | ~82k → 44,696 → ~15k | Feb 2025 → May 2026 | `OBSERVED` |
| Fawry POS terminals | 354,000 | FY2025 | `OBSERVED` |
| Yoco merchants | >200,000 | 2026 | `REPORTED` |

---

## 8. Skeptic's close

The only demonstrated willingness-to-pay across this region in 2024–26 is
**(1) keep my deduction, (2) don't padlock my shop, (3) don't fine me UGX 6m for
a UGX 20,000 sale.** Marketplaces that moved boxes died. Tax and till software
that sat on a mandate lived. Uganda and South Africa proved the same thing from
opposite directions: a political climb-down buys months, not a repeal, and a
registration deadline produces a list, not a formalised sector.

For Stampa specifically, the load-bearing finding is Kenya's: **free government
software, three channels, a statutory penalty on the buyer, and roughly half the
registered tail still does not transmit.** That is the market. It is also the
warning — KRA's answer to that failure was to bypass the tail with a free
buyer-initiated module, and NRS can read the same playbook.
