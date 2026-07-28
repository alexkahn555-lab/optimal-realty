import { describe, expect, it } from 'vitest';

import { ASSUMPTIONS } from '@/config/assumptions';
import {
  TAX_RESET_ENGINE,
  compute,
  fromFormValues,
  type TaxResetInput,
} from '@/lib/calc/tax-reset';

/**
 * GOLDEN TABLE — Build reference v2.0, Part 6.3. Written BEFORE the tool page.
 * Exact integer cents, locked; expected values derived independently from the
 * spec formulae — never from the engine. Millage rides as integer
 * MILLI-MILLS (mills × 1000 — the 5f fixed-point pattern for non-money
 * numbers); tax = taxable × millage / 1000, rounded ONCE per figure.
 *
 * The ONLY assumption consulted is saveOurHomesCapPct (statutory — verify);
 * millage and both exemption amounts are REQUIRED user inputs from the
 * parcel's TRIM notice, never defaults (Part 6.1 "do not guess").
 */

const CENTS = (dollars: number) => Math.round(dollars * 100);

function baseInput(overrides: Partial<TaxResetInput> = {}): TaxResetInput {
  return {
    currentAssessedValueCents: CENTS(150_000),
    currentExemptionsCents: CENTS(50_000),
    purchasePriceCents: CENTS(650_000),
    millageMilliMills: 19_800, // 19.8 mills
    buyerIntendsHomestead: true,
    buyerExemptionsCents: CENTS(50_000),
    purchaseYear: 2026,
    projectionYears: 0,
    ...overrides,
  };
}

function run(overrides: Partial<TaxResetInput> = {}) {
  return compute(baseInput(overrides), ASSUMPTIONS);
}

function oneTime(result: ReturnType<typeof compute>, key: string) {
  return result.oneTimeLines.find((l) => l.key === key);
}

/* ---- The golden table ------------------------------------------------------ */

describe('tax-reset golden table', () => {
  it('1 — long-held homestead: the reset raises the bill by $9,900/yr', () => {
    const r = run();
    // Current: (150k − 50k) × 19.8/1000 = $1,980. New: (650k − 50k) × 19.8/1000 = $11,880.
    expect(oneTime(r, 'currentAnnualTax')?.amountCents).toBe(198_000);
    expect(oneTime(r, 'newAnnualTax')?.amountCents).toBe(1_188_000);
    expect(oneTime(r, 'taxDifference')?.amountCents).toBe(990_000);
    expect(r.headline).toEqual({ key: 'taxDifference', amountCents: 990_000 });
  });

  it('2 — buyer NOT claiming homestead: no exemption applies to the new bill', () => {
    const r = run({ buyerIntendsHomestead: false });
    expect(oneTime(r, 'newAnnualTax')?.amountCents).toBe(1_287_000); // 650k × 19.8/1000
    expect(r.headline.amountCents).toBe(1_089_000);
  });

  it('3 — assessed above purchase price: the difference is NEGATIVE, stated plainly', () => {
    const r = run({
      currentAssessedValueCents: CENTS(800_000),
      purchasePriceCents: CENTS(500_000),
    });
    expect(oneTime(r, 'currentAnnualTax')?.amountCents).toBe(1_485_000);
    expect(oneTime(r, 'newAnnualTax')?.amountCents).toBe(891_000);
    expect(r.headline).toEqual({ key: 'taxDifference', amountCents: -594_000 });
  });

  it('4 — exemptions exceeding assessed value clamp taxable at ZERO, never negative', () => {
    const r = run({
      currentAssessedValueCents: CENTS(40_000),
      currentExemptionsCents: CENTS(50_000),
      purchasePriceCents: CENTS(300_000),
    });
    expect(oneTime(r, 'currentAnnualTax')?.amountCents).toBe(0);
    expect(oneTime(r, 'newAnnualTax')?.amountCents).toBe(495_000);
    expect(r.headline.amountCents).toBe(495_000);
  });

  it('5 — multi-year projection under the 3% growth limitation, exact cents', () => {
    const r = run({ projectionYears: 3 });
    expect(r.projection.map((row) => row.year)).toEqual([2027, 2028, 2029]);
    // Year 1 carries the re-benchmarked value; growth applies to SUBSEQUENT years.
    expect(r.projection[0]).toMatchObject({
      year: 2027,
      assessedCents: 65_000_000,
      taxCents: 1_188_000,
    });
    expect(r.projection[1]).toMatchObject({
      year: 2028,
      assessedCents: 66_950_000, // × 1.03
      taxCents: 1_226_610,
    });
    expect(r.projection[2]).toMatchObject({
      year: 2029,
      assessedCents: 68_958_500,
      taxCents: 1_266_378,
    });
    // Projection rows carry the growth limitation's basis (statutory).
    for (const row of r.projection) expect(row.basis).toBe('statutory');
  });

  it('6 — no projection figure enters the headline or the one-time lines', () => {
    const withProjection = run({ projectionYears: 10 });
    const without = run({ projectionYears: 0 });
    expect(withProjection.headline).toEqual(without.headline);
    expect(withProjection.oneTimeLines).toEqual(without.oneTimeLines);
    expect(without.projection).toEqual([]);
  });
});

/* ---- Contract shape -------------------------------------------------------- */

describe('tax-reset engine contract', () => {
  it('produces annual figures only: monthlyLines is ALWAYS empty', () => {
    expect(run({ projectionYears: 5 }).monthlyLines).toEqual([]);
    expect(run({ buyerIntendsHomestead: false }).monthlyLines).toEqual([]);
  });

  it('one-time lines are exactly current, new, difference — basis input, unflagged', () => {
    const r = run();
    expect(r.oneTimeLines.map((l) => l.key)).toEqual([
      'currentAnnualTax',
      'newAnnualTax',
      'taxDifference',
    ]);
    for (const l of r.oneTimeLines) {
      expect(l.basis, l.key).toBe('input');
      expect(l.flagged, l.key).toBeUndefined();
    }
  });

  it('the comparison chart data is the two scenario bars — never a place', () => {
    const r = run();
    expect(r.compareBars).toEqual({
      aKey: 'currentAnnualTax',
      bKey: 'newAnnualTax',
      aCents: 198_000,
      bCents: 1_188_000,
    });
  });

  it('consults ONLY saveOurHomesCapPct — statutory, cited, dated', () => {
    expect(run().assumptionKeysUsed).toEqual(['saveOurHomesCapPct']);
    const cap = ASSUMPTIONS.saveOurHomesCapPct;
    expect(cap?.value).toBe(3);
    expect(cap?.basis).toBe('statutory');
    expect(cap?.cite).toContain('193.155');
    expect(cap?.asOf).toBe('2026-07-28');
    // The binding input-model rule: NO millage or exemption key in config.
    for (const key of Object.keys(ASSUMPTIONS)) {
      expect(key.toLowerCase()).not.toContain('millage');
      expect(key.toLowerCase()).not.toContain('exemption');
    }
  });

  it('millage and BOTH exemption fields are required inputs with no default', () => {
    for (const key of ['millageRate', 'currentExemptions', 'buyerExemptions']) {
      const field = TAX_RESET_ENGINE.fields.find((f) => f.key === key);
      expect(field?.required, key).toBe(true);
      expect(field?.default, key).toBeUndefined();
      expect(field?.defaultFromAssumption, key).toBeUndefined();
    }
  });

  it('an edited cap flows through the projection (user-editable assumption)', () => {
    const capped = compute(baseInput({ projectionYears: 2 }), {
      ...ASSUMPTIONS,
      saveOurHomesCapPct: { ...ASSUMPTIONS.saveOurHomesCapPct!, value: 0 },
    });
    // 0% growth: year 2 repeats year 1 exactly.
    expect(capped.projection[1]?.assessedCents).toBe(65_000_000);
    expect(capped.projection[1]?.taxCents).toBe(1_188_000);
  });

  it('is pure and deterministic: same input, same cents', () => {
    const input = baseInput({ projectionYears: 7 });
    expect(compute(input, ASSUMPTIONS)).toEqual(compute(input, ASSUMPTIONS));
  });

  it('fromFormValues converts dollars and mills at the boundary (milli-mills)', () => {
    expect(
      fromFormValues({
        currentAssessedValue: 150_000,
        currentExemptions: 50_000,
        purchasePrice: 650_000,
        millageRate: 19.8,
        buyerIntendsHomestead: true,
        buyerExemptions: 50_000,
        purchaseYear: 2026,
        projectionYears: 5,
      })
    ).toEqual(baseInput({ projectionYears: 5 }));
  });

  it('registers all eight fields with wide bands (Part 6.2)', () => {
    expect(TAX_RESET_ENGINE.id).toBe('tax-reset');
    expect(TAX_RESET_ENGINE.fields.map((f) => f.key)).toEqual([
      'currentAssessedValue',
      'currentExemptions',
      'purchasePrice',
      'millageRate',
      'buyerIntendsHomestead',
      'buyerExemptions',
      'purchaseYear',
      'projectionYears',
    ]);
    const millage = TAX_RESET_ENGINE.fields.find((f) => f.key === 'millageRate')!;
    // Wide-band rule: never narrowed around an assumed composite millage.
    expect(millage.min).toBeLessThanOrEqual(1);
    expect(millage.max).toBeGreaterThanOrEqual(100);
  });
});
