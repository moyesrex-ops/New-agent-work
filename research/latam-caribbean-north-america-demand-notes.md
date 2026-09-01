# Operator Field Notes — Latin America & Caribbean + North America

**Coverage:** Brazil, Mexico, Colombia, Argentina, Chile, Peru, Dominican Republic, Guatemala; United States, Canada
**As of:** 2026-08-31. Source priority 2024–2026.
**Evidence labels:** `OBSERVED` = read directly on a primary/authoritative page (statute, regulator notice, SEC filing, complaint page). `REPORTED` = secondary press or vendor analysis. `INFERRED` = my reasoning chained off OBSERVED/REPORTED facts. `SPECULATIVE` = unverified guess, held loosely.

---

## 0. Three premise corrections up front

The brief asked me to verify several things. Three of them are wrong as stated, and the corrections change the investment thesis materially.

1. **Brazil's "split payment" is NOT a Jan 2026 pilot forcing MEIs onto new invoicing.** `OBSERVED` The Receita Federal told g1 on 2026-08-30 that mandatory split payment for B2B slips to **2028**, with the platform ready in early 2027 and optional/transaction-by-transaction adoption during 2027 as ~200+ financial institutions integrate ([g1, 2026-08-30](https://g1.globo.com/economia/noticia/2026/08/30/reforma-tributaria-receita-federal-diz-que-split-payment-obrigatorio-deve-comecar-so-em-2028-entenda.ghtml); [Estadão](https://www.estadao.com.br/economia/receita-preve-obrigatoriedade-do-split-payment-para-2028-saiba-o-que-falta/)). `OBSERVED` A Receita technician said flatly of MEIs: *"O MEI, ele vai pagar um valor fixo de CBS e IBS e o MEI, ele não transfere crédito para frente. Então o MEI não entra nessa."* MEIs are outside the split-payment mechanism. `INFERRED` Anyone selling "split payment readiness" to MEIs in 2026 is selling fear, not a product. The real 2026 forcing function on small business is **document-format and emitter migration**, not tax withholding.

2. **US 1099-K: confirmed reverted.** `OBSERVED` IRS Publication 1099 general instructions state TPSOs report only when **both** over $20,000 and over 200 transactions ([irs.gov/pub/irs-pdf/p1099.pdf](https://www.irs.gov/pub/irs-pdf/p1099.pdf)). `OBSERVED` OBBBA P.L. 119-21 §70432 (signed 2025-07-04) repealed the ARPA $600 floor and the Notice 2024-85 phase-in, retroactive "as if included in" ARPA §9674 ([Avalara, 2025-07](https://www.avalara.com/blog/en/north-america/2025/07/one-big-beautiful-bill-act-1099-reporting-threshold.html)). `OBSERVED` 1099-MISC/NEC thresholds rose to $2,000. `OBSERVED` Twelve states keep lower floors; Rhode Island is $100, a 200× gap to federal ([CeoCult 50-state map, v2 2026-06-11](https://ceocult.com/research/1099k-threshold-state-map-2026/)). `INFERRED` The federal relief killed the "1099-K panic" consumer wedge but created a *worse* problem: a filer in RI or MA gets a state 1099-K with no federal counterpart, and no consumer tool models this.

3. **Colombia's POS→e-invoice migration already happened, in 2024, and the 5-UVT threshold is dead.** `OBSERVED` Resolución DIAN 000165 de 2023, as modified by Resolución 000008 de 2024, phased mandatory *Documento Equivalente Electrónico* (DEE) POS: grandes contribuyentes 2024-05-01, renta declarants 2024-06-01, non-declarants and everyone else 2024-07-01 ([Alegra](https://blog.alegra.com/colombia/pos-electronico/); [Siigo](https://www.siigo.com/blog/obligaciones-fiscales/guia-pos-electronico/)). `OBSERVED` The old 5-UVT ceiling on paper POS tickets was superseded, not lowered — there is now **no minimum transaction value**; every POS sale transmits. Details in §3.

Everything below assumes those corrections.

---

## 1. Verified numbers

| # | Fact | Figure | Date | Source |
|---|---|---|---|---|
| 1 | Active MEI establishments, Brazil | 13,655,022 | Aug 2026 | [censoempresarial.com.br](https://censoempresarial.com.br/estatisticas/quantos-meis-existem-no-brasil) (RFB CNPJ open data) |
| 2 | MEI total incl. suspended/inapt | 16.6M; **4.6M in CadÚnico (27.9%)** | May 2026 | [Agência Brasil](https://agenciabrasil.ebc.com.br/economia/noticia/2026-05/quase-30-dos-microempreendedores-individuais-estao-no-cadastro-unico) |
| 3 | MEI in CadÚnico on Bolsa Família | 41.7% | 2025 study | [Sebrae/PR](https://sebraepr.com.br/impulsiona/mei-no-cadunico-novos-dados-sobre-inclusao-e-empreendedorismo/) |
| 4 | MEI survival: Sebrae-served vs not | 78.9% vs 61.5% active | 2025 | Sebrae/PR (same) |
| 5 | Pix volume, 2025 | 79.8bn tx / R$35.3tn (+25.7% / +33.8%) | FY2025 | [BCB Relatório de Gestão do Pix](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/relatorio_de_gestao_pix/relatorio_gestao_pix_2026.pdf) |
| 6 | Pix Automático launch | 2025-06-16; mandatory all FIs Jan 2026 | — | BCB (same) |
| 7 | Pix Automático scale | 2.87M tx / R$1.2bn in May 2026; R$4.5bn Jan–May | 2026-06-17 | [Extra/Globo](https://extra.globo.com/economia/noticia/2026/06/pix-automatico-faz-um-ano-com-287-milhoes-de-transacoes-por-mes-segundo-dados-do-banco-central.ghtml) |
| 8 | Pix Automático receivers (firms) | >1,000 by Dec 2025 | Dec 2025 | [The Shift](https://theshift.info/hot/relatorio-gestao-pix-2025-banco-central/) |
| 9 | BCB abandons Pix Parcelado regulation; bans the name | Dec 2025 (Fórum Pix, 4th) | 2025-12 | [Diário do Comércio](https://diariodocomercio.com.br/financas/banco-central-suspende-regulamentacao-pix-parcelado-adiamentos/) |
| 10 | Brazil Selic | 14.0% p.a. after Aug 2026 Copom | Aug 2026 | [BMC News](https://bmcnews.com.br/investimentos-e-financas/pix-no-credito-como-funciona-tem-juros-e-quais-bancos-ja-oferecem/) |
| 11 | NFS-e Nacional mandatory for ME/EPP Simples | **2026-11-01** (Res. CGSN 191/2026, postponed from 09-01) | 2026-08-04 | [Receita Federal](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/agosto/simples-nacional-nfs-e-nacional-sera-obrigatoria-para-me-e-epp-a-partir-de-1o-de-novembro-de-2026) |
| 12 | MEI must issue fiscal doc on **all** sales incl. to individuals | from 2027-01-01 (Res. CGSN 190/2026) | 2026 | [Seu Dinheiro](https://www.seudinheiro.com/2026/seu-negocio/como-a-reforma-tributaria-vai-afetar-o-mei-cbcb/); [Hopecont](https://hopecont.com/blog/nfse-emissor-nacional-obrigatoria/) |
| 13 | IBS/CBS fields become blocking on e-docs | **2026-08-03** (test rate 1%: 0.1% IBS + 0.9% CBS) | 2026-08-03 | [CGIBS](https://www.cgibs.gov.br/novo-marco-da-reforma-tributaria-inicia-em-03-de-agosto-com-preenchimento-obrigatorio-dos-campos-relativos-ao-ibs-e-a-cbs) |
| 14 | MEI ceiling bill (PLP 108/2021) | R$81k → R$130k (Senate text) / R$110k 2026 → R$140k 2027 (negotiated); **vote deferred past Oct 2026 elections** | 2026-08 | [InfoMoney](https://www.infomoney.com.br/mercados/falta-de-acordo-adia-para-depois-das-eleicoes-votacao-de-reajuste-no-limite-do-mei/); [Câmara PLP 108/2021](https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2295251) |
| 15 | Fiscal cost estimates | MEI ceiling: R$8.1bn to 2029; Simples band to R$8M: ~R$50bn | 2026-08 | InfoMoney (same) |
| 16 | Colombia DEE POS mandate | 2024-05-01 / 06-01 / 07-01 by group; no minimum value | Res. 165/2023 + 008/2024 | [Alegra](https://blog.alegra.com/colombia/pos-electronico/) |
| 17 | Colombia UVT 2026 / sanction cap | UVT $52,374; 950 UVT = **COP $49,755,300** | Res. 000238 de 2025 | Alegra (same) |
| 18 | Colombia payroll-doc (DSNE) late-filing sanction | **None reglamentada**; risk is deduction denial | Concepto 010193 de 2026 | [DIAN normograma](https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_10193_2026.htm) |
| 19 | Argentina FCEM mandatory threshold | ARS **$5,549,862** from 2026-04-14; 21-day accept window to 2026-10-31 | 2026-04-14 | [argentina.gob.ar](https://www.argentina.gob.ar/servicio/emitir-una-factura-de-credito-electronica-mipyme) |
| 20 | Chile boleta electrónica | Digital delivery mandatory for printer-less merchants **2026-03-01**; timbre optional on print from 2026-01-01 | 2026 | [Facele](https://facele.cl/normativa-de-facturacion-electronica-en-chile-2026-cambios-obligaciones-y-fechas-clave/) |
| 21 | Peru SEE | E-emitter status from **RUC registration day** (was 3rd month) from **2026-06-01** | RS 000075-2026/SUNAT | [gob.pe/SUNAT](https://www.gob.pe/institucion/sunat/noticias/1398485-contribuyentes-seran-designados-como-emisores-electronicos-desde-que-se-inscriban-en-el-ruc) |
| 22 | Dominican Republic e-CF small/micro deadline | **2026-11-15** (Aviso 06-26, automatic 6-month extension from 05-15) | 2026-05-06 | [Alegra RD](https://blog.alegra.com/republica-dominicana/prorroga-ecf-pymes/); [HolaBill](https://blog.holabill.com/posts/fechas-facturacion-electronica-rd) |
| 23 | Mexico RESICO-PF | ISR 1%–2.5%, cap MXN $3.5M; recargos rose to **2.07%/mo** (from 1.47%) | RMF 2026 | [siemprealdia.co](https://siemprealdia.co/mexico/fiscal/regimen-simplificado-de-confianza-resico/) |
| 24 | Mexico Buzón Tributario + e.firma | Mandatory for RESICO from **2027-01-01**; absence not expulsion-causing in 2026 | RMF 2026 Transitorios | siemprealdia.co (same) |
| 25 | Mexico Carta Porte 3.1 fines | MXN **$19,700–$112,650 per traslado** (CFF arts. 83/84); insurance field mandatory from Jan 2026 | 2026 | [Carbajal](https://carbajalcontadores.com/2026/07/17/complemento-carta-porte-3-1-2026-quienes-deben-emitirlo-multas-sat/); [DUFREI](https://www.dufrei.com/blog/noticias-2/carta-porte-errores-que-frenan-a-la-carga-en-2026-197) |
| 26 | Mexico platform withholding, 2026 | **10.5% of gross** (8% IVA + 2.5% ISR); 20% ISR if no RFC | from Jan 2026 | [Milenio](https://www.milenio.com/politica/mipymes-riesgo-retencion-fiscal-digital-10-5-ciento); [Clip](https://blog.clip.mx/articulo/retencion-de-impuestos-en-ventas-linea) |
| 27 | Effect of that withholding | **8 of 10** AMVO members hit liquidity problems; 15–30% cut sales in Q1; ~300k MiPyMEs "at risk" | 2026-08-20 | [Voces Libres](https://voceslibres.com.mx/2026/08/20/pymes-piden-revisar-retenciones-fiscales-a-plataformas-digitales-para-evitar-afectaciones-a-su-liquidez/); Milenio |
| 28 | US remittance excise tax | **1%**, IRC §4475, transfers after 2025-12-31, cash/money order/cashier's check only; Form 720 IRS No. 155; first deposit due 2026-01-29 | eff. 2026-01-01 | [IRS Form 720 instr. (06/2026)](https://www.irs.gov/instructions/i720); [Fed. Register 2026-04-13](https://www.federalregister.gov/documents/2026/04/13/2026-07085/excise-tax-on-remittance-transfers) |
| 29 | Remittance tax exemptions | Bank-account-funded; US-issued debit/credit card | proposed regs REG-114499-25 | [KPMG](https://kpmg.com/us/en/taxnewsflash/news/2026/04/tnf-proposed-regulations-excise-tax-on-remittance-transfers.html) |
| 30 | Banked share of migrants (tax exposure proxy) | MX 84%; SV 74%; **GT 72%; HN 65%** | 2025-12 | [BBVA Research](https://www.bbvaresearch.com/publicaciones/mexico-2026-inicia-con-el-nuevo-impuesto-a-las-remesas/) |
| 31 | Mexico remittances | Jun 2026: US$5,472M (+4.2% YoY), 13.0M tx (+0.4%), avg **$422**; H1 2026 US$30,759M (+3.1%) | 2026-08-03 | [Banxico](https://www.banxico.org.mx/publicaciones-y-prensa/remesas/%7BD61BA269-E1F5-F27F-B347-CE8949A9C573%7D.pdf); [BBVA](https://www.bbvaresearch.com/wp-content/uploads/2026/08/2026-08-03RemesasyPoliticasEU.pdf) |
| 32 | The number nobody covered | H1 2026 **transaction count fell 1.8%** to 75.9M | 2026-08 | [LyP Multimedios](https://lypmultimedios.tv/remesas-junio-2026-operaciones-banxico/) |
| 33 | Mexico 2025 baseline | US$61,791M, **−4.6%**, breaking 11 years of growth | FY2025 | LyP (same) |
| 34 | Guatemala remittances | Jul 2026 record US$2,468.6M (+4.33%); Jan–Jul US$15,447.1M; Banguat forecast +5% 2026, **+3% 2027** | 2026-08 | [Soy502](https://www.soy502.com/articulo/remesas-guatemala-marcan-nuevo-record-us24686-millones-101902); [La Hora](https://lahora.gt/nacionales/jmaldonado/2026/06/17/banguat-avisora-incremento-en-uso-de-otros-canales-para-envio-de-remesas-por-controles-migratorios/) |
| 35 | Dominican Republic remittances | US$7.31bn Jan–Jul 2026 (+6.4%); >US$12.2bn forecast FY2026 | 2026 | [Rio Times/CEMLA](https://www.riotimesonline.com/guatemala-remittances-first-half-2026-cemla-banguat/) |
| 36 | JCT revenue estimate for §4475 | US$10bn 2026–2034; ~US$3bn borne by Mexicans | 2025 | BBVA Research |
| 37 | Angi Q2 2026 | Revenue $248.0M (−11%); net loss $230.7M incl. $225.6M goodwill impairment; **US monthly active pros 106,000, −17% YoY** | 2026-06-30 | [ANGI 10-Q](https://www.stocktitan.net/sec-filings/ANGI/10-q-angi-inc-quarterly-earnings-report-947f4d864dfb.html) |
| 38 | Angi headcount cut | ~350 employees, $15.7M restructuring, H1 2026 | 2026 | ANGI 10-Q (same) |
| 39 | Angi lead economics | $15–$120/lead shared with 3–8 pros (roofing to 16); **effective CAC $1,000–$2,500/booked job** | 2026 | [PipelineOn](https://pipelineon.com/blog/angi-leads-vs-own-website/); [Savu](https://savullc.com/angi-pro-reviews/) |
| 40 | Angi BBB complaints | **2,064 in 3 years**; cancellation fee up to 35% of remaining contract | 2026 | Savu (same) |
| 41 | ServiceTitan | $245–$500/tech/mo, 12–24mo contract; documented ETFs **$39k / $40k / $46k**; BBB 1/5 across 32 reviews, 27 complaints | 2026 | [Run a Call](https://www.runacall.com/learn/articles/servicetitan-pricing-what-hvac-shops-actually-pay); [contract review](https://www.runacall.com/learn/articles/servicetitan-contract-review-what-youre-actually-signing) |
| 42 | ServiceTitan reliability | 2.9 outages/mo, 118-min avg resolution (IsDown, since Jan 2023); mobile app 2.6/5 Google Play | 2026 | Run a Call (same) |
| 43 | QuickBooks Online US | Aug 1 2026: Essentials $85, Plus $140, **Advanced $340 (+70%)**; May 1 2026 round was +15–25% | 2026-08-01 | [Beancount](https://beancount.io/blog/2026/08/25/quickbooks-online-price-hike-advanced-70-percent-guide); [B2C](https://www.business2community.com/small-business/quickbooks-price-increase-2026-cost-breakdown/) |
| 44 | QBO UK cumulative | +47% Jan 2026; **+75% since 2022** for long-tenured subscribers | 2026-01 | [AccountsOS](https://accounts-os.com/blog/quickbooks-price-increase-2026) |
| 45 | US real estate fraud (IC3) | 12,368 complaints 2025 (from 9,359); losses **$275.1M** from $173.6M (**+58%**) | FY2025 | [Fox/FBI IC3](https://www.foxnews.com/tech/fake-rental-listing-scams-cost-thousands); [iBuyer](https://ibuyer.com/blog/real-estate-scam/) |
| 46 | Rental scam channel + loss | ~50% start on Facebook, 16% Craigslist (12mo to Jun 2025); FTC median loss **$1,000**; 48% lost >$1,000 | 2025 | [Yahoo Finance/FTC](https://finance.yahoo.com/real-estate/articles/rental-listing-scam-costing-renters-090808614.html) |
| 47 | US prior-auth denials (first federal disclosure) | MA 12%, Medicaid MCO 14%, **ACA marketplace 18%**; insurer range 2%–25% (Centene 25% ACA, UnitedHealth 17% MA) | 2025 data, pub. 2026 | [KFF](https://www.kff.org/patient-consumer-protections/prior-authorization-metrics-provide-new-insights-into-insurer-practices-but-gaps-remain/); [Healthcare Dive](https://www.healthcaredive.com/news/prior-authorization-denials-vary-widely-among-insurers/827891/) |
| 48 | ACA claim denials | In-network 19–20%; **out-of-network 37%**; only 5% of denials cite medical necessity, 25% "administrative", 36% "other" | FY2024 | [KFF](https://www.kff.org/patient-consumer-protections/claims-denials-and-appeals-in-aca-marketplace-plans-in-2024/) |
| 49 | Appeal overturn rates | MA ~2/3, Medicaid ~50%, ACA 43% | 2025 | Healthcare Dive |
| 50 | Kavak Profeco complaints | **218 in 2025** (corrected from a typo of 2,018); 251 total 2019–Sep 2022 | 2026 / 2022 | [El CEO investigation](https://elceo.com/investigaciones-especiales/kavak-los-autos-cangrejo-facturas-alteradas-y-la-crisis-del-primer-unicornio-mexicano/); [Expansión](https://expansion.mx/empresas/2022/11/24/kavak-quejas-reclamos-mexico) |
| 51 | LatAm B2B nanostore capital destroyed | Tul ~$180M, Frubana $99M (some sources $186M), Chiper $60M, Merqueo $66M — all wound down 2023–2025 | 2023–2025 | [Unicornburn autopsies](https://unicornburn.com/autopsy/tul-b2b-hardware-colombia); [Portafolio on Merqueo](https://www.portafolio.co/negocios/empresas/la-caida-de-merqueo-la-startup-que-paso-de-levantar-us-66-millones-a-quemar-us-4-5-millones-al-mes-486890) |
| 52 | Merqueo burn at peak | US$4.5–5M/month; 3 months of runway when market turned | 2025 | Portafolio (same) |
| 53 | Reclame Aqui reputation (Dec 2025–May/Jun 2026) | Bling 585 complaints, 86.1% resolved, avg response **10d 3h**; Omie 238, 85.2%, **12d 23h**; Stone 2,198, 94.9%, 11d 3h (RA1000, 9.0/10); Asaas 8.5/10, 84.8%, 9d 3h; Cora 6.82/10, 83.3% | 2026 | [RA Bling](https://www.reclameaqui.com.br/empresa/bling/lista-reclamacoes/?produto=0000000000001370); [RA Omie](https://www.reclameaqui.com.br/empresa/omiexperience/lista-reclamacoes/?problema=0000000000001337); [RA Stone](https://www.reclameaqui.com.br/empresa/stone/); [Runzos](https://runzos.com/asaas-review-2026/) |
| 54 | Canada B2B e-invoicing | **No mandate**, no published date, as of Jun 2026; B2G via Peppol since end-2018 | 2026-06-20 | [ediverse](https://www.ediverse.io/en/countries/canada/) |
| 55 | Texas professional licensing | TDLR rule requiring proof of lawful status, adopted by Commission; affects electricians, HVAC, barbers, cosmetologists | 2026 | [AP](https://apnews.com/article/texas-immigration-status-professional-licenses-3d993da24491324742b4b0c791ee669d); [Statesman](https://www.statesman.com/news/state/article/texas-license-tdlr-change-immigrant-workers-21318616.php) |

---

## 2. DEEP DIVE — Brazil's 2026 tax reform and what it actually does to MEIs and small-business invoicing

### 2.1 What is real in 2026

`OBSERVED` Receita Federal's own 2026 guidance is explicit: from 2026-01-01, taxpayers must **issue e-documents with CBS and IBS highlighted, per operation**, across NF-e, NFC-e, NFS-e, CT-e, NFCom, NF3e, BP-e and others — *and* "2026 será o ano de teste da CBS e do IBS, o contribuinte que emitir documentos fiscais... estará dispensado de recolhimento do IBS e da CBS" ([gov.br/receitafederal orientações 2026](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/orientacoes-2026)). So: **new fields, no money.**

`OBSERVED` The soft period ended 2026-08-03. Per CGIBS, from that date documents from regime-regular firms without IBS/CBS fields "não serão autorizados, pois o sistema rejeitará automaticamente documentos incompletos," with a test rate of 1% (0.1% IBS + 0.9% CBS). `INFERRED` This is the sharpest edge of the reform in 2026 and it is a *software-vendor* problem, not a taxpayer problem. Rejection is silent revenue stoppage: you cannot ship, cannot bill, cannot get paid.

### 2.2 The MEI reality, stripped of noise

`OBSERVED` MEIs pay a fixed DAS-MEI (R$82.05–R$87.05/month in 2026: 5% of minimum wage for INSS plus R$1–R$6). No IBS or CBS is levied on MEI sales, and no IBS/CBS appears on documents they issue ([Seu Dinheiro](https://www.seudinheiro.com/2026/seu-negocio/como-a-reforma-tributaria-vai-afetar-o-mei-cbcb/)). `OBSERVED` MEIs are excluded from split payment because they transfer no credit forward.

The genuine forcing functions, in order of bite:

- `OBSERVED` **2023-09-01 (already live):** MEI service providers must use the **national NFS-e Emissor**, not the municipal one — and this habilitation is independent of whether the municipality joined the national convênio ([Nota Técnica 2023.001, via CNT](https://notafiscal.cnt.br/mei-prestadores-de-servico-de-todo-o-pais-estao-obrigados-a-emitir-nfs-e/)).
- `OBSERVED` **2026-11-01:** ME/EPP in Simples Nacional must use the national Emissor (web or API). Res. CGSN 191/2026 revoked Res. 189/2026 and pushed this from Sep 1. The same resolution **bars** NFS-e for ICMS-only operations. CBS/IBS rules for Simples take effect 2027-01-01.
- `OBSERVED`/`REPORTED` **2027-01-01:** Res. CGSN 190/2026 obliges MEI to issue a fiscal document on **every** sale, including to individual consumers — today the duty triggers only on B2B.

`INFERRED` That last one is the demand shock. A manicurist, mototaxista or food seller with 40 cash-ish transactions a week goes from ~zero documents to ~2,000/year. There is no consumer-grade tool built for that cadence at that price point.

### 2.3 The January 2026 rollout was a mess, on the record

`OBSERVED` Receita Federal admitted national NFS-e instability through Jan 5 2026, blaming "alto número de acessos e consultas no banco de dados," then redirected taxpayers to their municipalities ([CRCSP](https://online.crcsp.org.br/portal/noticias/noticia.asp?c=10325)). `OBSERVED` The failure taxonomy Receita itself gave is diagnostic: a município may have joined the convênio but not adopted the national emitter; or adopted it but not enabled its taxpayers. `REPORTED` Accountants circulated screenshots of `cadastro não encontrado`; incidents clustered in São Carlos (SP), Patrocínio (MG), Manaus (AM) but the pattern was national ([Contábeis](https://www.contabeis.com.br/noticias/74523/sistema-de-emissao-da-nfs-e-nacional-passa-por-instabilidades/); [Nota Gateway](https://notagateway.com.br/blog/instabilidades-no-emissor-nacional-da-nfs-e-geram-dificuldades-para-contribuintes-em-todo-o-pais/)). `OBSERVED` Municipalities replied that they have no technical authority to fix the federal emitter.

`INFERRED` The unit of failure in Brazilian e-invoicing 2026 is **the municipality's configuration state**, and no one owns that surface. Not the vendor, not the prefeitura, not Receita. This is an unowned integration boundary — historically where durable middleware businesses get built.

### 2.4 The ceiling fight, and why it stays unresolved

`OBSERVED` PLP 108/2021 passed the Senate: R$81k → R$130k plus two employees. The Câmara special committee was installed 2026-04-29 (Any Ortiz presiding, Jorge Goetten as rapporteur) and the bill sits "Aguardando Parecer do(a) Relator(a)... Pronta para Pauta no Plenário." `REPORTED` The negotiated version steps R$110k (2026) → R$140k (2027). `REPORTED` The vote slipped past the October 2026 elections because deputies want the Simples band raised to R$8M and Fazenda refuses: ~R$50bn impact versus R$8.1bn for the MEI ceiling alone. `OBSERVED` The MEI increase was the government's quid pro quo for the "6x1" workweek PEC.

`INFERRED` Political read: the ceiling rises, eventually, at a number below what MEIs need, on a timeline nobody can schedule product against. `INFERRED` The commercial read is better: **desenquadramento** — MEIs blowing the ceiling and being pushed into ME/EPP — is a recurring, dated, high-anxiety event affecting hundreds of thousands per year (Aug 2026 alone: 329,119 entries, 180,321 exits from the regime). That is a wedge with a calendar.

---

## 3. DEEP DIVE — Colombia's DIAN POS→electronic-invoice forced migration

### 3.1 The mechanic, precisely

`OBSERVED` Resolución DIAN 000165 de 2023 created the *Documento Equivalente Electrónico* and its Anexo Técnico 1.0; Resolución 000008 de 2024 (Jan 31 2024) reset the dates; Resolución 000202 de 2024 (Mar 31) partially amended 165 for utilities. Phases, all expired:

| Group | Mandatory from |
|---|---|
| Grandes contribuyentes | 2024-05-01 |
| Renta declarants (non-grandes) | 2024-06-01 |
| Non-declarants and remaining subjects | 2024-07-01 |

`OBSERVED` The behavioral change at the till: cashier asks "¿Necesita factura electrónica con sus datos?" — if yes, the system emits a *factura electrónica de venta* with NIT; if no, it auto-generates the **DEE POS XML and transmits it to DIAN in the background**, same day, *regardless of amount* ([Cuenti](https://cuenti.com/software-contable/documentos-equivalentes-electronicos-2026-guia-de-automatizacion/)).

`OBSERVED` The 5-UVT rule (2026 value: 5 × $52,374 = **$261,870**) is not a lowered threshold — it was voided. Alegra states it directly: *"El umbral de 5 UVT no determina ningún límite de facturación POS en 2026."* `OBSERVED` The old paper POS ticket also gave the buyer nothing; the DEE POS, if the buyer is identified, supports costs, deductions and VAT discounting, plus the 1% renta deduction for individuals.

### 3.2 The teeth

`OBSERVED` With UVT 2026 at $52,374 (Res. 000238 de 2025):

- Not issuing valid e-documents while obliged (ET art. 652): 1% of unbilled operations, cap 950 UVT = **$49,755,300**
- Not being habilitado as e-invoicer: 5% of registered operations, same cap
- ET art. 657 closure: 3 days first offense (alternative: 10% of prior month's operating income); up to 10 days on repeat, stackable with the fine

`INFERRED` For a tiendero or peluquería, the closure remedy is existential and the fine is theoretical — you cannot pay $49.7M COP, you just close. That asymmetry means compliance is bought as *insurance*, not as software, which changes both the pitch and the price ceiling.

### 3.3 Where it breaks

`OBSERVED` DIAN's own free platform trapped users in a Microsoft bot-check loop; a user posted *"el problema es que se queda en un bucle validando si no soy un bot y no me deja pasar de ahí"* and DIAN publicly apologized and published a support line (601 489 9000, opt. 5) ([El Tiempo](https://www.eltiempo.com/economia/finanzas-personales/usuarios-reportan-fallas-en-la-plataforma-de-facturacion-electronica-de-la-dian-por-bucle-en-la-validacion-de-seguridad-brindo-numeros-de-atencion-3567952)).

`OBSERVED` On the adjacent *documento soporte de nómina* (DSNE), DIAN has now conceded ground three times — Conceptos 11042/1239 de 2024, 378 de 2026, 0158 de enero 2026 and 010193 de 2026 — holding that **no specific sanction for late transmission has been reglamentada**, and that substance prevails over the timing formality for deducting labor costs. `INFERRED` Vendors are selling fear of a sanction that does not currently exist; the actual exposure is deduction rejection in a renta audit years later. A product that told merchants the *true* risk gradient — closure risk (real, fast) vs. DSNE fine (not real yet) vs. deduction denial (real, slow) — would be differentiating and is not something an incumbent whose funnel runs on panic will build.

### 3.4 Incumbent posture

`OBSERVED` Alegra and Siigo are both DIAN-authorized PTs, both compliant with Res. 165/2023, Res. 013/2021 nómina, documento soporte, Anexo Técnico 1.9. `OBSERVED` Siigo is ~30 years old and modular — POS from ~$25,000 COP/mo extra, nómina separate. Alegra Plan Pyme is COP $163,900/mo all-in and ships **Alegra MCP**, an MCP connector to query accounting from ChatGPT/Claude/Perplexity. `INFERRED` Alegra bundling and shipping AI plumbing while Siigo à-la-cartes modules is the standard incumbent-vs-challenger split, and the AI-native seam is already claimed in Colombia. Don't attack there.

---

## 4. Rails and why-now, remaining markets

**Brazil payments.** `OBSERVED` Pix Automático mandatory for all FIs from Jan 2026 after being mandatory in Oct 2025 for inter-bank debits by firms lacking BCB direct-debit authorization. `REPORTED` Ebanx: **64% of Pix Automático payers are new to the digital economy** — never held a recurring subscription. `OBSERVED` The retry protocol: two attempts on due date, three on following days, cancellable to 23:59 on the charge day. `INFERRED` Free, no bilateral bank convênio, ~60M Brazilians without credit cards: subscription businesses for the informal economy just became technically possible. The 1,000-receiver figure at end-2025 means merchant-side adoption, not consumer demand, is the bottleneck.

`OBSERVED` **Pix Parcelado is a regulatory vacuum by choice.** BCB abandoned standardization in Dec 2025, banned the *name* but allowed "Pix no crédito" and "Parcele no Pix", and says it has no plan to return to the agenda. `OBSERVED` Idec called this "inaceitável" and "desordem regulatória" and stated: *"O consumidor continuará exposto a produtos de crédito heterogêneos, sem transparência mínima, sem salvaguardas obrigatórias e sem previsibilidade sobre juros ou procedimentos de cobrança."* `OBSERVED` Nudecon's Fontes Cintra: *"No imaginário popular, a palavra Pix está associada a confiança, rapidez"* — and now it carries interest. At Selic 14%, with each bank free to set rates, terms and presentation. `INFERRED` This is a 2027–2028 superendividamento scandal being underwritten in 2026.

**Mexico.** `OBSERVED` Carta Porte 3.1 is the only accepted version in 2026; RC insurance became a mandatory field in Jan 2026; SAT reads the CFDI QR roadside and cross-checks geolocation, inventory, owner RFC in milliseconds; foreign-origin goods errors can escalate to embargo precautorio or contrabando-equivalent proceedings under CFF art. 103. `OBSERVED` The top-5 error list is banal: inactive operator RFC, declared-vs-actual weight >10% divergence, GPS outside 500m of the fiscal domicile, missing cargo insurance, expired SCT permits. `OBSERVED` A vendor claims ~15,000 error-related fines issued in 2025 and that 90% are avoidable with pre-stamping validation — `REPORTED`, treat the count as unverified. `OBSERVED` From 2026 SAT applies **automatic CSD blocks with no prior notice** when risk alerts fire; art. 17-H Bis gives 40 business days to file ficha 296/CFF, and the authority must restore seals the next day upon the aclaración, with 10 business days to resolve. `INFERRED` A no-notice seal block converts an accounting slip into a same-day revenue stop. There is no monitoring product that watches your own CSD status and pre-drafts a 296/CFF.

`OBSERVED` The 10.5% platform withholding on **gross** sales (not profit) began Jan 2026; the originally-proposed 4% ISR was cut to 2.5% precisely because legislators acknowledged the liquidity hit — and it still hit. `OBSERVED` Deputy Téllez: *"10.5 por ciento de retenciones sobre los ingresos brutos, ni siquiera sobre las utilidades o ganancias netas, sino es sobre la venta bruta total, lo que les quita liquidez, les quita flujo, les quita capacidad de crecimiento."* `OBSERVED` Milenio reports the refund process is described as "inviable y tortuoso," so many firms don't file. `OBSERVED` RMF 2026 Regla 3.13.34 now permits **monthly** ISR refund requests without waiting for the annual return. `INFERRED` A working-capital product that monetizes 3.13.34 — advance against the withheld 10.5% and handle the devolución — has a legally-defined, SAT-documented receivable and a 2026-dated trigger. This is the single cleanest fintech opening I found in Mexico.

**Argentina.** `OBSERVED` FCEM is mandatory when a MiPyME (including monotributistas, autónomos, non-profits — anyone not on ARCA's grandes empresas list) invoices a large firm at ≥ ARS $5,549,862 (from 2026-04-14, indexed with MiPyME limits). `OBSERVED` Both parties need Domicilio Fiscal Electrónico; the issuer must register a CBU; the issuing system **blocks** a traditional factura electrónica when the CUIT is a grande empresa or an adhered MiPyME above the threshold. `OBSERVED` The receiver has 21 running days (through 2026-10-31 per Res. 219/2025) to cancel, reject (only for errors/defects/divergences per Ley 27.440 art. 8), or expressly accept; **silence = tacit acceptance and the FCEM becomes a título ejecutivo**. `INFERRED` Argentina quietly built a mandatory, government-registered, legally-enforceable receivable for every small supplier to every large buyer. The financing rail exists in law and is under-exploited in software. The threshold indexing is itself the recurring event.

**Chile.** `OBSERVED` Boleta electrónica: printed delivery mandatory for merchants with printers since 2025-05-01; **digital delivery mandatory for printer-less merchants from 2026-03-01** (email, SMS, WhatsApp, QR); electronic timbre no longer required on the printed representation from 2026-01-01; guías de despacho traceability tightened during 2026.

**Peru.** `OBSERVED` RS 000075-2026/SUNAT, effective 2026-06-01: new RUC registrants electing MYPE Tributario, Régimen Especial or General are e-emitters **from the day of registration** — previously the first day of the third month. Taxpayers leaving Nuevo RUS become e-emitters from the first day of the following month. SIRE obligation now attaches when the register obligation attaches. `INFERRED` Zero grace period at business formation. Every new Peruvian business is a same-day compliance customer.

**Dominican Republic.** `OBSERVED` Ley 32-23 (2023-05-16), art. 37 phases: Grandes Nacionales May 2024 ✅, Grandes Locales + Medianos May 2025 (extended to Nov 2025 by Aviso 12-25) ✅, **Pequeños/Micro/No Clasificados originally 2026-05-15, extended automatically six months by Aviso 06-26 (2026-05-06) to 2026-11-15.** DGII warned sanctions under arts. 27–29 apply at expiry: fines in minimum wages, operating restrictions, and closure on repeat. `INFERRED` This is the most concentrated, hardest-dated compliance deadline in the region right now: the largest taxpayer group, ~11 weeks out, already extended once, with a free DGII Facturador Gratuito (Instructivo v2.0, July 2026) as the default competitor.

**United States.** `OBSERVED` §4475 taxes only cash/money-order/cashier's-check-funded transfers; bank-account and US-card-funded transfers are exempt; base is the amount delivered to the recipient, not the amount the sender spends; providers make semimonthly deposits and file Form 720 quarterly, with limited penalty relief for Q1–Q3 2026. `INFERRED` The statute is a **channel** tax, not a remittance tax. It is a legislated subsidy for moving informal senders onto bank-funded rails, and the burden lands hardest where banking is thinnest — Honduras 65%, Guatemala 72%. `OBSERVED` Banguat's president worries about exactly the wrong outcome for his data: *"aquí lo más peligroso es de que actualmente se tiene un control total de las remesas que entran al país, pero si se empieza a utilizar métodos, pensemos como hay ahora cripto o puede ser remesas de bolsillo u otro mecanismo, aunque entren los dólares ya no tendríamos nosotros esa información estadística."* `OBSERVED` Executive Order 14406 limits banking access for people without regular status, effective November; Banguat expects remesadoras to absorb the damage and cut its 2027 forecast to 3%.

`OBSERVED` **The counter-narrative to "the tax didn't matter":** Mexico's H1 2026 dollars rose 3.1% while **transaction count fell 1.8% to 75.9M**, against a 2025 base that itself fell 4.6% and broke eleven years of growth. Average remittance $422, +3.8% YoY. `INFERRED` Fewer, larger, consolidated sends by fewer senders. Headline resilience masking base erosion. Consolidation is also the rational response to a per-transaction-triggered 1% tax, which makes the count decline partially *mechanical* — and means the recipient side is getting lumpier, less frequent cash flow. Cash-flow smoothing on the receiving end is the derivative need nobody is serving.

`OBSERVED` **Canada:** no federal B2B mandate, none published with a firm date as of 2026-06-20. Peppol B2G capability since end-2018, voluntary, no penalties. CRA's corporate plan lists e-invoicing as a *potential* GST/HST compliance mechanism; its 2021 study surfaced the honest objection — *"Why fix something that isn't broken?"* `INFERRED` Canada is not a compliance market. Any Canada-first pitch built on an imminent mandate is fiction.

`OBSERVED` **Texas licensing:** TDLR added proof-of-lawful-status to license issuance and renewal, citing PRWORA 1996. `OBSERVED` A Round Rock barber school owner said the rule would make **more than half of his 50 students** ineligible. `OBSERVED` TAMACC's J.R. Gonzales called it "an assault," predicting barbers move into houses and HVAC techs lose any incentive to work for licensed companies. `OBSERVED` Countervailing: NJ Supreme Court in *Lopez v. Marmic* (2026) held IRCA does not preempt state wage-and-hour law and that *Hoffman Plastic* limits backpay, not wages for work already performed. `INFERRED` Two forces pointing opposite ways: licensure pushes trades informal; wage law pulls them toward enforceable claims. The gap between them — a tradesperson who can't hold a license but can enforce a wage claim — is a real, growing, unserved population.

---

## 5. Incumbents and hatred — verbatim

Quotes are reproduced as published. Non-English quotes are followed by a gloss.

1. `OBSERVED` **Omie (Reclame Aqui, 2026)** — *"o suporte deles é muito DEMORADO, além disso, na maioria das vezes te mandam artigos para que você resolva sozinho. O ponto é que preciso cancelar, tentei pelo chat, mas disseram que precisa ser por telefone... Hoje já liguei 2x, na segunda vez 14 min de espera sem ninguém atender? Isso é bizarro. Para voce adquirir produto, coloca no carrinho do site, sai pagando. Pra cancelar, não tem nenhuma forma fácil."* [(link)](https://www.reclameaqui.com.br/omiexperience/dificuldade-e-demora-no-cancelamento-do-omie-suporte-ineficiente-e-falta-de-opcoes-faceis-para-cancelar_sVBq3v5WJWS3J5Uc/) — Support is slow, sends help-center articles, cancellation is phone-only, 14 minutes unanswered; one click to buy, no path to leave.

2. `OBSERVED` **Omie (Reclame Aqui, 2025-07-16)** — *"a plataforma é impossível de usar nada intuitiva... Trata-se de um sistema pré-pago, ou seja, quanto mais tempo você demora para conseguir usar, mais mensalidades eles cobram... Um alerta sobre a estrutura comercial deles: vendem e somem!"* [(link)](https://www.reclameaqui.com.br/omiexperience/dificuldade-de-uso-da-plataforma-omie-e-falta-de-suporte_r_olAn7GTl51e7FI/) — Prepaid billing means onboarding delay is billable; R$300 setup + R$299/mo; 13 days to register products; "they sell and vanish."

3. `OBSERVED` **Bling (Reclame Aqui, 2026-01-01)** — *"01 de janeiro de 2026, abri o ticket ***** em virtude da não homologação da NFS-e na prefeitura de Salvador."* [(link)](https://www.reclameaqui.com.br/empresa/bling/lista-reclamacoes/?produto=0000000000001370) — Complaint title: "Software não homologado para emissão de NFS-e após alteração de layout pela prefeitura, com resolução demorada." `INFERRED` Dated Jan 1 2026 — the exact municipal-layout failure mode from §2.3, arriving as a paying customer's revenue stoppage.

4. `OBSERVED` **Bling's own defense (Reclame Aqui)** — the vendor confirms the pattern in writing: Mercúrio R$110 + Qint R$39.90 → acquisition → forced migration to Titânio, temporary discount holding R$149.90 that *"se encerrou em setembro de 2025. A partir de então, passou a vigorar o valor integral do plano Titânio, atualmente R$ 185,00"* — framed as *"reestruturação comercial e tecnológica da oferta, prática legítima."* [(link)](https://www.reclameaqui.com.br/bling/alteracao-unilateral-de-plano-e-cobranca-indevida-por-servico-de-software-bling_z6sX0S2Y14pVoWLe/)

5. `OBSERVED` **InfinitePay (Reclame Aqui, 2025-11-17)** — *"hoje segunda cairia R$ 10.200,02 de vendas do final de semana, e simplesmente bloquearam meu saldo... esse dinheiro seria para repor estoque e agora não tenho para pagar fornecedor, por que simplesmente esse banco julgou e condenou bloqueando minha conta e meu saldo."* Company reply: *"a relação comercial foi encerrada e o cadastro descredenciado de forma definitiva... não haverá reativação."* [(link)](https://www.reclameaqui.com.br/infinite-pay/bloqueio-indevido-de-conta-e-saldo-no-infinitepay_R9te7gg_hl4wJoYX/)

6. `OBSERVED` **InfinitePay (Reclame Aqui, 2026-05-04)** — six days blocked against a promised 2-day SLA, because the facial-verification tool itself fails: *"Após realizar a captura da foto e seguir corretamente todas as orientações solicitadas, o sistema retorna apenas a mensagem Algo deu errado... a empresa não disponibiliza atendimento telefônico."* [(link)](https://www.reclameaqui.com.br/infinite-pay/conta-infinitepay-bloqueada-ha-dias-apos-erro-no-pix-e-falha-na-verificacao-facial-sem-solucao-e-suporte_sNn3XbMzkIIRDnhT/)

7. `OBSERVED` **Asaas (Reclame Aqui)** — *"Recebi um comunicado informando que minha conta foi reprovada por desinteresse comercial, termo extremamente genérico e subjetivo, sem nenhum esclarecimento técnico, jurídico ou factual... fui informado que o saldo em conta poderá ficar retido por até 30 dias."* [(link)](https://www.reclameaqui.com.br/asaas-gestao-financeira/conta-bloqueada-sem-justificativa-clara-e-saldo-retido-causando-serios-prejuizos-e-constrangimentoldo-pela-asaas_KMSfWCZKLxdRTJDY/) `REPORTED` Third-party review of Asaas reports holds up to **120 days** and notes a 9-day average response time "é alto para quem está com dinheiro retido" ([Runzos](https://runzos.com/asaas-review-2026/)).

8. `OBSERVED` **Angi (Trustpilot, May 2025)** — *"Purchased a 3 month contract for $1,200. They provided 3 leads a week — 2/3 were fraudulent. Bogus names, dead numbers. ROI = $0."* [(via Savu)](https://savullc.com/angi-pro-reviews/)

9. `OBSERVED` **Angi (BBB complaint, Mar 2026)** — *"Sales rep promised 6 high-quality leads/week. I got maybe 6 per month, none resulted in work. To cancel they demanded 35% of remainder of year."* (same)

10. `OBSERVED` **Angi (Chrome Web Store review, 2025)** — *"Angi Pro is fulfilling the contracts by sending fake leads that do not respond. Ruined my business."* (same)

11. `OBSERVED` **HVAC contractor on r/HVAC re: paid leads** — *"I'm not going to pay $30+ to answer a question."* [(via PipelineOn)](https://pipelineon.com/blog/angi-leads-vs-own-website/)

12. `OBSERVED` **ServiceTitan (BBB, Dec 2024)** — *"We have NEVER BEEN ONBOARDED. At this point, we have currently paid for 1 year of Service Titan even though we do not use the software."* [(via FieldCamp)](https://fieldcamp.ai/reviews/servicetitan/)

13. `OBSERVED` **ServiceTitan (G2, Jun 2025)** — *"The product is complicated, which means you need help regularly, but their product support is TERRIBLE."* (same). And **(BBB, Jul 2025)** — *"Absolutely the worst customer service I've ever had in my entire life from a support company."*

14. `OBSERVED` **ServiceTitan (YouTube review, May 2025)** — *"ServiceTitan was built for enterprise-level contractors with full departments for inventory, dispatch, HR… if a company with six people is getting the same software as a company with huge staff, it's really not a good fit."* (same)

15. `OBSERVED` **QuickBooks (Intuit's own community forum)** — a 20-year Desktop Pro customer: *"I used to pay $589, which was manageable. But now I'm being asked to pay nearly $1,000 per year—a 70% increase—for the same basic features I've used for two decades. And when I spoke to a QuickBooks sales representative about this, I was told, essentially, 'If you don't like it, go find an alternative.'... This feels like nothing short of a corporate monopoly."* [(link)](https://quickbooks.intuit.com/learn-support/en-us/other-questions/longtime-customer-deeply-disappointed-by-quickbooks-pricing-and/00/1559617)

16. `OBSERVED` **Jobber (r/Contractor)** — *"I pay $200/month for jobber and they still want more money for basic features like reviews and referrals."* And **Housecall Pro (r/HVAC)** — *"They just want the sale. It's literally a cloud based subscription."* [(via FieldServiceCompare)](https://fieldservicecompare.com/compare/housecall-pro-vs-jobber/)

17. `OBSERVED` **Housecall Pro (Reddit r/CRM)** — *"Horrible company. They want to lock you in on monthly contract and not give you a way out. These guys robbed me for $1,600 before I caught on."* [(via Projul)](https://projul.com/blog/housecall-pro-pricing-analysis-2026/)

18. `OBSERVED` **Kavak (Twitter, via Expansión)** — *"Kavak es un fraude, pagué un coche hace ocho días y no me lo han entregado. Nadie da la cara, he hablado en 15 ocasiones y nadie me responde. No compren. Cuidado. #KavakFraude"*

`INFERRED` The structural read across all eighteen: **the complaint is almost never about features.** It is about exit friction (Omie phone-only cancellation, ServiceTitan $39–46k ETFs, Angi 35% of remainder, Housecall Pro cancellation), unilateral repricing (Bling, QuickBooks, ServiceTitan renewals), or opaque money-holds (InfinitePay, Asaas, Clip). These are all governance failures, not product failures — which is why building a better feature set does not win, and building a credible *promise about exit and money control* might.

`INFERRED` A note on Reclame Aqui reputation scores: Stone at RA1000 9.0/10 with 2,198 complaints and 94.9% resolution, and Asaas at RA1000 8.5/10, sit alongside the quotes above. High resolution rates plus 9–13 day response times means these firms are good at *closing tickets* and bad at *not creating them*. Do not read RA1000 as a moat.

---

## 6. Pain themes, compressed

**LatAm nanostore restocking.** `OBSERVED` Chiper ($60M, SoftBank) shut Colombia + Mexico 2023; Tul ($180M, a16z/SoftBank/General Atlantic) wound down Colombia 2023 after two layoff rounds; Frubana ($99M) ceased Oct 2023; Merqueo ($66M) closed July 2025 after burning $4.5–5M/month with three months of runway. `OBSERVED` The Chiper postmortem lesson: *"B2B distribution to small informal retailers has structurally thin economics that do not improve with scale. The tienda de barrio market in LatAm looks large by unit count but the average order size and margin per delivery make technology-enabled distribution more expensive than traditional wholesale, not less."* `OBSERVED` Merqueo's turnaround CEO Andrés Escobar: *"Los precios eran tan agresivos que incluso a los proveedores les salía más barato comprarle a Merqueo que producir"* and *"cerca del 90 % del equipo venía de compañías como Uber, iFood o Delivery Hero. Todos pensaban parecido."* `INFERRED` Do not touch inventory or last mile in this segment. The remaining opportunity is informational and financial — the credit ledger, the price signal, the compliance document — not the truck.

**Informal→formal transition.** `OBSERVED` 4.6M MEIs (27.9%) have a legal representative in CadÚnico; 41.7% of those are Bolsa Família families; 2.6M of the 4.6M opened the CNPJ *after* joining the social register; 54% are in services, 55.3% women, 64% non-white. `OBSERVED` Sebrae-served MEIs: 78.9% active vs 61.5% unserved. `INFERRED` The formalization funnel's binding constraint is post-registration operational support, and a 17-point survival delta is the size of the prize. `INFERRED` The 2027 all-sales-invoicing rule lands squarely on this population.

**Contractor lead extraction (US).** `OBSERVED` Angi's own filings show the extraction failing: −17% pros YoY to 106,000, $225.6M goodwill write-off, ~350 layoffs, guidance withdrawn, revenue trough −12.7% in May 2026 improving to −8.2% in July. `OBSERVED` Angi's Q2 letter cites *"pro capacity churn fell to (2.8)%"* and win rate +20% as recovery signals. `INFERRED` Angi is deliberately shedding small pros to court large pros and national partnerships (large-pro revenue +25% in Q1 after −20% in 2025). That is an abandonment of the long tail, publicly stated, mid-execution. `OBSERVED` A crowd of flat-fee replacements already exists (Dandee $29.99/mo zero commission; KnockKnock Pros ≤$45 booking fee). `INFERRED` The undifferentiated "flat-fee lead marketplace" slot is crowded and none of them has solved demand generation, which is the actual hard part.

**Remittance corridors.** Covered in §4. `INFERRED` The three durable consequences of §4475: (a) channel arbitrage — a 1% wedge between cash and account funding, permanent, statutory; (b) trust collapse at the physical counter, because Banguat's fear is about *fear of the counter*, not the tax; (c) recipient-side lumpiness from send consolidation.

**Gig deactivation (Brazil).** `OBSERVED` TST 1ª Turma and TRT-7 both held in 2026 that deactivation claims are **civil, not labor**, following STJ CC 164.544 and REsp 2.144.902 (Dec 2024), and remitted them to state civil courts. `OBSERVED` TJDFT (2026-01-17) ordered Uber to pay R$3,000 moral damages plus R$5,620.16 lucros cessantes for a 16-week suspension of a driver with 4.88 stars and 4,500+ rides, deactivated on a generic "internal verification"/duplicate-account allegation with no concrete proof; average net weekly earnings R$351.26; the account was reactivated only after the suit was filed. `OBSERVED` TJGO (2026-05) ordered reactivation in five days plus R$4,000. `OBSERVED` The counter-case: TJBA upheld a deactivation where Uber produced internal system screens showing a **64% cancellation rate** and prior notice, holding that "as telas sistêmicas constituem meio de prova idôneo." `INFERRED` Brazilian courts have converged on a workable rule — platforms win on documented, notified, systemic evidence and lose on generic allegations — but the venue is now small-claims civil court, per driver, with a ~R$8.6k typical award and a four-month income gap. That is a volume litigation-support market, not a policy market.

**Rental scams and used-car fraud.** `OBSERVED` IC3 real-estate fraud losses +58% to $275.1M on 12,368 complaints; ~half of rental scams originate on Facebook; median FTC loss $1,000; 115 IC3 complaints referenced AI, ~$2.7M. `OBSERVED` Kavak: El CEO documented altered CFDI folios inconsistent with SAT records, an internal informal label *"autos cangrejo"* for units with technical or legal problems, a Querétaro seizure over an engine reported stolen since 2023, and a settlement with a compensation-for-silence structure; former employees said peritaje inspections were lax because supply outran the number of available peritos; 218 Profeco complaints in 2025. `OBSERVED` El Heraldo describes Kavak's "compraventa con condición suspensiva" clause enabling repossession without a judge. `OBSERVED` Kavak raised US$300M in April 2026 at ~$1,200M — down from a $8.7bn peak.

**Medical billing.** Covered in table rows 47–49. `OBSERVED` The most useful datum: only **5%** of in-network ACA denials cite medical necessity, while 25% are "administrative" and 36% "other" — and appeals overturn 43–67% depending on market. `INFERRED` The overwhelming majority of denials are clerical, and the appeal is winnable more often than a coin flip. That is a pure automation target and the newly-mandated public disclosure of per-insurer denial rates (first year: 2%–25% spread) makes it targetable per payer for the first time.

---

## 7. Startup opportunities

Fifteen. Each: **problem / who hurts / current workaround / why they arrive without ads / analog / death risk.**

**1. Municipal NFS-e configuration monitor (Brazil)**
Problem: national Emissor failures are usually a município's convênio/habilitação state, and no party owns that surface. Who hurts: every ME/EPP and their accountant, hardest at the 2026-11-01 cutover. Workaround: WhatsApp groups of contadores trading screenshots; calling the prefeitura, which says it has no authority. Arrival without ads: on the day you cannot issue, you search the error string — `cadastro não encontrado` — and the only useful page wins. Analog: Downdetector for a regulated rail. Death risk: Receita ships a status page and the wedge evaporates; must convert observability into a document-issuance fallback fast.

**2. MEI every-sale document layer (Brazil, 2027-01-01)**
Problem: Res. CGSN 190/2026 forces a fiscal document on all sales, including to individuals. Who hurts: ~13.7M MEIs, disproportionately the 4.6M in CadÚnico. Workaround: not issuing, and hoping. Arrival: the DAS-MEI/desenquadramento anxiety cycle already drives search; the deadline is dated. Analog: Emissor Nacional as a competitor with a free price and a hostile UX. Death risk: free government tool improves; ARPU is R$10–20/mo against a R$85/mo tax bill — this only works as a wedge into payments or credit.

**3. Pix Automático for the informal economy**
Problem: recurring billing was gated on card ownership; Pix Automático removed the gate but only ~1,000 receivers had enabled it by end-2025. Who hurts: gyms, schools, condominiums, neighborhood service businesses billing the ~60M cardless. Arrival: 64% of payers are new to digital recurring — merchants hear about it from their own customers. Analog: early GoCardless on Bacs. Death risk: PSPs (Asaas, Cora, Stone) ship it as a checkbox; you must own a vertical workflow, not the rail.

**4. Pix credit truth-in-lending comparator (Brazil)**
Problem: BCB declined to standardize; each institution sets rate, term, IOF and presentation freely; Idec documents "variações abusivas." Who hurts: borrowers who think "Pix" means free. Arrival: post-purchase shock searches; Idec/Procon/Defensoria referral. Analog: comparison rails that preceded regulation elsewhere. Death risk: BCB returns to the agenda and mandates disclosure — though it has stated no plan to; and comparators monetize via lead-gen, which is the conflict you're criticizing.

**5. Dominican e-CF sprint for the 2026-11-15 cohort**
Problem: the largest DR taxpayer group, already extended once, faces closure-capable sanctions in ~11 weeks. Who hurts: colmados, salones, talleres, independent professionals. Workaround: DGII's free Facturador Gratuito plus a digital certificate procurement they don't understand. Arrival: a hard national date and DGII's explicit sanction warning. Analog: Alegra's DR playbook. Death risk: a second extension guts urgency; and DR is small — this is a beachhead, not a business, unless it templatizes across Peru/Chile/Colombia.

**6. Mexico 10.5% withholding advance (Regla 3.13.34)**
Problem: 10.5% withheld on gross platform sales; 8 of 10 AMVO members report liquidity damage; the refund process is "inviable y tortuoso." Who hurts: ~300k MiPyMEs selling on Mercado Libre/Amazon. Workaround: not filing the devolución; shrinking inventory; borrowing. Arrival: the shortfall is visible in the settlement report every month. Analog: receivables factoring against a statutory claim. Death risk: PAN's promised initiative cuts the rate, or the 2027 paquete económico changes the mechanic — the receivable is regulatory, so is the risk.

**7. CSD sentinel + auto-296/CFF (Mexico)**
Problem: from 2026, SAT blocks CSDs automatically with no prior notice; the aclaración restores seals the next day but you have to know and file. Who hurts: anyone who invoices in Mexico. Workaround: discovering it when a CFDI fails to stamp. Arrival: the day it happens; searches spike. Analog: uptime monitoring with a legal action attached. Death risk: this belongs inside every PAC's product; PACs will build it. Ship first, then sell to PACs.

**8. Pre-stamp Carta Porte validator**
Problem: fines MXN $19,700–$112,650 per traslado, roadside QR verification in milliseconds, mostly from five banal errors. Who hurts: small carriers and e-commerce sellers running their own fleet. Workaround: manual capture between disconnected fiscal and logistics systems. Arrival: the first roadside retention. Analog: address-validation-at-checkout. Death risk: ERP/TMS incumbents bundle it; the wedge is the *insurance framing*, not validation.

**9. FCEM receivable rail (Argentina)**
Problem: FCEM at ≥ARS $5,549,862 is government-registered and becomes a título ejecutivo by tacit acceptance after 21 days. Who hurts: MiPyMEs and monotributistas financing large buyers. Workaround: the ADC/factoring path most never use. Arrival: ARCA blocks the ordinary factura, so the supplier is forced into the register — the state does acquisition. Analog: an Argentine Peppol-plus-financing. Death risk: Argentine macro, threshold indexing, and banks already sitting on the CBU registry.

**10. Colombia risk-truth compliance concierge**
Problem: merchants can't rank three unequal risks — DEE POS non-transmission (fast closure, real), DSNE lateness (no reglamentada sanction), deduction denial (slow, real). Who hurts: micro-merchants sold panic by vendors and DIAN's own bot-loop UX. Arrival: after the first DIAN visit or the first bucle. Analog: a tax-compliance version of a patient advocate. Death risk: Alegra/Siigo already own the rail and Alegra shipped MCP; you must be the layer *above* the PT, not another PT.

**11. Field-service exit and portability service (US/Canada)**
Problem: ETFs of $39–46k, 6–12 month onboardings, data-export obstruction, 20–40% renewal repricing. Who hurts: 5–25-tech HVAC/plumbing/electrical shops. Workaround: swallowing the increase; hiring a lawyer to get data back. Arrival: renewal-date panic search; ServiceTitan's 1/5 BBB rating is the funnel. Analog: contract-negotiation-as-a-service plus an ETL. Death risk: one-time transaction, no recurring revenue, and incumbents can make export easy overnight to kill it.

**12. Denial-appeal automation priced off published payer denial rates (US)**
Problem: only 5% of in-network denials are medical-necessity; 25% administrative, 36% "other"; overturn rates 43–67%. Who hurts: independent practices and patients. Workaround: unpaid staff time, or writing it off. Arrival: the EOB is the trigger; the newly-public per-insurer denial spread (2%–25%) lets you target the worst payers by name. Analog: chargeback-recovery services. Death risk: payers are the regulated party and can change the game; and the first federal disclosure year has known gaps (percentages only, no volumes).

**13. Gig deactivation dossier tooling (Brazil)**
Problem: deactivation claims are now civil-court matters, per driver, with ~R$8.6k awards and four-month income gaps; platforms win with documented systemic evidence and lose on generic allegations. Who hurts: app drivers and couriers. Workaround: screenshots and hope, or nothing. Arrival: TJDFT/TJGO rulings are being shared in driver groups. Analog: small-claims document assembly. Death risk: platforms improve notice and evidence (as TJBA shows they can), collapsing win rates; and clients have no money at the moment of need.

**14. Recipient-side remittance smoothing (Guatemala/Mexico/DR)**
Problem: sends are consolidating into fewer, larger transfers — Mexico's H1 count fell 1.8% while dollars rose 3.1% — leaving recipients with lumpier income. Who hurts: receiving households, hardest where banking is thin (GT 72%, HN 65%). Workaround: informal moneylenders between arrivals. Arrival: the gap month is self-evident; church and hometown-association networks propagate. Analog: earned-wage-access, pointed at inbound transfers. Death risk: you are lending to thin-file households against an unstable inflow, in a year when EO 14406 and Banguat both expect channel migration.

**15. Cross-border trade-identity for informal US tradespeople**
Problem: Texas TDLR now requires proof of lawful status for licenses; a barber-school owner says >half his students are ineligible; TAMACC predicts the work moves into houses. Simultaneously, NJ's *Lopez v. Marmic* (2026) confirms wage claims survive regardless of status. Who hurts: immigrant tradespeople who lose licensability but keep enforceable wage rights and customer demand. Workaround: working unlicensed under someone else's license; cash. Arrival: license-renewal denial is a dated, personal crisis. Analog: a portable work-record and payment identity, not a license. Death risk: this is politically radioactive, the legal ground moves state by state, and any product that looks like license evasion is unfundable. Constrain it to verifiable work history, payment records and wage-claim evidence — nothing that substitutes for licensure.

---

## 8. What I would not build

`INFERRED` **Anything Canada-mandate-driven.** No mandate, no date, and CRA's own study found businesses asking "Why fix something that isn't broken?"

`INFERRED` **Anything sold to MEIs as split-payment readiness.** MEIs are structurally excluded and the mandate is 2028.

`INFERRED` **Another flat-fee contractor lead marketplace.** Dandee, KnockKnock Pros and several others already occupy the slot, and none has solved homeowner demand generation — which is the only part Angi was actually good at, and the part that costs money.

`INFERRED` **Nanostore inventory or delivery.** Four postmortems, ~$400M destroyed, and the documented lesson is that the economics get worse with scale, not better.

`INFERRED` **A better-featured ERP for Brazilian small business.** Read the eighteen quotes again: nobody is leaving Bling or Omie over features. They are leaving over cancellation phone trees, unilateral plan migrations and held balances. That is a promise-and-governance product, and an incumbent can copy features far more easily than it can copy a credible commitment not to trap you.

---

*Compiled 2026-08-31. Every figure in §1 was checked against the linked source at time of writing. Non-primary sources — vendor blogs, comparison sites, review aggregators — are labeled `REPORTED` and should be re-verified before any figure enters a memo. The Reclame Aqui and BBB quotes are single-customer accounts, not audited data; their value is as evidence of a repeated pattern, not of any individual claim's truth.*
