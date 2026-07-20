# lib/calc — calculator engines (Phase 3 & 5)

Pure, React-free, unit-tested. One file per engine. Build reference Part 6.

Contract (lib/types.ts): `compute(input, ASSUMPTIONS) => EngineResult`.
- Deterministic. No Date.now(), no I/O, no locale reads inside compute — dates enter as inputs.
- Integer cents everywhere. Rounding at display only.
- Returns `monthlyLines` and `oneTimeLines` as SEPARATE arrays. Never sum across them.
- Every line carries a `basis`. AssumptionsTable renders every non-statutory value with asOf.
- Golden vitest tables (>=6 cases) written BEFORE the tool page (net-proceeds cases in Part 6.2).

Lineup (D-01, unconfirmed): net-proceeds (flagship, P3) · tax-reset · homestead-portability ·
condo-assessment · rental-cashflow · vacancy-cost. All statutory figures VERIFY before preview exit.
