import { describe, expect, it } from 'vitest';

import { ASSUMPTIONS } from '@/config/assumptions';
import {
  VACANCY_COST_ENGINE,
  compute,
  fromFormValues,
  type VacancyCostInput,
} from '@/lib/calc/vacancy-cost';

/**
 * GOLDEN TABLE — Build reference v2.0, Part 6.4. Written BEFORE the tool page.
 * Exact integer cents (and integer HUNDREDTHS OF A DAY for the days-valued
 * secondary line), locked. Formulae:
 *   dailyRent = rent × 12 / 365          (exact rational, never pre-rounded)
 *   vacancyLoss = dailyRent × vacantDays (rounded ONCE, at the line)
 *   totalCost = vacancyLoss + turnoverCost
 *   maxExtraVacantDays = (delta × leaseMonths) / dailyRent
 */

const CENTS = (dollars: number) => Math.round(dollars * 100);

function baseInput(overrides: Partial<VacancyCostInput> = {}): VacancyCostInput {
  return {
    monthlyRentCents: CENTS(2_000),
    vacantDays: 0,
    turnoverCostCents: 0,
    proposedRentIncreaseCents: 0,
    leaseMonths: 12,
    ...overrides,
  };
}

function run(overrides: Partial<VacancyCostInput> = {}) {
  return compute(baseInput(overrides), ASSUMPTIONS);
}

function line(result: ReturnType<typeof compute>, key: string) {
  return result.oneTimeLines.find((l) => l.key === key);
}

/* ---- The golden table (six locked cases) ---------------------------------- */

describe('vacancy-cost golden table', () => {
  it('1 — whole-day baseline: $3,650 rent is exactly $120/day', () => {
    // dailyRent = 365,000c × 12 / 365 = 12,000c even; 10 days + $500 turnover.
    const r = run({
      monthlyRentCents: CENTS(3_650),
      vacantDays: 10,
      turnoverCostCents: CENTS(500),
    });
    expect(line(r, 'vacancyLoss')?.amountCents).toBe(120_000);
    expect(line(r, 'turnoverCost')?.amountCents).toBe(50_000);
    expect(r.headline).toEqual({ key: 'vacancyTotal', amountCents: 170_000 });
    expect(r.maxExtraVacantDayHundredths).toBe(0);
  });

  it('2 — fractional daily rate: the cents round ONCE, at the line', () => {
    // $2,000 rent: loss = 200,000 × 12 × 7 / 365 = 46,027.397…c → 46,027c.
    const r = run({ monthlyRentCents: CENTS(2_000), vacantDays: 7 });
    expect(line(r, 'vacancyLoss')?.amountCents).toBe(46_027);
    expect(r.headline.amountCents).toBe(46_027);
  });

  it('3 — zero vacant days: loss is zero, turnover stands alone', () => {
    const r = run({
      monthlyRentCents: CENTS(2_500),
      vacantDays: 0,
      turnoverCostCents: CENTS(800),
    });
    expect(line(r, 'vacancyLoss')?.amountCents).toBe(0);
    expect(line(r, 'turnoverCost')?.amountCents).toBe(80_000);
    expect(r.headline.amountCents).toBe(80_000);
  });

  it('4 — zero turnover cost: the loss IS the total', () => {
    // $1,825 rent: dailyRent = 182,500 × 12 / 365 = 6,000c even; 15 days.
    const r = run({ monthlyRentCents: CENTS(1_825), vacantDays: 15 });
    expect(line(r, 'vacancyLoss')?.amountCents).toBe(90_000);
    expect(line(r, 'turnoverCost')?.amountCents).toBe(0);
    expect(r.headline.amountCents).toBe(90_000);
  });

  it('5 — a $5 increase over a 6-month lease covers a FRACTION of a day', () => {
    // extra = 500c × 6 / (300,000 × 12 / 365)c = 0.30417 d → 30 hundredths.
    const r = run({
      monthlyRentCents: CENTS(3_000),
      vacantDays: 20,
      turnoverCostCents: CENTS(1_000),
      proposedRentIncreaseCents: CENTS(5),
      leaseMonths: 6,
    });
    expect(line(r, 'vacancyLoss')?.amountCents).toBe(197_260); // 72,000,000/365 rounded
    expect(r.headline.amountCents).toBe(297_260);
    expect(r.maxExtraVacantDayHundredths).toBe(30); // 0.30 days
    expect(r.secondaryLines?.[0]).toMatchObject({
      key: 'maxExtraVacantDays',
      amountCents: 30,
      basis: 'input',
    });
  });

  it('6 — a $50 increase across a 12-month lease covers multiple days', () => {
    // extra = 5,000c × 12 / (200,000 × 12 / 365)c = 9.125 d → 913 hundredths.
    const r = run({
      monthlyRentCents: CENTS(2_000),
      vacantDays: 30,
      turnoverCostCents: CENTS(1_500),
      proposedRentIncreaseCents: CENTS(50),
      leaseMonths: 12,
    });
    expect(line(r, 'vacancyLoss')?.amountCents).toBe(197_260);
    expect(line(r, 'turnoverCost')?.amountCents).toBe(150_000);
    expect(r.headline).toEqual({ key: 'vacancyTotal', amountCents: 347_260 });
    expect(r.maxExtraVacantDayHundredths).toBe(913); // 9.13 days
  });
});

/* ---- Contract shape -------------------------------------------------------- */

describe('vacancy-cost engine contract', () => {
  it('nothing here is recurring: monthlyLines is always empty', () => {
    const r = run({ vacantDays: 45, turnoverCostCents: CENTS(2_000) });
    expect(r.monthlyLines).toEqual([]);
    expect(r.oneTimeLines.map((l) => l.key)).toEqual([
      'vacancyLoss',
      'turnoverCost',
    ]);
  });

  it('every line carries basis input; nothing is flagged', () => {
    const r = run({
      vacantDays: 10,
      turnoverCostCents: CENTS(300),
      proposedRentIncreaseCents: CENTS(25),
    });
    for (const l of [...r.oneTimeLines, ...(r.secondaryLines ?? [])]) {
      expect(l.basis).toBe('input');
      expect(l.flagged).toBeUndefined();
    }
  });

  it('the days figure is a SECONDARY line, never in the cost arrays', () => {
    const r = run({ proposedRentIncreaseCents: CENTS(50) });
    expect(r.oneTimeLines.some((l) => l.key === 'maxExtraVacantDays')).toBe(false);
    expect(r.monthlyLines.some((l) => l.key === 'maxExtraVacantDays')).toBe(false);
    expect(r.secondaryLines?.map((l) => l.key)).toEqual(['maxExtraVacantDays']);
  });

  it('zero rent guard: the days line divides by rent and degrades to 0', () => {
    // Form bounds keep rent >= $1; the engine still never divides by zero.
    const r = run({ monthlyRentCents: 0, proposedRentIncreaseCents: CENTS(50) });
    expect(r.maxExtraVacantDayHundredths).toBe(0);
  });

  it('is pure and deterministic: same input, same cents, no clock', () => {
    const input = baseInput({ vacantDays: 17, turnoverCostCents: 12_345 });
    expect(compute(input, ASSUMPTIONS)).toEqual(compute(input, ASSUMPTIONS));
  });

  it('fromFormValues converts display dollars to integer cents at the boundary', () => {
    expect(
      fromFormValues({
        monthlyRent: 2_000,
        vacantDays: 7,
        turnoverCost: 350.5,
        proposedRentIncrease: 25,
        leaseMonths: 12,
      })
    ).toEqual({
      monthlyRentCents: 200_000,
      vacantDays: 7,
      turnoverCostCents: 35_050,
      proposedRentIncreaseCents: 2_500,
      leaseMonths: 12,
    });
  });

  it('assumptionKeysUsed surfaces only the lease-term default', () => {
    expect(run().assumptionKeysUsed).toEqual(['leaseMonthsDefault']);
    expect(ASSUMPTIONS.leaseMonthsDefault?.value).toBe(12);
    expect(ASSUMPTIONS.leaseMonthsDefault?.basis).toBe('unconfirmed-default');
  });

  it('registers all five fields with wide bands (Part 6.2)', () => {
    expect(VACANCY_COST_ENGINE.id).toBe('vacancy-cost');
    expect(VACANCY_COST_ENGINE.fields.map((f) => f.key)).toEqual([
      'monthlyRent',
      'vacantDays',
      'turnoverCost',
      'proposedRentIncrease',
      'leaseMonths',
    ]);
    const rent = VACANCY_COST_ENGINE.fields[0]!;
    expect(rent.required).toBe(true);
    expect(rent.kind).toBe('currency');
    // Wide-band rule: never narrowed around an assumed typical rental.
    expect(rent.max).toBeGreaterThanOrEqual(1_000_000);
  });
});
