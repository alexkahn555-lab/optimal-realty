import { describe, expect, it } from 'vitest';

import { ASSUMPTIONS } from '@/config/assumptions';
import {
  NET_PROCEEDS_ENGINE,
  compute,
  docStampsCents,
  titlePremiumCents,
  type NetProceedsInput,
} from '@/lib/calc/net-proceeds';

/**
 * GOLDEN TABLE — Build reference v2.0, Part 6.2. Written BEFORE the tool page.
 * Exact integer cents, locked. Every case from the reference table plus the
 * negative-net shortfall case and the HOA/estoppel branch.
 *
 * Interpretation note (flagged in the completion report): the reference's
 * fraction-of-$100 row compresses to "3,600.60 → 3,601"; per-unit statute math
 * (ceil to 6,001 units x $0.60) yields exactly $3,600.60 = 360,060 cents, which
 * is what the engine locks. No whole-dollar rounding is applied to tax lines.
 */

const CENTS = (dollars: number) => Math.round(dollars * 100);

function baseInput(overrides: Partial<NetProceedsInput> = {}): NetProceedsInput {
  return {
    salePriceCents: CENTS(600_000),
    county: 'miami-dade',
    propertyClass: 'single-family',
    mortgagePayoffCents: 0,
    secondLienPayoffCents: 0,
    commissionRatePct: 5.0,
    sellerConcessionsCents: 0,
    annualPropertyTaxCents: 0,
    closingDate: '2026-07-01',
    hoaMonthlyCents: 0,
    titlePaidBySeller: false,
    ...overrides,
  };
}

function line(result: ReturnType<typeof compute>, key: string) {
  return result.oneTimeLines.find((l) => l.key === key);
}

/* ---- Doc stamps: county/class branches + rounding (reference rows 1-4) ---- */

describe('docStampsCents', () => {
  it('Miami-Dade single-family: 6,000 units x $0.60, no surtax', () => {
    expect(docStampsCents(CENTS(600_000), 'miami-dade', 'single-family')).toBe(360_000_00 / 100);
  });

  it('Miami-Dade non-SF (conservative): base + surtax = $6,300', () => {
    expect(docStampsCents(CENTS(600_000), 'miami-dade', 'other')).toBe(630_000);
  });

  it('other-FL county: 6,000 units x $0.70 = $4,200', () => {
    expect(docStampsCents(CENTS(600_000), 'other-fl', 'single-family')).toBe(420_000);
  });

  it('fraction of $100 rounds UP: $600,050 → 6,001 units → $3,600.60', () => {
    expect(docStampsCents(CENTS(600_050), 'miami-dade', 'single-family')).toBe(360_060);
  });

  it('one dollar over a unit boundary still ceils: $600,001 → 6,001 units', () => {
    expect(docStampsCents(CENTS(600_001), 'miami-dade', 'single-family')).toBe(360_060);
  });
});

/* ---- Title premium: progressive promulgated bands (reference row 5) ------- */

describe('titlePremiumCents (progressive bands, seller-paid)', () => {
  it('$100,000 exactly: 100 x $5.75 = $575.00', () => {
    expect(titlePremiumCents(CENTS(100_000))).toBe(57_500);
  });

  it('$600,000: 100 x $5.75 + 500 x $5.00 = $3,075.00 — locked', () => {
    expect(titlePremiumCents(CENTS(600_000))).toBe(307_500);
  });

  it('$1,500,000 crosses the $1M band: $6,325.00', () => {
    // 100 x 5.75 + 900 x 5.00 + 500 x 2.50 = 575 + 4,500 + 1,250
    expect(titlePremiumCents(CENTS(1_500_000))).toBe(632_500);
  });

  it('fraction of $1,000 rounds up a unit: $600,500 → 601 units above 100', () => {
    // 100 x 5.75 + 501 x 5.00 = 575 + 2,505 = 3,080.00
    expect(titlePremiumCents(CENTS(600_500))).toBe(308_000);
  });
});

/* ---- Full ledger: engine-level golden cases ------------------------------- */

describe('compute — golden ledger cases', () => {
  it('tax proration (reference row 6): $9,125 annual, closing Jul 1 = day 182 → $4,550.00 seller debit', () => {
    const result = compute(
      baseInput({ annualPropertyTaxCents: CENTS(9_125) }),
      ASSUMPTIONS
    );
    expect(line(result, 'taxProration')?.amountCents).toBe(455_000);
  });

  it('tax proration absent when annual tax is 0', () => {
    const result = compute(baseInput(), ASSUMPTIONS);
    expect(line(result, 'taxProration')).toBeUndefined();
  });

  it('HOA branch: $600/mo, closing Jul 1 (day 1 of 31) → $19.35 proration + $299.00 estoppel', () => {
    const result = compute(baseInput({ hoaMonthlyCents: CENTS(600) }), ASSUMPTIONS);
    expect(line(result, 'hoaProration')?.amountCents).toBe(1_935);
    expect(line(result, 'estoppelFee')?.amountCents).toBe(29_900);
  });

  it('HOA absent → no proration line, no estoppel line', () => {
    const result = compute(baseInput(), ASSUMPTIONS);
    expect(line(result, 'hoaProration')).toBeUndefined();
    expect(line(result, 'estoppelFee')).toBeUndefined();
  });

  it('title premium included only when seller pays', () => {
    const withTitle = compute(baseInput({ titlePaidBySeller: true }), ASSUMPTIONS);
    const withoutTitle = compute(baseInput(), ASSUMPTIONS);
    expect(line(withTitle, 'titlePremium')?.amountCents).toBe(307_500);
    expect(line(withoutTitle, 'titlePremium')).toBeUndefined();
  });

  it('full ledger, exact cents: $600k SF Miami-Dade, $250k payoff, 5%, tax $9,125, Jul 1', () => {
    const result = compute(
      baseInput({
        mortgagePayoffCents: CENTS(250_000),
        annualPropertyTaxCents: CENTS(9_125),
      }),
      ASSUMPTIONS
    );

    expect(line(result, 'mortgagePayoff')?.amountCents).toBe(25_000_000);
    expect(line(result, 'commission')?.amountCents).toBe(3_000_000);
    expect(line(result, 'docStamps')?.amountCents).toBe(360_000);
    expect(line(result, 'docStampSurtax')).toBeUndefined();
    expect(line(result, 'taxProration')?.amountCents).toBe(455_000);
    expect(line(result, 'settlementFee')?.amountCents).toBe(59_500);
    expect(line(result, 'lienSearchFee')?.amountCents).toBe(15_000);
    // one lien released → one satisfaction recording at $18.50
    expect(line(result, 'satisfactionRecording')?.amountCents).toBe(1_850);

    // net = 60,000,000 − (25,000,000 + 3,000,000 + 360,000 + 455,000
    //        + 59,500 + 15,000 + 1,850) = 31,108,650
    expect(result.headline.key).toBe('netProceeds');
    expect(result.headline.amountCents).toBe(31_108_650);
  });

  it('surtax appears as its own ledger line for non-SF Miami-Dade', () => {
    const result = compute(baseInput({ propertyClass: 'other' }), ASSUMPTIONS);
    expect(line(result, 'docStamps')?.amountCents).toBe(360_000);
    expect(line(result, 'docStampSurtax')?.amountCents).toBe(270_000);
  });

  it('NEGATIVE NET (reference row 7): payoff > price returns a negative headline, never clamped', () => {
    const result = compute(
      baseInput({
        salePriceCents: CENTS(300_000),
        mortgagePayoffCents: CENTS(320_000),
      }),
      ASSUMPTIONS
    );
    // gross 30,000,000 − (32,000,000 payoff + 1,500,000 commission
    //   + 180,000 doc stamps + 59,500 settlement + 15,000 lien search
    //   + 1,850 satisfaction) = −3,756,350
    expect(result.headline.amountCents).toBe(-3_756_350);
  });
});

/* ---- Structural contract -------------------------------------------------- */

describe('compute — EngineResult contract', () => {
  it('monthlyLines and oneTimeLines are SEPARATE arrays; net-proceeds has no recurring lines', () => {
    const result = compute(baseInput(), ASSUMPTIONS);
    expect(Array.isArray(result.monthlyLines)).toBe(true);
    expect(Array.isArray(result.oneTimeLines)).toBe(true);
    expect(result.monthlyLines).toHaveLength(0);
    expect(result.oneTimeLines.length).toBeGreaterThan(0);
  });

  it('the headline equals gross minus the one-time lines only — nothing crosses arrays', () => {
    const result = compute(
      baseInput({
        mortgagePayoffCents: CENTS(250_000),
        annualPropertyTaxCents: CENTS(9_125),
        hoaMonthlyCents: CENTS(600),
        titlePaidBySeller: true,
      }),
      ASSUMPTIONS
    );
    const oneTimeSum = result.oneTimeLines.reduce((s, l) => s + l.amountCents, 0);
    expect(result.headline.amountCents).toBe(result.grossCents - oneTimeSum);
  });

  it('every ledger line carries a basis; non-statutory, non-input lines are flagged', () => {
    const result = compute(
      baseInput({ hoaMonthlyCents: CENTS(600), titlePaidBySeller: true }),
      ASSUMPTIONS
    );
    for (const l of result.oneTimeLines) {
      expect(l.basis).toBeTruthy();
      const shouldFlag = l.basis !== 'statutory' && l.basis !== 'input';
      expect(Boolean(l.flagged)).toBe(shouldFlag);
    }
  });

  it('assumptionKeysUsed: Miami-Dade branch exposes county doc-stamp keys + fee/title/commission keys', () => {
    const result = compute(baseInput(), ASSUMPTIONS);
    expect(result.assumptionKeysUsed).toEqual(
      expect.arrayContaining([
        'docStampPer100MiamiDade',
        'miamiDadeSurtaxPer100',
        'commissionRatePct',
        'titlePaidBySeller',
        'titleScheduleVerify',
        'settlementFee',
        'lienSearchFee',
        'satisfactionRecordingFee',
        'estoppelFee',
      ])
    );
    expect(result.assumptionKeysUsed).not.toContain('docStampPer100Statewide');
  });

  it('assumptionKeysUsed: other-FL branch swaps to the statewide key', () => {
    const result = compute(baseInput({ county: 'other-fl' }), ASSUMPTIONS);
    expect(result.assumptionKeysUsed).toContain('docStampPer100Statewide');
    expect(result.assumptionKeysUsed).not.toContain('docStampPer100MiamiDade');
    expect(result.assumptionKeysUsed).not.toContain('miamiDadeSurtaxPer100');
  });

  it('every assumptionKeysUsed entry exists in config/assumptions.ts', () => {
    const result = compute(baseInput(), ASSUMPTIONS);
    for (const key of result.assumptionKeysUsed) {
      expect(ASSUMPTIONS[key], `missing assumption key: ${key}`).toBeDefined();
    }
  });

  it('deterministic: same input twice → identical cents', () => {
    const input = baseInput({
      salePriceCents: CENTS(789_123),
      mortgagePayoffCents: CENTS(345_678),
      annualPropertyTaxCents: CENTS(12_345),
      hoaMonthlyCents: CENTS(432),
      titlePaidBySeller: true,
    });
    const a = compute(input, ASSUMPTIONS);
    const b = compute(input, ASSUMPTIONS);
    expect(a).toEqual(b);
  });
});

/* ---- FieldSpec surface ---------------------------------------------------- */

describe('NET_PROCEEDS_ENGINE.fields', () => {
  it('covers the reference input table', () => {
    const keys = NET_PROCEEDS_ENGINE.fields.map((f) => f.key);
    expect(keys).toEqual([
      'salePrice',
      'county',
      'propertyClass',
      'mortgagePayoff',
      'secondLienPayoff',
      'commissionRatePct',
      'sellerConcessions',
      'annualPropertyTax',
      'closingDate',
      'hoaMonthly',
      'titlePaidBySeller',
    ]);
  });

  it('assumption-backed defaults are declared, not inlined', () => {
    const commission = NET_PROCEEDS_ENGINE.fields.find(
      (f) => f.key === 'commissionRatePct'
    );
    const title = NET_PROCEEDS_ENGINE.fields.find((f) => f.key === 'titlePaidBySeller');
    expect(commission?.defaultFromAssumption).toBe('commissionRatePct');
    expect(commission?.default).toBeUndefined();
    expect(title?.defaultFromAssumption).toBe('titlePaidBySeller');
  });

  it('every labelKey and helperKey resolves in the ui-strings dictionary', async () => {
    const { UI } = await import('@/content/ui-strings');
    const dict = UI as Record<string, Record<string, { en: string; es: string }>>;
    for (const field of NET_PROCEEDS_ENGINE.fields) {
      const [group, key] = field.labelKey.split('.') as [string, string];
      expect(dict[group]?.[key], `labelKey ${field.labelKey}`).toBeDefined();
      if (field.helperKey) {
        const [hGroup, hKey] = field.helperKey.split('.') as [string, string];
        expect(dict[hGroup]?.[hKey], `helperKey ${field.helperKey}`).toBeDefined();
      }
    }
  });
});
