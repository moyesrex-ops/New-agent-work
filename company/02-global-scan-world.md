# Phase 1 — Global Scan, Part B: EVERY OTHER REGION

Operator notes. West Africa is in `02-global-scan-west-africa.md` and is not summarised here.

> **Access note.** Four delegated research streams were commissioned for this section. One returned a model usage-limit error and the remainder were cut off when the cloud subagent quota was exhausted. Everything below is therefore my own directly-sourced research, which means it is narrower than planned. I say so rather than pretending to coverage I do not have. The regions are all inspected; the depth is uneven and I flag where.

---

## 1.B.1 The pattern that showed up on every continent

Twenty-two of the roughly sixty opportunities I collected trace back to one force: **a tax authority has made structured electronic invoicing legally mandatory, and the enforcement is transmitted commercially, buyer to supplier, rather than administratively, state to supplier.**

This is the closest thing to a global law of user-arrival I found. It is worth stating precisely because the exceptions matter as much as the rule.

| Country | Instrument | Small-business position as of 31 Aug 2026 | Direction |
|---|---|---|---|
| Poland | KSeF | Large (>PLN 200m) 1 Feb 2026; **all other VAT-registered 1 Apr 2026**; all businesses incl. non-VAT 1 Jan 2027. Invoice outside KSeF = "not issued", VAT deduction denied | Tightening |
| France | Réforme facturation électronique | **Receiving mandatory for everyone 1 Sept 2026**; issuing: large/mid 1 Sept 2026, SMEs/micro/auto-entrepreneurs 1 Sept 2027. Via PPF or a certified PDP | Tightening |
| Belgium | Peppol UBL 2.1 | All B2B from 1 Jan 2026 | Tightening |
| Germany | §14 UStG / Wachstumschancengesetz | Receiving mandatory since 1 Jan 2025 **including Kleinunternehmer, refusal not allowed**; issuing >€800k from 1 Jan 2027, all from 1 Jan 2028; micro <€22k exempt from issuing | Tightening |
| Italy, Romania | SdI, e-Factura | Live, fines already being enforced | Enforcing |
| Nigeria | NRS MBS | Large enforced now; medium live 1 Jul 2026; emerging 1 Jul 2027 | Tightening |
| Côte d'Ivoire | FNE | All regimes incl. micro since 1 Dec 2025; **national control sweep from 1 Sept 2026** | Enforcing |
| Ghana | VAT Act 2025 / E-VAT | Live 1 Jan 2026; flat-rate scheme abolished; manual booklets being phased out | Enforcing |
| Kenya | eTIMS | Non-deductibility since 2024; **return-level validation from 1 Jan 2026** | Enforcing |
| India | GST IRP | ₹5 crore threshold since Oct 2023; proposed ₹3 crore from Apr 2026 **deferred** | Stalled at the bottom |
| Brazil | NFS-e Nacional | MEI since Sept 2023; **ME/EPP in Simples Nacional deferred to 1 Nov 2026** (Res. CGSN 191, 4 Aug 2026); IBS/CBS for Simples from 1 Jan 2027 | Slipping but arriving |
| Vietnam | Decree 70/2025 | Household businesses ≥VND 1bn since 1 Jun 2025; lump-sum tax abolished 1 Jan 2026; threshold to VND 800m in 2027, all VAT households 2028 | Tightening slowly |
| **Malaysia** | **LHDN MyInvois** | **Threshold RAISED from RM1m to RM3m effective 1 Sept 2026, exempting 1.1 million businesses. Phase 5 cancelled outright** | **RETREATING** |

### The Malaysia exception, and why it is the most useful data point in this scan

On **30 August 2026 — yesterday** — Malaysia's Prime Minister announced in the National Day address that the e-invoicing threshold rises from RM1m to RM3m from 1 September. LHDN confirmed it benefits **more than 1.1 million businesses** now exempt `REPORTED` (The Star, Scoop, The Sun, all 30 Aug 2026). Phase 5, which would have covered RM500k–RM1m from 1 July 2026, had already been cancelled outright by Cabinet on 6 December 2025 `REPORTED` (Airwallex).

Vietnam softened too. Its tax authority publicly disputed the narrative that Decree 70 closed Hanoi markets, noting that of 2,961 household businesses that suspended operations in May–June 2025, only 263 (8.8%) were even in scope, and that only 4,979 of Hanoi's 311,000 managed household businesses — **1.6%** — met the VND 1bn threshold `REPORTED` (VietnamNet, Hanoi Tax Department Zone I). India's ₹3 crore reduction was deferred.

**`INFERRED`, and this is the single most important strategic conclusion in Act I:**

> Governments retreat from forcing the smallest merchants. They do not retreat from forcing large buyers. Any thesis that depends on a tax authority compelling a micro-merchant is politically fragile. Any thesis that depends on a **large buyer already in scope** needing clean documents from its supplier tail is commercially durable, because the buyer's own obligation does not get repealed to protect somebody else's supplier.

This kills the naive version of "sell e-invoicing to micro-merchants" and it is the reason the eventual winner is built around the buyer, not the tax office. It is tested explicitly in Phase 4 SIM 10 and again in Phase 5 sensitivity.

---

## 1.B.2 Western Europe

**Recurring pain.** Freelancers and micro-firms are caught in an asymmetry: they must be able to *receive* structured invoices immediately but need not *send* them for years. German guidance is blunt — from 1 Jan 2025 every business including Kleinunternehmer must be capable of receiving structured e-invoices and **"refusal is not allowed"** `REPORTED` (ClearTax DE). Meanwhile the sending obligation for Kleinunternehmer issuing §19 no-VAT invoices *"remains a grey area"* `REPORTED` (EU E-Invoicing Hub) — a legal fog that generates exactly the anxious search demand that sells software.

The commercial mechanism is spelled out for European suppliers in the same terms as Lagos:

> "The biggest hidden risk: non-compliant invoices can cost your client their VAT deduction, which damages your business relationship."
> — Facturwise `REPORTED`

And on why to comply before you must: *"Your clients (grandes entreprises, ETI) will begin requesting structured invoices from their German suppliers as they update their procurement systems in 2026–2027."* `REPORTED`

**Absorbing demand:** Lexware, sevDesk, FastBill, Billit, Xero, ClearTax DE, and in France the certified PDP layer. **Gap:** the PDP/Peppol access-point layer in France and Poland is priced for accountancies, not for a two-person Warsaw firm — same shape as Nigeria's APP layer. **Assessment:** real, crowded, high CAC, mostly English/German/French search-driven acquisition. A good business, not a structurally-pulled one, and the incumbents are competent. Scored, not shortlisted.

## 1.B.3 Central and Eastern Europe

Poland is the sharpest: from **1 April 2026 every VAT-registered business** must issue through KSeF, and an invoice sent outside KSeF is *treated as not issued* with **VAT deduction denied** and penalties up to **100% of the VAT amount** `REPORTED` (Facturwise). Penalties were deferred to 2027, softening the near-term panic. Romania and Italy are already fining. **Assessment:** genuine forced demand, but the beachhead user is literate, banked, desktop-equipped and already has an accountant — the accountant is the incumbent and the accountant is not going away. Low product leverage. Scored, not shortlisted.

## 1.B.4 North America

The clearest *non-tax* pain I found anywhere, and the ugliest incumbent behaviour.

Home-services contractors are being extracted by lead marketplaces and they are loud about it. Angi/HomeAdvisor charges **$15–$125 per shared lead plus a $300–$500 annual membership**, sells the same lead to **3–6 pros**, and imposes a **35% cancellation fee** on the remainder of the contract `REPORTED` (Trunetto, Savu LLC, Made For Builders — multiple independent 2026 sources agree on the ranges). One aggregator counts **2,064 BBB complaints in three years** `REPORTED`.

Verbatim:

> "Purchased a 3 month contract for $1,200. They provided 3 leads a week — 2/3 were fraudulent. Bogus names, dead numbers. ROI = $0."
> — Trustpilot, May 2025 `REPORTED`

> "Sales rep promised 6 high-quality leads/week. I got maybe 6 per month, none resulted in work. To cancel they demanded 35% of remainder of year."
> — BBB complaint, March 2026 `REPORTED`

Contractors have coined **"ghosts"** for leads that never answer; r/sweatystartup reports roughly **75% of Thumbtack "direct leads" go silent after first contact**, and you pay $40–$75 the moment you respond `REPORTED`.

**Absorbing demand:** Google Local Services Ads (exclusive leads, ~$39–$59 in home services) is where the anger flows, plus Jobber, Housecall Pro, QuoteIQ. **Gap:** the escape route (own website + Google Business Profile + LSA) requires marketing competence a two-truck plumber does not have. **Death risk:** this is a marketing-services business wearing a SaaS costume, CAC is paid-search-shaped, and Jobber/Housecall are well capitalised. High pain, mediocre structural pull, brutal competition. Shortlisted as **Candidate 4** precisely because it is the strongest *non-mandate*, *non-emerging-market* challenger and the memo needs the comparison to be real rather than rigged.

Also noted: US 1099-K threshold reverted to $20,000/200 transactions for 2025 `REPORTED`, removing a mandate I had expected to find. Canada has no B2B e-invoicing mandate.

## 1.B.5 Latin America and Caribbean

Brazil is the largest forced-invoicing population on earth and it is mid-migration. MEIs — around 15 million individual micro-entrepreneurs — have had to issue service invoices exclusively through the national NFS-e environment **since 1 September 2023** `OBSERVED` (gov.br NFS-e Technical Note, Res. CGSN 169/2022). Micro and small companies in Simples Nacional were due next and have just been **deferred to 1 November 2026** by Resolução CGSN nº 191 of 4 August 2026 `REPORTED` (OSP Contabilidade, Contábeis). IBS/CBS rules reach Simples on 1 January 2027, and until 31 December 2026 the absence of IBS/CBS data will not cause the national system to reject an NFS-e `REPORTED` (Ato Conjunto RFB/CGIBS nº 4/2026).

One detail with real product consequences: MEIs issuing via API **must sign with a qualified digital certificate (e-CNPJ)**, though the public web/mobile emitters do not require one `OBSERVED`. That is a classic seam where a friction-removal product lives.

Mexico (CFDI 4.0, Carta Porte), Colombia (DIAN, POS-ticket to electronic-invoice migration), Chile, Peru and Argentina are all mature clearance regimes. **Assessment:** the most sophisticated regimes in the world and correspondingly the most competent local incumbents — Bling, Tiny, Omie, Conta Azul, Alegra, Siigo, Facturama. Whitespace is thin. Scored, not shortlisted. `INFERRED` — I did not get the delegated depth here that I wanted, and I mark my confidence as moderate rather than high.

## 1.B.6 South Asia

India is the proof laboratory for counterparty coercion, and the mechanism is documented at a level of detail no other country offers.

Threshold ₹5 crore since 1 Oct 2023 (Notification 10/2023). Penalty **₹10,000 per non-compliant invoice** or the tax involved, whichever is higher, under CGST s.122(1)(i) — *each invoice attracts a separate penalty* `REPORTED`. Rule 48(5) makes an invoice without an IRN legally invalid, so the buyer fails the s.16(2) possession-of-a-tax-invoice test and loses input tax credit. And then this, which is the clearest articulation of the mechanism I found anywhere in the world:

> "When a large buyer with Rs. 500 crore turnover transacts with a newly onboarded supplier at the Rs. 5–10 crore level, the buyer's ITC reconciliation system immediately flags invoices without IRNs. **The buyer's accounts payable team withholds payment or demands rectification, placing commercial pressure on the small supplier that the GST law, by itself, does not impose.** This informal market enforcement mechanism accelerates compliance among suppliers who can adapt, but creates significant working capital stress for those who cannot."
> — Bhatt & Joshi Associates `REPORTED`

> "Counterparty pressure typically forces the supplier to comply."
> — KAMRIT `REPORTED`

> "Unorganised suppliers in manufacturing, logistics, and construction supply chains frequently operate without reliable invoicing systems. … The fix is not a vendor problem. It is a portal design problem."
> — IQInvoice `REPORTED`

**`OBSERVED` fact, high strategic value:** Indian buyers solved this by building IRN validation into *vendor portals*. The buyer paid to fix the supplier's problem. That is precisely the shape of the winning product, already validated in a market three years ahead of Nigeria — and India's version is enterprise middleware, not a phone-first tool the supplier actually enjoys using.

**Absorbing demand:** Tally (dominant, desktop, resented), Vyapar, myBillBook, ClearTax, Zoho, Marg, Busy. Blue-collar hiring: Apna, WorkIndia, Vahan. **Assessment:** India is the analog, not the beachhead. Too crowded, three years late, and the compliance layer is already commoditised.

Pakistan, Bangladesh, Nepal, Sri Lanka: FBR/NBR digital invoicing pushes exist. `INFERRED`, lower confidence — I lost the delegated depth here.

## 1.B.7 Southeast Asia

Vietnam and Malaysia are covered in 1.B.1 and constitute the retreat evidence. Indonesia's Coretax rollout in January 2025 was widely reported as troubled. Philippines BIR EIS continues.

**Assessment:** Vietnam is the only genuinely tightening SEA market for micro-merchants (VND 800m in 2027, all VAT households 2028), and KiotViet, Sapo and MISA already own that merchant base with hardware-plus-software bundles. Malaysia just removed 1.1m businesses from scope. Not a beachhead. Scored, not shortlisted.

## 1.B.8 East Asia and Oceania

Japan's qualified invoice system and Australia's Peppol eInvoicing are live but voluntary for B2B; Australia's payday super from July 2026 is a real employer mandate but the payroll incumbents (Xero, MYOB, Employment Hero) are strong. China is not addressable by a $20,000 startup. Korea's e-Tax Invoice has been mandatory since 2011 and is fully absorbed. **No beachhead here.** Stated plainly rather than padded.

## 1.B.9 MENA and East/Southern Africa

Depth lost to the subagent failure; I inspected these directly but shallowly and I will not overstate.

- **Kenya** is materially covered in the West Africa document because it is the operative *analog*, not because it is West African. eTIMS non-deductibility since 2024, return-level validation from 1 Jan 2026, and a **buyer-initiated invoicing** provision for suppliers under KES 5m turnover `REPORTED`.
- **Egypt (ETA), Saudi (ZATCA Fatoora), Turkey (e-Fatura), UAE, Morocco** all run descending-threshold clearance regimes. `INFERRED` from the global pattern rather than verified in detail here. Saudi and UAE are also the destination side of the Gulf recruitment-debt corridor.
- **South Africa**: SARS VAT modernisation is announced but not a 2026 mandate; PayShap is live. Yoco and iKhokha own the small-merchant terminal base.

## 1.B.10 Cross-cutting non-finance arenas (deliberate anti-monoculture check)

I forced myself through the non-finance arenas so the Five would not all be one category. Findings, compressed:

**Medicine authenticity.** WHO: **at least 1 in 10 medicines in low- and middle-income countries are substandard or falsified**, ~**US$30.5 billion** spent annually on them `OBSERVED` (WHO fact sheet; 2017 GSMS study, 48,000 samples, 88 countries — note the headline figure is now nine years old and WHO still publishes it). Nigeria specifics: poor-quality antimalarials alone estimated at **12,300 deaths and ~US$892 million a year**; 25.4% of 260 essential-medicine samples in Enugu and Anambra failed USP-42; NAFDAC seized falsified medicines worth over ₦684 million in 2022–2024 `REPORTED` (Narra X, 2025). NAFDAC's Mobile Authentication Service — scratch-code plus SMS — exists and **utilisation remains low**, defeated by network and SMS delays, low rural awareness, elitist campaign messaging, and the fact that verification is time-consuming at the counter `REPORTED`.
**Verdict:** catastrophic pain, seventeen years of failed consumer-verification products, no payer. mPedigree and Sproxil proved you can build it and still not get used. Enters the longlist, dies publicly in Phase 2.

**Migrant recruitment debt.** Recruitment fees are ~**15% ($5.6bn) of illegal annual profits from international migrant labour**, and ~**20% of all forced-labour cases arise from debt bondage** `OBSERVED` (ILO Global Study on Recruitment Fees, 2024). Nepal's first national survey: two-thirds of migrants incur costs, averaging **3.3 months of earnings** to recover (4.5 for women), highest via unregistered brokers `REPORTED` (NSO Nepal/ILO, 2023 survey). Against a legal service fee of NPR 10,000, workers actually pay **NPR 200,000–500,000** `REPORTED` (Kathmandu Post, 9 Aug 2026, quoting Nepal's DoFE which acted against **771 manpower agencies** out of ~1,200 active). Bangladeshi workers to Qatar typically pay **$3,000–$4,000** against wages as low as $275/month `REPORTED` (Guardian investigation).
And the honest killer, from the same reporting: pre-departure orientation centres *"have done little to curb recruitment fees, because these are paid much earlier in the recruitment process"* `REPORTED`; digital platforms like eMigrate and FWCMS *"often function as state-sanctioned monopolies that digitize existing exploitative structures"* `REPORTED`.
**Verdict:** the most morally urgent problem in this scan and the one where a $20,000 app is least likely to change an outcome. Shortlisted as **Candidate 3** anyway, and killed honestly in Phase 4 rather than quietly dropped, because ducking it would be cowardice.

**Housing anti-fraud, vocational hiring, agri offtake, used goods, last-mile paperwork, PAYGo energy, micro-insurance:** inspected, scored in Phase 2, all rejected for the reasons given there. Housing survives to **Candidate 5**.
