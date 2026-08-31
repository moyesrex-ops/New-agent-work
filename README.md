# GLOBAL DEMAND ENGINE — decision, company, and build

This repository contains the full output of a sequenced operating exercise: find the one startup users are structurally pulled toward, decide it, incorporate it on paper, brand it, design a $20,000 first version, plan and test it like a real engineering org, and then build the P0.

**The decision:** see `company/07-the-one.md`.

## Repository map

```
/company                         The partner memo, split by act
  01-method-and-sources.md       Phase 0  — research protocol, buckets, assumption log
  02-global-scan-west-africa.md  Phase 1  — West Africa, researched first-hand
  02-global-scan-world.md        Phase 1  — every other region
  03-longlist.md                 Phase 2  — longlist and public kills
  04-the-five.md                 Phase 3  — the five dossiers and the kill list
  05-simulations.md              Phase 4  — ten simulations per candidate, sequential
  06-comparison.md               Phase 5  — scorecard, head-to-head, sensitivity
  07-the-one.md                  Phase 6  — winner package, 90-day plan, risks, ethics, metrics
  11-quality-gate.md             Phase 22 — the fifteen answers
  12-handover.md                 Phase 22 — demo script, store listing, cadence, incident lite
  13-appendix.md                 Sources, quotes, analog metrics, assumption log
  /brand                         Phases 7-11
  /product                       Phases 12-15
  /engineering                   Phases 16-19
  /qa                            Phases 18, 21
/apps/mbs                        Phase 20 — the P0 implementation
/design-tokens                   Locked brand tokens, consumed by the app
```

## The app

`apps/mbs` is the P0 build. See `apps/mbs/README.md` for local run, environments and
north-star event names.

## Reading order

If you have ten minutes: `company/07-the-one.md`, then `company/brand/03-logo-and-identity.md`,
then `company/product/02-feature-pack.md`.

If you are deciding whether to fund it: `company/05-simulations.md` and `company/06-comparison.md`.

If you are building it: `company/engineering/` in file order, then `company/qa/`.
