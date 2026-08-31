# GLOBAL DEMAND ENGINE — decision, company, and build

The full output of a sequenced operating exercise: find the one startup users
are structurally pulled toward, decide it, incorporate it on paper, brand it,
design a $20,000 first version, plan and test it like a real engineering org,
and then build the P0.

**The decision:** Stampa. A Nigerian large buyer cannot deduct input VAT on an
invoice without a government reference number, and cannot get one out of the
small suppliers who make up the tail of their vendor master. Stampa is the
product the buyer pays for and the supplier is delivered to by their own
customer. The reasoning, the four candidates it beat, the sensitivity analysis
and the kill criteria are in `company/06-comparison.md`.

**The build:** `apps/stampa`. It runs. See `apps/stampa/README.md`.

**The gate:** `company/HANDOVER.md` answers the fifteen quality-gate questions,
lists what must be true before a real supplier touches this, and says what I
would attack first. Read it second, after the decision.

---

## Repository map

```
/company                              The partner memo, in phase order
  01-method-and-sources.md            Phase 0  — research protocol, buckets, what I could not do
  02-global-scan-west-africa.md       Phase 1  — West Africa, researched first-hand
  02-global-scan-world.md             Phase 1  — every other region
  03-longlist.md                      Phase 2  — longlist and public kills
  04-the-five.md                      Phase 3  — five dossiers and the kill list
  05-simulations.md                   Phase 4  — ten simulations per candidate
  06-comparison.md                    Phase 5-6 — scorecard, sensitivity, the forced decision,
                                                  90-day plan, kill criteria, ethics, risk register
  /brand                              Phases 7-11  — naming, voice, logo, tests, application kit
  /product                            Phases 12-15 — translation, feature pack, UX, visual finish
  /engineering                        Phases 16-19 — architecture, build sequence, review standard
  /qa                                 Phases 18, 21 — test plan, measured performance and accessibility
  HANDOVER.md                         Phase 22 — the fifteen gate answers, launch blockers, handover

/research                             Regional demand streams behind Phase 1
/design-tokens                        Locked brand tokens, the source the app builds from
/apps/stampa                          Phase 20 — the P0 implementation
```

## Reading order

**Ten minutes.** `company/06-comparison.md` for the decision, then
`company/HANDOVER.md` §22.1 for the case against it.

**Deciding whether to fund it.** `company/05-simulations.md` and
`company/06-comparison.md`. The sensitivity table and the kill criteria are the
parts worth arguing with.

**Building it.** `company/engineering/` in file order, then `company/qa/`, then
`apps/stampa/README.md`, then the launch blockers in `company/HANDOVER.md` §22.2.

**Checking whether the claims are real.** `company/qa/02-performance-and-accessibility.md`
holds measured numbers rather than intentions, and every check that produced
them is committed and re-runnable.

## Running the app

```bash
cd apps/stampa
npm install
npm run seed
npm run dev
```

Then open <http://localhost:3000/s/i/AGB-4471>. No database to install — local
development runs Postgres compiled to WebAssembly, in-process.

`npm run verify` is the gate. `npm run walk` drives all 37 screens in a real
browser and audits each one.

## A note on the record

Phases were run in order and nothing was backfilled to look tidy. Where a later
phase contradicted an earlier one, the earlier claim was corrected in place with
the correction marked and dated rather than quietly edited — see the buyer-initiated
invoice note in `company/01-method-and-sources.md` §0.2, which a late research
stream proved wrong. Defects found during review are listed in
`apps/stampa/CHANGELOG.md` rather than omitted.
