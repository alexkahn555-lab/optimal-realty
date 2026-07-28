import { describe, expect, it } from 'vitest';

import { ASSUMPTIONS } from '@/config/assumptions';
import {
  CONDO_ASSESSMENT_ENGINE,
  compute,
  fromFormValues,
  type CondoAssessmentInput,
} from '@/lib/calc/condo-assessment';

/**
 * GOLDEN TABLE — Build reference v2.0, Part 6.3. Written BEFORE the tool page.
 * Exact integer cents, locked; expected values derived independently from the
 * spec formulae — never from the engine.
 *
 * FRAMING CONTRACT (Part 6.3, binding): the engine takes what the association
 * DISCLOSES and does arithmetic on it. Nothing here estimates, forecasts,
 * scores or rates; no figure is defaulted; every line's basis is 'input'.
 */

const CENTS = (dollars: number) => Math.round(dollars * 100);

function baseInput(overrides: Partial<CondoAssessmentInput> = {}): CondoAssessmentInput {
  return {
    unitSharePct: 1,
    reserveBalanceCents: CENTS(500_000),
    deferredItemsTotalCents: CENTS(900_000),
    assessmentTotalCents: 0,
    assessmentTermMonths: 0,
    assessmentInterestPct: 0,
    monthlyDuesCents: CENTS(850),
    ...overrides,
  };
}

function run(overrides: Partial<CondoAssessmentInput> = {}) {
  return compute(baseInput(overrides), ASSUMPTIONS);
}

function monthly(result: ReturnType<typeof compute>, key: string) {
  return result.monthlyLines.find((l) => l.key === key);
}

function oneTime(result: ReturnType<typeof compute>, key: string) {
  return result.oneTimeLines.find((l) => l.key === key);
}

/* ---- The golden table ------------------------------------------------------ */

describe('condo-assessment golden table', () => {
  it('1 — fractional ownership share: 0.8654% of disclosed figures, exact cents', () => {
    const r = run({
      unitSharePct: 0.8654,
      reserveBalanceCents: CENTS(1_250_000),
      deferredItemsTotalCents: CENTS(4_000_000),
    });
    expect(oneTime(r, 'shareOfReserveBalance')?.amountCents).toBe(1_081_750);
    expect(oneTime(r, 'shareOfDeferredItems')?.amountCents).toBe(3_461_600);
    expect(oneTime(r, 'fundingGap')?.amountCents).toBe(2_379_850);
    // No assessment levied → the headline is the unit's funding gap.
    expect(r.headline).toEqual({ key: 'fundingGap', amountCents: 2_379_850 });
  });

  it('2 — reserves exceed deferred items: the gap is NEGATIVE and stated plainly', () => {
    const r = run({
      unitSharePct: 1.25,
      reserveBalanceCents: CENTS(2_000_000),
      deferredItemsTotalCents: CENTS(1_500_000),
    });
    expect(oneTime(r, 'shareOfReserveBalance')?.amountCents).toBe(2_500_000);
    expect(oneTime(r, 'shareOfDeferredItems')?.amountCents).toBe(1_875_000);
    expect(oneTime(r, 'fundingGap')?.amountCents).toBe(-625_000);
    expect(r.headline).toEqual({ key: 'fundingGap', amountCents: -625_000 });
  });

  it('3 — assessment amortized over 24 months at ZERO interest: straight division', () => {
    const r = run({
      assessmentTotalCents: CENTS(1_200_000),
      assessmentTermMonths: 24,
      assessmentInterestPct: 0,
    });
    // Unit share (1%) = $12,000; installment $500.00; total = the principal.
    expect(r.unitAssessmentCents).toBe(1_200_000);
    expect(monthly(r, 'assessmentInstallment')?.amountCents).toBe(50_000);
    expect(oneTime(r, 'assessmentTotal')?.amountCents).toBe(1_200_000);
    // An assessment is levied → the headline is the unit's assessment total.
    expect(r.headline).toEqual({ key: 'assessmentTotal', amountCents: 1_200_000 });
  });

  it('4 — the same assessment with disclosed 6% interest: amortized installment and total', () => {
    const r = run({
      assessmentTotalCents: CENTS(1_200_000),
      assessmentTermMonths: 24,
      assessmentInterestPct: 6,
    });
    expect(monthly(r, 'assessmentInstallment')?.amountCents).toBe(53_185);
    expect(oneTime(r, 'assessmentTotal')?.amountCents).toBe(1_276_434);
    expect(r.headline).toEqual({ key: 'assessmentTotal', amountCents: 1_276_434 });
    // The with-interest total exceeds the principal share — interest included.
    expect(r.headline.amountCents).toBeGreaterThan(r.unitAssessmentCents);
  });

  it('5 — zero reserve balance: the share is zero and the gap IS the deferred share', () => {
    const r = run({
      unitSharePct: 2,
      reserveBalanceCents: 0,
      deferredItemsTotalCents: CENTS(800_000),
    });
    expect(oneTime(r, 'shareOfReserveBalance')?.amountCents).toBe(0);
    expect(oneTime(r, 'shareOfDeferredItems')?.amountCents).toBe(1_600_000);
    expect(r.headline).toEqual({ key: 'fundingGap', amountCents: 1_600_000 });
  });

  it('6 — a lump-sum assessment (no term disclosed): total is the unit share, no installment', () => {
    const r = run({
      assessmentTotalCents: CENTS(1_200_000),
      assessmentTermMonths: 0,
    });
    expect(monthly(r, 'assessmentInstallment')).toBeUndefined();
    expect(oneTime(r, 'assessmentTotal')?.amountCents).toBe(1_200_000);
    expect(r.headline).toEqual({ key: 'assessmentTotal', amountCents: 1_200_000 });
  });
});

/* ---- Contract shape: arrays never mix, nothing is defaulted ---------------- */

describe('condo-assessment engine contract', () => {
  it('no one-time figure enters a monthly total: dues never move the headline', () => {
    const a = run({ assessmentTotalCents: CENTS(1_200_000), assessmentTermMonths: 24 });
    const b = compute(
      baseInput({
        assessmentTotalCents: CENTS(1_200_000),
        assessmentTermMonths: 24,
        monthlyDuesCents: CENTS(2_500),
      }),
      ASSUMPTIONS
    );
    // Different dues, identical headline and one-time lines.
    expect(b.headline).toEqual(a.headline);
    expect(b.oneTimeLines).toEqual(a.oneTimeLines);
    expect(monthly(a, 'monthlyDues')?.amountCents).toBe(85_000);
    expect(monthly(b, 'monthlyDues')?.amountCents).toBe(250_000);
  });

  it('monthly and one-time arrays carry disjoint, expected keys', () => {
    const r = run({
      assessmentTotalCents: CENTS(1_200_000),
      assessmentTermMonths: 24,
    });
    expect(r.monthlyLines.map((l) => l.key)).toEqual([
      'monthlyDues',
      'assessmentInstallment',
    ]);
    expect(r.oneTimeLines.map((l) => l.key)).toEqual([
      'shareOfDeferredItems',
      'shareOfReserveBalance',
      'fundingGap',
      'assessmentTotal',
    ]);
    // Without a levied assessment, the assessment lines are simply absent.
    const none = run();
    expect(none.monthlyLines.map((l) => l.key)).toEqual(['monthlyDues']);
    expect(none.oneTimeLines.map((l) => l.key)).toEqual([
      'shareOfDeferredItems',
      'shareOfReserveBalance',
      'fundingGap',
    ]);
  });

  it("every line carries basis 'input'; nothing is flagged, ever", () => {
    const r = run({
      assessmentTotalCents: CENTS(1_200_000),
      assessmentTermMonths: 24,
      assessmentInterestPct: 6,
    });
    for (const l of [...r.monthlyLines, ...r.oneTimeLines]) {
      expect(l.basis, l.key).toBe('input');
      expect(l.flagged, l.key).toBeUndefined();
    }
  });

  it('consults ZERO assumptions — the table renders empty for this tool', () => {
    expect(run().assumptionKeysUsed).toEqual([]);
  });

  it('no FieldSpec default exists: every association figure is user-supplied', () => {
    for (const field of CONDO_ASSESSMENT_ENGINE.fields) {
      expect(field.default, field.key).toBeUndefined();
      expect(field.defaultFromAssumption, field.key).toBeUndefined();
    }
  });

  it('is pure and deterministic: same input, same cents', () => {
    const input = baseInput({ unitSharePct: 0.7321 });
    expect(compute(input, ASSUMPTIONS)).toEqual(compute(input, ASSUMPTIONS));
  });

  it('fromFormValues converts display dollars to integer cents at the boundary', () => {
    expect(
      fromFormValues({
        unitSharePct: 0.8654,
        reserveBalance: 1_250_000,
        deferredItemsTotal: 4_000_000,
        assessmentTotal: 0,
        assessmentTermMonths: 0,
        assessmentInterestPct: 0,
        monthlyDues: 850.5,
      })
    ).toEqual({
      unitSharePct: 0.8654,
      reserveBalanceCents: 125_000_000,
      deferredItemsTotalCents: 400_000_000,
      assessmentTotalCents: 0,
      assessmentTermMonths: 0,
      assessmentInterestPct: 0,
      monthlyDuesCents: 85_050,
    });
  });

  it('registers all seven fields with wide bands (Part 6.2)', () => {
    expect(CONDO_ASSESSMENT_ENGINE.id).toBe('condo-assessment');
    expect(CONDO_ASSESSMENT_ENGINE.fields.map((f) => f.key)).toEqual([
      'unitSharePct',
      'reserveBalance',
      'deferredItemsTotal',
      'assessmentTotal',
      'assessmentTermMonths',
      'assessmentInterestPct',
      'monthlyDues',
    ]);
    const reserve = CONDO_ASSESSMENT_ENGINE.fields[1]!;
    // Wide-band rule: association balances can be enormous.
    expect(reserve.max).toBeGreaterThanOrEqual(1_000_000_000);
    const sharePct = CONDO_ASSESSMENT_ENGINE.fields[0]!;
    expect(sharePct.required).toBe(true);
    expect(sharePct.step).toBeLessThanOrEqual(0.0001); // fractional shares exist
  });
});
