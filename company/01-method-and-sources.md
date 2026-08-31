# Phase 0 — Research Protocol, Method and Sources

**Date of research:** 2026-08-25 → 2026-08-31
**Evidence labels used throughout:** `OBSERVED` (I read the primary document or the platform's own page), `REPORTED` (credible secondary press / advisory firm), `INFERRED` (my reasoning from two or more sourced facts), `SPECULATIVE` (a guess, flagged as such).

## 0.1 How I searched

Five parallel research streams, then a manual West Africa stream I ran myself because the brief makes it first-class and I did not want it summarised by a delegate.

| Stream | Scope | Method |
|---|---|---|
| A | Europe (Western + CEE) + a global regulation-forced-demand index | Web search + primary tax-authority pages, EU legal acts |
| B | North Africa, Middle East, East Africa, Southern Africa | Web search + tax authority pages + local press + trader-association statements |
| C | South Asia, Southeast Asia, East Asia, Oceania | Web search + tax authority pages + app-store/incumbent teardown + forum complaints |
| D | Latin America & Caribbean + North America | Web search + SAT/DIAN/Receita pages + pro-contractor forums |
| E | Non-finance arenas worldwide (housing fraud, clinics, medicine authenticity, vocational hiring, migrant docs, wage theft, school fees, agri offtake, used goods, safety, last-mile paperwork, micro-insurance, PAYGo energy) | Web search + WHO/ILO/IOM/IFC/GSMA + startup graveyard research |
| F (manual) | Nigeria, Ghana, Côte d'Ivoire, Senegal | Web search on NRS/GRA primary notices, Nairametrics/TechCabal/BusinessDay, LASRERA, Moniepoint, startup post-mortems |

### Source classes actually used
- **Primary regulator documents:** Nigeria Revenue Service MBS developer community and public notices; Ghana Revenue Authority E-VAT Guidelines PDF; Kenya Revenue Authority *User Guide — Income and Expense Validations in Income Tax Returns* (May 2026 PDF); EU Regulation (EU) 2025/2650; EU Regulation (EU) 2023/1115.
- **Advisory / tax-technical:** EY Tax News, VATupdate, EDICOM, Nigerian law firm briefings (AO2Law), BusinessDay technical opinion pieces.
- **Local business press:** Nairametrics, TechCabal, TheCable, Techpoint Africa, Graphic Online (Ghana), The Independent Ghana, The Kenya Times, Kenyans.co.ke.
- **Incumbent primary pages:** moniepoint.com/moniebook (pricing, positioning), lasrera.lagosstate.gov.ng.
- **Startup graveyard / post-mortems:** TechCabal on KippaPay, Liners graveyard, practitioner LinkedIn post-mortems.
- **Complaint mining:** Facebook comment threads under Nigerian tax explainer posts, tenant testimony in Nairametrics, GUTA (Ghana Union of Traders' Association) statements, trader-strike reporting.
- **Multilateral data:** IFC working-capital estimates, WHO falsified-medicines figures, ILO/IOM recruitment-cost data.

### What I could not do, stated plainly
- `OBSERVED` I have no access to private product analytics, cap tables, or paid databases (Crunchbase Pro, Dealroom, Tracxn, SimilarWeb, data.ai). Where the brief asks for those, I used public pages and press coverage of the same companies and I say so.
- I did not conduct primary user interviews. Every "user says" in this memo is a sourced quote from a public complaint, review, or press interview, or it is labelled `INFERRED`.
- I did not run app-store scraping. Category-leader claims are `REPORTED` from press, not measured.
- **Therefore:** no simulation in Phase 4 claims measured conversion. Funnel numbers are explicitly labelled as assumption ranges with the analog they were anchored to.

## 0.2 The three buckets

**Bucket A — existing startups already pulling users (study the mechanism).**
Moniepoint (Nigeria, 1m+ active POS terminals `REPORTED`, ~2m business users `REPORTED`), OPay, PalmPay, Paystack, Flutterwave, Wasoko/Maxab, Yoco and iKhokha (South Africa), Cartona and MNT-Halan (Egypt), Vyapar and myBillBook (India), KiotViet and MISA (Vietnam), Bling and Tiny (Brazil), Alegra and Siigo (Colombia), Tabby (Gulf), Jobber and Housecall Pro (US/Canada), Apna and Vahan (India blue-collar hiring), Jiji (West/East Africa classifieds).

**Bucket B — painful demand with weak or absent products.**
Micro-supplier compliance under buyer-forced e-invoicing; tenant-side rental fraud verification in Lagos/Nairobi/Jo'burg; cocoa cooperative EUDR plot data in Côte d'Ivoire and Ghana; Gulf-corridor recruitment-debt transparency; wage/shift proof for informal field labour; clinic queue and record continuity; last-mile government paperwork agents.

**Bucket C — transferable models awaiting re-localisation.**
The **buyer-initiated invoice** (Kenya's eTIMS carve-out for suppliers under KES 5m) is the single most transferable mechanism I found: it moves the burden of onboarding a micro-supplier onto the buyer who needs the deduction. It exists in Kenya. It is not productised anywhere I could find. Also transferable: the *proof card* pattern (a screenshot-forwardable receipt object) that Paystack/M-Pesa normalised; the *agent-assisted onboarding* pattern from Moniepoint and India's CSC network; the *co-op field-data collection* pattern from Fairtrade's Plot Insights.

## 0.3 Repeating user-arrival mechanisms extracted

Ranked by how often they showed up in the evidence, best first.

1. **Counterparty coercion.** A user adopts because someone who owes them money will not pay without it. Strongest observed force in the entire scan. Seen in Nigeria (large taxpayers required to receive only IRN-bearing invoices from July 2026 `REPORTED`), Kenya (expense non-deductibility without eTIMS since 2024 `OBSERVED` via KRA guide), India GST, Malaysia LHDN, Vietnam Decree 70.
2. **Deadline with a penalty attached.** Users arrive in a spike near a date. Requires the date to be *already law*, not proposed.
3. **Agent networks.** A commissioned human puts the app on the user's phone. Nigeria POS agents, India CSC, Brazil despachante.
4. **Congregation-point word of mouth.** Market associations, trade unions, church/mosque business groups, campus, clinic waiting rooms, WhatsApp trade groups.
5. **Visible proof forwarded.** A user shares a receipt/status card in a WhatsApp group and it recruits.
6. **Switching from a hated extractive incumbent** (lead-fee marketplaces, informal agents charging 35% of annual rent).
7. **Search demand** — weak in low-literacy informal markets, strong in US/EU/India professional segments.
8. **App store category browse** — weak, over-credited.
9. **Paid ads** — treated as a *penalty* signal in scoring, per the brief.
10. **Assumed virality** — banned. Not counted anywhere in this memo.

## 0.4 Assumption log (opened Phase 0, carried to the end)

Living log. Every assumption that materially affects the decision gets an ID and is re-tested later. Full log in `13-appendix.md`; the load-bearing ones are:

| ID | Assumption | Status at Phase 0 | Where tested |
|---|---|---|---|
| A1 | Tax-authority e-invoicing mandates already enacted will not be repealed, only delayed | Open | Phase 4 SIM 10, Phase 6 risk register |
| A2 | Large buyers will actually reject non-compliant supplier invoices rather than absorb the VAT | Open | Phase 4 SIM 1/2 |
| A3 | Micro-suppliers will pay money to keep a customer, even though they will not pay for bookkeeping | Open | Phase 4 SIM 6 — this is the Kippa test |
| A4 | A phone-first, low-literacy-tolerant compliance tool is technically buildable against a national clearance API for ~$20,000 | Open | Phase 16 |
| A5 | Buyer-side procurement staff will invite suppliers if it saves them stranded VAT | Open | Phase 4 SIM 3/7 |
| A6 | Bad-network West African conditions make offline-first mandatory, not optional | Open | Phase 16, Phase 18 |
