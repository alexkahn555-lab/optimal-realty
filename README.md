# Optimal Realty

Bilingual (EN/ES) five-portal property platform for Miami-Dade County. Listing-report
engine, credential-differentiated decision calculators, built for Answer Engine
Optimization. Own listings only — **no IDX**.

Built by AK Solutions. Full spec: **Technical Build Reference v2.0** (kept alongside this repo).

---

## What this scaffold is

The **D0 layer** — everything with zero dependencies, per the build-order table (Part 7.5):
design tokens, the data-model contract, the CI gates, and config. Nothing that renders yet.
Components are built in dispatched, build-gated branches, not pre-written.

```
config/          origin.ts · assumptions.ts · entity.ts   ← the only place constants live
lib/types.ts     the data-model contract — everything compiles against this
scripts/         check-content.mjs · bundle-budget.mjs · compress-images.mjs   ← the gates
supabase/        schema.sql — source of truth, applied manually
content/         typed content files (empty; filled per phase)
app/ components/  built in Phase 1+
```

## First run

```bash
npm install
cp .env.example .env.local     # fill as services come online; blanks are fine to start
npm run gate:content           # should print "No TK_ markers found" only once entity.ts is filled
npm run typecheck              # the contract compiles
```

There is no `next build` output yet — the app tree is empty by design. `npm run dev`
starts working the moment the Phase 1 layout lands.

## Git / GitHub (run locally — I can't do this from the scaffold)

```bash
git init
git add .
git commit -m "chore: D0 scaffold — tokens, types, gates, config"
gh repo create optimal-realty --private --source=. --push   # or create on github.com and push
```

Then import to Vercel (standalone repo, auto-deploy). Keep it standalone — nesting
client projects in a monorepo causes persistent git and Vercel issues.

---

## The non-negotiables (read before writing anything)

These are not preferences. Each has license or launch consequences.

1. **Color never encodes place, price tier, or desirability.** Coral is a second *data
   series* only (current vs projected, owner vs renter). Comparison charts are
   single-color, value-sorted, no tiers, no dividers. Fair-housing exposure attaches to
   the broker's license. `ScorecardEntry` has no `schools`/desirability key — it's
   unrepresentable, not just discouraged. (Part 1.4 / D11 / R-04)

2. **No AI-generated image is ever presented as a real property, client, or work product.**
   Alt text describes what an image actually shows.

3. **No statistic renders without `source` + `asOf`.** Enforced by the type system.
   Own-transaction and public-record data only unless a license is produced. (R-08)

4. **No broker advice, listing narrative, or FAQ answer is drafted by an agent.** That's
   licensed professional counsel. Authored by the client, reviewed, then wired in. All
   such fields are `TK_` until then.

5. **Every calculator statutory figure is unverified** (`config/assumptions.ts`). The tax
   and condo tools do not leave preview until the client confirms the underlying FL rules.
   Do not assert them as fact anywhere.

6. **Money math is integer cents.** Rounding at display only.

7. **Engine results return `monthlyLines` and `oneTimeLines` as separate arrays.** Never
   sum across them — a one-time cost inside a recurring total is a real error.

8. **`adviceIds` may be empty → template renders `null`.** This is what lets every route
   ship structurally complete while the client's content is outstanding. Never block a
   route on missing copy.

9. **`SITE_ORIGIN` is the only host constant.** Nothing else hard-codes a hostname.

10. **Tokens only — no raw hex** in component files (lint-enforced).

## Dispatch discipline

- One purpose per dispatch. Explicit file allowlist + forbidden-path list in every prompt.
- `npm run build` must pass before a dispatch reports done. The prebuild hook runs both
  gates, so the single build command covers compilation, content integrity, and bundle size.
- Nothing commits to `main` directly. Named branch per dispatch. Playwright screenshot
  review before merge.
- Copy authored and reviewed **before** any agent wires it in.
- If a bug survives one fix, the next dispatch is diagnosis-only, then a targeted fix.

## Design system (locked)

- **Palette:** bone `#F2EFE8` · ink `#15181B` · marine `#0E2E36` · teal `#00A79A`
  (data/emphasis, fails text contrast on bone) · coral `#E2725B` (2nd data series only) ·
  hair `#DAD5C8`. No gold, no forest green, no burnt orange (AK Solutions' own color).
- **Type:** Fraunces (display) · Inter (body) · **IBM Plex Mono for every figure, price,
  stat, license number, and label** — the single biggest differentiator.
- **Composition:** grid not stack · data leads, photography supports · hairlines not cards ·
  underlined inputs · the answer block set apart by scale, never a tinted box · visible
  source+date under every stat.

## Open discovery items (Appendix A)

D-01 tool lineup · D-02 advice content · D-03 fee/statutory confirmations · D-04
neighborhood list · D-05 listing/photo assets · D-06 domain + optimalrealty.co fate ·
D-07 Spanish translation owner · D-08 Kinlock license / booking / GBP access.

Phases 1–5 need none of these. Phase 6 is the hard gate. Walk the Phase 3 preview with
the client — visible placeholders produce answers a questionnaire didn't.

## Build phases

1 Foundation · 2 Lead pipeline · 3 Seller path (+ client preview) · 4 Listings engine ·
5 Portal completion · 6 Hardening + launch gate · 7 Neighborhood engine.
