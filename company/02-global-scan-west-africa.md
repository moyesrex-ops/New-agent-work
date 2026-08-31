# Phase 1 — Global Scan, Part A: WEST AFRICA (first-class scene, researched directly)

Operator notes. Not travel copy. Every claim labelled.

## 1.A.1 The single biggest thing happening in West Africa commerce right now

Four West African tax authorities have, within roughly eighteen months of each other, made electronic invoicing legally mandatory and are now moving into the enforcement phase. This is not a proposal, a white paper, or a pilot. Laws are passed, portals are live, penalties are written, and sweeps are scheduled.

| Country | Instrument | Who is in scope | Live / enforcement | Evidence |
|---|---|---|---|---|
| **Côte d'Ivoire** | Facture Normalisée Électronique (FNE), DGI | **All businesses, every tax regime — explicitly including micro-enterprises (RME) and the *entreprenant* regime (TCE/TEE)**. Twelve narrow sector exemptions (banks, pharmacies, airlines, fuel-pump sales, etc.) | Mandatory for all since **1 Dec 2025**; DGI note of **21 Aug 2026** announces a **nationwide control sweep from 1 Sept 2026** naming RNI, RSI, RME and entreprenant firms and warning of fines | `OBSERVED` DGI FNE presentation PDF (fne.dgi.gouv.ci); `REPORTED` KOACI 26 Aug 2026 |
| **Ghana** | VAT Act 2025 (Act 1151) + E-VAT / Certified Invoicing System, GRA | VAT-registered taxpayers; **the VAT Flat Rate Scheme was abolished**, threshold raised GH¢200k → GH¢750k, unified effective rate 20% | In force **1 Jan 2026**. GRA is phasing out manual VAT receipt booklets in favour of E-VAT and Fiscal Electronic Devices | `OBSERVED` GRA E-VAT Guidelines PDF; `REPORTED` Graphic Online, TIG Post (GUTA–GRA meeting, Accra, 7 Jan 2026), VATupdate Apr 2026 |
| **Nigeria** | National E-Invoicing / Electronic Fiscal System, "Merchant Buyer Solution" (MBS), Nigeria Revenue Service | Phased by turnover. Large (≥₦5bn) live 1 Aug 2025, **final compliance deadline 31 July 2026**. Medium (₦1–5bn) go-live **1 July 2026**, enforcement Jan–Mar 2027. Emerging (<₦1bn) go-live **1 July 2027**, enforcement 2028 | Large-taxpayer enforcement is **now** | `OBSERVED` community.nrsmbs.com, NRS Facebook notice 31 Jul 2026; `REPORTED` Nairametrics 19 Jul 2026, TheCable, EDICOM |
| **Senegal** | Loi n°2025-02 of 28 Dec 2024, art. 447 CGI, DGID | All VAT-registered taxpayers | Legal obligation exists; **implementing ministerial decrees still pending**. Phased rollout expected (receipt 2026, issuance 2027) | `REPORTED` Facturaal, digabloPos. **`SPECULATIVE`** on exact dates — I will not build a thesis on Senegal timing |

Benin went first in the region `REPORTED`, and a Senegalese DGID delegation visited Benin's DGI to study the reform `REPORTED` — regional policy diffusion is observable, not assumed.

### Why this matters more than the tax angle suggests

The interesting mechanism is not "government makes small business file taxes." Small businesses have ignored tax authorities in this region for decades and will continue to. The interesting mechanism is **counterparty coercion**, and Nigeria demonstrates it most cleanly.

Under the MBS clearance model, an invoice acquires legal tax standing only when it is transmitted through an accredited Access Point Provider and returned with an **Invoice Reference Number (IRN)** and a signed QR seal `OBSERVED` (community.nrsmbs.com). A BusinessDay technical assessment puts it bluntly:

> "An invoice not transmitted through an accredited Access Point Provider (APP) and validated by the NRS is not, for tax purposes, a legally recognised invoice, regardless of whether it accurately reflects a genuine commercial transaction. A document's tax status now turns on its transmission history, not just its content."
> — BusinessDay NG, technical assessment `REPORTED`

And the consequence lands on the *buyer*:

> "If you purchase from a supplier that has not implemented MBS compliance, the invoices you receive carry no IRN and cannot support an input VAT recovery claim. That VAT is stranded. … On N400 million in VAT-inclusive purchases, that is N52 million in stranded, unrecoverable VAT materialising now, driven by an enforcement gap, not any statutory exemption."
> — BusinessDay NG `REPORTED`

**An honest caveat, because the memo standard demands it.** One well-argued practitioner piece disputes the strict legal version of this claim:

> "Nigeria Tax Act 2025 section 155(4) sets out the conditions for deducting input tax. There are three… There is no IRN condition. There is no valid-e-invoice condition. … So the honest position is this. An IRN is not a statutory precondition for input VAT deduction. **The exposure is systemic rather than statutory, and it is real anyway.** … From July 2026 [NRS] requires large taxpayers to receive only IRN-bearing invoices from suppliers. An unfiscalised purchase invoice is therefore expected to fail at the return and matching stage rather than by operation of a statutory disallowance."
> — practitioner guide, LinkedIn, 2026 edition `REPORTED`

**Assessment (`INFERRED`):** the conflict is about legal route, not about outcome. Both readings agree that from July 2026 a large Nigerian buyer's return will not cleanly absorb a supplier invoice without an IRN. For a supplier the practical experience is identical either way: *accounts payable stops paying you until you send a compliant invoice.* I record the conflict rather than hiding it, and I treat the strict statutory version as unproven.

### The precedent that proves the mechanism works — Kenya

Kenya ran this exact experiment three years ahead of West Africa, and the results are documented rather than hypothesised.

- Finance Act 2023 amended the Income Tax Act so that **expenditure is not deductible if the invoice was not generated from an electronic tax invoice management system** `REPORTED` (EY Tax News).
- From **1 January 2026** KRA validates declared income and expenses in income-tax returns directly against eTIMS data `OBSERVED` (KRA, *User Guide — Income and Expense Validations in Income Tax Returns*, May 2026 PDF). Where claimed expenses exceed the value of eTIMS invoices transmitted with the buyer's PIN, they are flagged.
- The pressure transmits down the chain exactly as predicted. Practitioner guidance to Kenyan businesses reads: *"Pull the last 12 months of supplier payments. For each one, confirm you hold a compliant eTIMS invoice. Contact suppliers to reissue where missing, and use **buyer-initiated invoicing** for genuinely small suppliers under KES 5 million turnover."* `REPORTED`
- Worked example from the same source: a shop with KES 5m turnover and KES 3m of supplier costs, half from non-eTIMS suppliers, eats KES 450,000 of extra annual tax `REPORTED`.
- KRA had to build an escape hatch — a "Manual Non eTIMS/TIMS Expenses" field requiring a CSV upload plus a single PDF under 10MB of supporting documents, and it is **explicitly a one-year concession for the 2025 return only** `OBSERVED` (KRA guide; Kenyans.co.ke, The Kenya Times).

**`INFERRED`, high confidence:** the concession is the tell. A tax authority does not build a manual-upload escape hatch unless a very large number of real suppliers failed to comply and real buyers screamed. That is the shape of the demand.

**Buyer-initiated invoicing is the most important thing I found in the entire scan.** Kenya legally permits the buyer to originate the compliant invoice on behalf of a small supplier. It exists as a rule. I could find no consumer-grade product built around it. That is whitespace with a legal mandate behind it.

## 1.A.2 Nigeria — Lagos operator notes

**Recurring painful problems**

1. **Getting paid, not getting taxed.** The IFC's regional director for Central Africa and Nigeria states roughly **$25 billion in working capital is locked in payment cycles between large enterprises and their smaller suppliers**, with suppliers waiting 90 days or more `REPORTED` (Guardian NG). The Finance Minister: *"Businesses that have delivered goods and services to large, creditworthy buyers cannot access the cash that is rightfully theirs, while those buyers sit on approved payables that take 30, 60 or 90 days to settle."* `REPORTED`
   Field texture from a 60-SME survey across Lagos, Abuja and Port Harcourt: construction averaging ~90 days outstanding with 75% of SMEs past 60 days; a Lagos metal fabricator waiting 90 days for ₦2.5m and borrowing ₦1m at 32% to make payroll `REPORTED` (Biznalytiq, Feb 2026 — single-source, small sample, treat directionally).
   One quoted exchange captures the power asymmetry: *"Our policy is 90 days net,"* said to a Lagos construction SME whose contract said 30 `REPORTED`.
2. **Tax reform arriving at the same time.** From 1 Jan 2026: CIT 0% for small companies at ≤₦100m turnover and <₦250m fixed assets (up from ₦25m), VAT registration threshold doubled to ₦50m, **TIN mandatory for all businesses**, and the first-month late-filing penalty jumped from ₦25,000 to ₦100,000 `REPORTED` (Techpoint Africa, AO2Law). Failure to issue a VAT invoice: **50% of invoice value** `REPORTED`.
   Note the *asymmetry that creates the wedge*: turnover under ₦50m means you do not charge VAT — but it does **not** mean your large customer stops needing a compliant document from you.
3. **Housing.** Lagos Tenancy Law 2011 and the LASRERA Law cap agency fees at 10% of annual rent, and LASRERA declared caution/inspection/finder's fees unlawful `OBSERVED` (lasrera.lagosstate.gov.ng). Reality, from a tenant quoted by name: *"For N400,000 basic rent, I paid N150,000 as agency fee and another N150,000 for legal fees, each equal to 37.5% of the rent"* — plus ₦100,000 refundable damages and ₦15,000 in viewing fees `REPORTED` (Nairametrics, 17 Oct 2025). Enforcement from June 2025 requires LASRERA accreditation to operate `REPORTED`.

**Who is already absorbing demand**
Moniepoint: 1m+ active POS terminals by 2025, ~2m business users, $700m+ MSME loans disbursed in 2025, national microfinance bank licence, and **Moniebook** — an offline-first bookkeeping/inventory/POS product at ₦6,000/month Core and ₦8,500/month Pro `OBSERVED` (moniepoint.com/moniebook, pricing via TechDinge). Also OPay Business Hub, PalmPay merchant tools, Kippa, Bumpa, Pastel, MyTreda (which runs market-specific landing pages for Balogun, Alaba, Computer Village, Ladipo, Ariaria and Onitsha, and a "Kippa alternative" page — a competitor doing exactly the congregation-point targeting this memo recommends) `OBSERVED`.

**The graveyard lesson — read this before proposing any SME tool for Nigeria**
KippaPay was discontinued Nov 2023 with ~40 layoffs; CEO Kennedy Ekezie cited naira devaluation destroying hardware margins `REPORTED` (TechCabal, 19 Oct 2023). Kippa raised $8m+, became a household name, and still could not monetise. The best post-mortem line I found:

> "Kippa didn't fail because people didn't need the product. It struggled because need did not convert to revenue. … Useful doesn't always mean payable. … where most SMEs are just trying to survive, anything that doesn't directly affect their cash flow quickly becomes 'I'll manage without it.'"
> — practitioner post-mortem, LinkedIn `REPORTED`

**`INFERRED`, and it governs this entire memo:** in West Africa, "helps you run your business better" does not convert. **"Your customer will not pay you without this"** might. The distinguishing variable is not product quality. It is whether a third party with money withholds it.

**Congregation points, named**
- **MATAN** — Market Traders Association of Nigeria, present in all 774 LGAs, claims to represent 40m+ traders, founded 1995, and already runs a **VAT Direct Initiative in partnership with FIRS** `OBSERVED` (matan.org.ng). A trade body that has already agreed to be a tax-collection channel is the single most interesting distribution asset in Nigeria.
- **Alaba International Market Amalgamated Traders Union**, which co-owns AlabaMarketplace.ng in a private partnership `REPORTED` — precedent that market unions will do commercial software JVs.
- **ASMATA** (Anambra State Markets Amalgamated Traders' Association) launched "ASMATA E-commerce Plus" at Onitsha Main Market `REPORTED`.
- Physical: Computer Village (Ikeja), Balogun, Alaba, Ladipo, Oke-Arin, Trade Fair; Ariaria (Aba); Onitsha Main Market.

**Infrastructure that makes a product newly possible**
NIBSS instant transfer rails; BVN/NIN identity; ~1.1m+ POS terminals in circulation `REPORTED`; the NRS MBS API itself, documented publicly with a developer community and a UBL-based schema integrating CAC, NIBSS, CBN and NCS `OBSERVED`; WhatsApp as the default commercial channel.

**Gaps people still complain about**
- No product sits between a micro-supplier and the MBS clearance layer at a price a micro-supplier will pay. Accredited APPs and System Integrators are enterprise-priced by construction `INFERRED`.
- The MBS registration model is explicitly *"only for Service Providers… Taxpayers do not register on MBS directly — they interact with the e-Invoicing system through their chosen Service Provider"* `OBSERVED`. **A mandatory intermediary layer, by design.** That is a licence-shaped moat, and it is the strongest single structural fact in this scan.
- Late payment: the Factoring, Assignments and Receivables Financing Bill has passed debate but **is not law** `REPORTED`. Per the brief, I will not build a thesis on an unpassed law.

## 1.A.3 Ghana — Accra operator notes

The VAT Act 2025 (Act 1151) landed 1 Jan 2026 and it was rough. It abolished the VAT Flat Rate Scheme — the simplified 4% regime that retailers between GH¢200k and GH¢500k turnover had used instead of standard VAT accounting — and pushed those traders into full input/output VAT with digital invoicing `REPORTED` (TIG Post, 7 Jan 2026).

GUTA (Ghana Union of Traders' Association) escalated fast enough that GRA met them in Accra on **7 January 2026**, one week after commencement, and agreed an interim arrangement for Q1 2026 `REPORTED`. The stated sector-level concerns were *"VAT record-keeping, input VAT claims, and calculation methods"* `REPORTED`.

Two months in, it still was not working:

> "Despite ongoing public education by the Ghana Revenue Authority (GRA), many businesses say they do not completely understand how to implement the new VAT reform… the short window between passage and enforcement did not provide the business community, particularly small and medium enterprises (SMEs), enough time to reconfigure their accounting systems and internal processes."
> — Graphic Online `REPORTED`

GRA's own E-VAT guidelines offer two paths: API integration for taxpayers with existing systems, or **free GRA-provided invoicing software** requiring *"a desktop or laptop, internet access, and a web browser"* `OBSERVED` (GRA E-VAT Guidelines PDF).

**`INFERRED`, high confidence:** requiring a desktop or laptop from a Makola or Kantamanto trader is a product failure with the force of law behind it. The free government option is free and unusable for the modal user. That gap is a business.

By April 2026 GRA was phasing out manual VAT receipt booklets entirely in favour of E-VAT and Fiscal Electronic Devices `REPORTED` (VATupdate).

**Congregation points:** GUTA itself (it already negotiates on members' behalf and got a meeting inside a week), Makola Market, Kantamanto, Suame Magazine (Kumasi), Abossey Okai spare parts.

## 1.A.4 Côte d'Ivoire — Abidjan operator notes

The sharpest dated event in this entire global scan.

- FNE became mandatory for **every business regardless of size or tax regime on 1 December 2025** `REPORTED` (KOMPTO guide, citing the DGI/Ministry communiqué), covering RNI, RSI, **RME (micro-enterprises)** and **TEE/TCE (the *entreprenant* regime — the smallest formal category, essentially licensed street-level commerce)**.
- The DGI issued a note dated **21 August 2026** announcing a **nationwide control operation on the use and delivery of the FNE and the electronic normalised receipt, running from Tuesday 1 September 2026**, naming all four regimes and warning that firms not yet registered on the FNE platform *"sont invités à régulariser leur situation sans délai"* under penalty of fines per the Livre des Procédures Fiscales `REPORTED` (KOACI, 26 Aug 2026).

**That sweep begins the day after this memo is dated.**

- The DGI provides three generation channels: enterprise software via API, the FNE web platform (direct entry or file import), **and a downloadable FNE mobile application** `OBSERVED` (DGI FNE presentation PDF).

**`INFERRED`:** Côte d'Ivoire has the most aggressive scope in the region — micro and entreprenant included from day one, no turnover carve-out — and the state has already shipped a mobile app. That last fact cuts both ways and I will not pretend otherwise: it lowers the value of a pure "make FNE easy on a phone" product in Abidjan specifically. It is a genuine competitive fact, not a footnote. (Tested in Phase 4, Candidate 1, SIM 2.)

## 1.A.5 Senegal — Dakar operator notes

Loi n°2025-02 of 28 Dec 2024 inserted an electronic-invoicing chapter into article 447 of the CGI: all VAT-registered taxpayers must issue, transmit and receive invoices electronically, through one of three channels — the public invoicing portal, a DGID-recognised dematerialisation platform, or authorised electronic invoicing machines `REPORTED` (Facturaal).

Critically, and to the credit of the source: *"Les conditions d'agrément n'étant pas encore toutes publiées, aucune plateforme privée ne peut aujourd'hui garantir un agrément définitif. Méfiez-vous des solutions qui s'affichent déjà 'conformes' ou 'agréées.'"* `OBSERVED` — accreditation conditions are not all published, so no private platform can currently guarantee approval.

**Decision:** Senegal is a **Phase 2 market, not a beachhead.** The obligation is real but the implementing decrees are pending, and the brief forbids depending on a law that has not fully landed. Revisit when the *arrêtés* publish.

## 1.A.6 West Africa — what I am NOT going to propose, and why

| Rejected here | Why |
|---|---|
| Another SME bookkeeping app for Lagos | Kippa's post-mortem is definitive on willingness to pay, and Moniepoint is now bundling Moniebook at ₦6,000/month against a payment relationship it already owns. Competing on "better ledger" against a distribution monopoly is suicide. |
| Verified rental listings marketplace, Lagos | The pain is loud and the LASRERA quotes are real, but supply-side liquidity requires the informal agents who *are* the fraud to cooperate. Two-sided cold start plus an adversarial supply side. Held for Phase 2, scored, not shortlisted. |
| Invoice factoring for Nigerian SMEs | Depends on the Factoring Regulation Bill, which is not law. Explicitly forbidden by the brief. |
| Cocoa EUDR traceability for Ivorian co-ops | Real mandate, real dates (30 Dec 2026 / 30 Jun 2027), but the buyer is a handful of European chocolate importers, the payer is a co-op or an exporter, and Fairtrade already offers Satelligence risk assessment free to producer organisations `OBSERVED`. Enterprise sales cycle wearing a smallholder costume. Scored in Phase 2, did not make the Five. |
| "Africa" as a market | Not a market. The Ghanaian flat-rate trader, the Ivorian *entreprenant* and the Lagos ₦40m-turnover fabricator have three different laws, three different portals and two different languages. |
