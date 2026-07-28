import { describe, expect, it } from 'vitest';

import { ASSUMPTIONS } from '@/config/assumptions';
import {
  RENTAL_CASHFLOW_ENGINE,
  compute,
  fromFormValues,
  type RentalCashflowInput,
} from '@/lib/calc/rental-cashflow';

/**
 * GOLDEN TABLE — Build reference v2.0, Part 6.4. Written BEFORE the tool page.
 * Exact integer cents locked; ratio outputs locked at fixed precision
 * (integer BASIS POINTS for capRate/cashOnCash, integer HUNDREDTHS for dscr).
 * Expected values derived independently from the spec formulae — never from
 * the engine. Amortization checkpoints match standard tables:
 * $240,000 @ 6.5%/30y = $1,516.96/mo · $100,000 @ 12%/30y = $1,028.61/mo.
 */

const CENTS = (dollars: number) => Math.round(dollars * 100);

function baseInput(overrides: Partial<RentalCashflowInput> = {}): RentalCashflowInput {
  return {
    purchasePriceCents: CENTS(300_000),
    monthlyRentCents: CENTS(3_000),
    downPaymentPct: 20,
    interestRatePct: 6.5,
    loanTermYears: 30,
    annualTaxesCents: CENTS(4_800),
    annualInsuranceCents: CENTS(2_400),
    hoaMonthlyCents: 0,
    vacancyRatePct: 5,
    maintenancePct: 8,
    managementPct: 10,
    closingCostsCents: CENTS(6_000),
    ...overrides,
  };
}

function run(overrides: Partial<RentalCashflowInput> = {}) {
  return compute(baseInput(overrides), ASSUMPTIONS);
}

function monthly(result: ReturnType<typeof compute>, key: string) {
  return result.monthlyLines.find((l) => l.key === key);
}

function oneTime(result: ReturnType<typeof compute>, key: string) {
  return result.oneTimeLines.find((l) => l.key === key);
}

function secondary(result: ReturnType<typeof compute>, key: string) {
  return result.secondaryLines.find((l) => l.key === key);
}

/* ---- The golden table ------------------------------------------------------ */

describe('rental-cashflow golden table', () => {
  it('1 — baseline on the flagged defaults (5% vac · 8% maint · 10% mgmt · 6.5%)', () => {
    const r = run();
    // Monthly picture: rent 3,000 · vacancy 150 · taxes 400 · insurance 200 ·
    // maintenance 240 · management 300 · debt service 1,516.96.
    expect(monthly(r, 'rent')?.amountCents).toBe(300_000);
    expect(monthly(r, 'vacancyAllowance')?.amountCents).toBe(15_000);
    expect(monthly(r, 'propertyTaxes')?.amountCents).toBe(40_000);
    expect(monthly(r, 'insurance')?.amountCents).toBe(20_000);
    expect(monthly(r, 'maintenance')?.amountCents).toBe(24_000);
    expect(monthly(r, 'management')?.amountCents).toBe(30_000);
    expect(monthly(r, 'debtService')?.amountCents).toBe(151_696);
    // One-time picture: down payment 60,000 · closing 6,000.
    expect(oneTime(r, 'downPayment')?.amountCents).toBe(6_000_000);
    expect(oneTime(r, 'closingCosts')?.amountCents).toBe(600_000);
    // Annuals: NOI 20,520 · debt 18,203.52 · cash flow 2,316.48.
    expect(r.noiCents).toBe(2_052_000);
    expect(r.headline).toEqual({ key: 'annualCashFlow', amountCents: 231_648 });
    expect(r.capRateBps).toBe(684); // 6.84%
    expect(r.cashOnCashBps).toBe(351); // 3.51% on 66,000 invested
    expect(r.dscrHundredths).toBe(113); // 1.13
  });

  it('2 — all-cash purchase: zero debt service, dscr UNDEFINED (absent), never infinite', () => {
    const r = run({
      purchasePriceCents: CENTS(200_000),
      monthlyRentCents: CENTS(2_000),
      downPaymentPct: 100,
      annualTaxesCents: CENTS(3_600),
      annualInsuranceCents: CENTS(1_800),
      hoaMonthlyCents: CENTS(250),
      closingCostsCents: CENTS(3_000),
    });
    expect(monthly(r, 'debtService')).toBeUndefined();
    expect(monthly(r, 'hoa')?.amountCents).toBe(25_000);
    expect(r.noiCents).toBe(1_008_000);
    expect(r.headline.amountCents).toBe(1_008_000);
    expect(r.capRateBps).toBe(504);
    expect(r.cashOnCashBps).toBe(497); // on 203,000 invested
    expect(r.dscrHundredths).toBeNull();
    expect(secondary(r, 'dscr')).toBeUndefined();
  });

  it('3 — negative cash flow renders plainly, never clamped to zero', () => {
    const r = run({ monthlyRentCents: CENTS(2_500) });
    expect(r.noiCents).toBe(1_590_000);
    expect(r.headline.amountCents).toBe(-230_352);
    expect(r.capRateBps).toBe(530);
    expect(r.cashOnCashBps).toBe(-349); // negative return stated as-is
    expect(r.dscrHundredths).toBe(87); // 0.87 — below coverage, stated as-is
  });

  it('4 — amortization exactness: $100,000 @ 12%/30y is $1,028.61/mo', () => {
    const r = run({
      purchasePriceCents: CENTS(125_000),
      monthlyRentCents: CENTS(1_500),
      interestRatePct: 12,
      annualTaxesCents: 0,
      annualInsuranceCents: 0,
      vacancyRatePct: 0,
      maintenancePct: 0,
      managementPct: 0,
      closingCostsCents: 0,
    });
    expect(monthly(r, 'debtService')?.amountCents).toBe(102_861);
    expect(r.headline.amountCents).toBe(1_800_000 - 12 * 102_861); // 565,668
    expect(r.dscrHundredths).toBe(146);
  });

  it('5 — zero-interest branch: straight-line loan/n; zero cash invested → cashOnCash absent', () => {
    const r = run({
      purchasePriceCents: CENTS(120_000),
      monthlyRentCents: CENTS(1_500),
      downPaymentPct: 0,
      interestRatePct: 0,
      loanTermYears: 10,
      annualTaxesCents: 0,
      annualInsuranceCents: 0,
      vacancyRatePct: 0,
      maintenancePct: 0,
      managementPct: 0,
      closingCostsCents: 0,
    });
    expect(monthly(r, 'debtService')?.amountCents).toBe(100_000); // 12,000,000 / 120
    expect(r.headline.amountCents).toBe(600_000);
    expect(r.cashOnCashBps).toBeNull();
    expect(secondary(r, 'cashOnCash')).toBeUndefined();
    expect(r.dscrHundredths).toBe(150);
  });

  it('6 — the vacancy allowance applies to GROSS scheduled income, never net', () => {
    const r = run({
      purchasePriceCents: CENTS(150_000),
      monthlyRentCents: CENTS(1_000),
      downPaymentPct: 100,
      annualTaxesCents: 0,
      annualInsuranceCents: 0,
      vacancyRatePct: 10,
      maintenancePct: 0,
      managementPct: 0,
      closingCostsCents: 0,
    });
    // 10% of the GROSS $1,000 rent = $100/mo — not 10% of any netted figure.
    expect(monthly(r, 'vacancyAllowance')?.amountCents).toBe(10_000);
    expect(r.noiCents).toBe(1_080_000); // GSI 12,000 − 1,200 vacancy, no opex
    expect(r.capRateBps).toBe(720);
    expect(r.cashOnCashBps).toBe(720);
  });
});

/* ---- Contract shape: the two arrays never mix ------------------------------ */

describe('rental-cashflow engine contract', () => {
  it('monthly and one-time arrays carry disjoint keys; no one-time figure enters a monthly total', () => {
    const r = run();
    expect(r.monthlyLines.map((l) => l.key)).toEqual([
      'rent',
      'vacancyAllowance',
      'propertyTaxes',
      'insurance',
      'maintenance',
      'management',
      'debtService',
    ]);
    expect(r.oneTimeLines.map((l) => l.key)).toEqual([
      'downPayment',
      'closingCosts',
    ]);
    // The headline is derived from ANNUAL recurring figures alone: recompute
    // it independently from the monthly-side annuals. If any one-time figure
    // (down payment 6,000,000 / closing 600,000) leaked in, this identity
    // breaks.
    const annualDebt = 12 * (monthly(r, 'debtService')?.amountCents ?? 0);
    expect(r.headline.amountCents).toBe(r.noiCents - annualDebt);
    // And the one-time total influences ONLY cash-on-cash, never the headline.
    expect(r.headline.amountCents + 6_000_000).not.toBe(r.headline.amountCents);
    expect(r.cashOnCashBps).toBe(
      Math.round((r.headline.amountCents / 6_600_000) * 10_000)
    );
  });

  it('ratio lines are ratios, not cents: keyed for percent/ratio display', () => {
    const r = run();
    expect(r.secondaryLines.map((l) => l.key)).toEqual([
      'noi',
      'capRate',
      'cashOnCash',
      'dscr',
    ]);
    expect(secondary(r, 'capRate')?.amountCents).toBe(684); // basis points
    expect(secondary(r, 'cashOnCash')?.amountCents).toBe(351); // basis points
    expect(secondary(r, 'dscr')?.amountCents).toBe(113); // hundredths
    expect(secondary(r, 'noi')?.amountCents).toBe(2_052_000); // money (cents)
  });

  it('flagged defaults carry their basis; user inputs carry input', () => {
    const r = run();
    expect(monthly(r, 'rent')?.basis).toBe('input');
    expect(monthly(r, 'propertyTaxes')?.basis).toBe('input');
    expect(monthly(r, 'insurance')?.basis).toBe('input');
    expect(monthly(r, 'vacancyAllowance')?.basis).toBe('unconfirmed-default');
    expect(monthly(r, 'vacancyAllowance')?.flagged).toBe(true);
    expect(monthly(r, 'maintenance')?.basis).toBe('unconfirmed-default');
    expect(monthly(r, 'management')?.basis).toBe('unconfirmed-default');
    expect(monthly(r, 'debtService')?.basis).toBe('market-must-update');
    expect(monthly(r, 'debtService')?.flagged).toBe(true);
    expect(oneTime(r, 'downPayment')?.basis).toBe('input');
    expect(oneTime(r, 'closingCosts')?.basis).toBe('input');
  });

  it('is pure and deterministic: same input, same cents', () => {
    const input = baseInput({ monthlyRentCents: CENTS(2_750) });
    expect(compute(input, ASSUMPTIONS)).toEqual(compute(input, ASSUMPTIONS));
  });

  it('assumptionKeysUsed surfaces the three flagged percentages plus the market rate', () => {
    expect(run().assumptionKeysUsed).toEqual([
      'vacancyRatePct',
      'maintenancePct',
      'managementPct',
      'mortgageRatePct',
    ]);
    for (const key of run().assumptionKeysUsed) {
      expect(ASSUMPTIONS[key], key).toBeDefined();
    }
    // Part 6.1: NO insurance default — annual insurance is a required input.
    expect(run().assumptionKeysUsed).not.toContain('insuranceAnnualDefault');
  });

  it('fromFormValues converts display dollars to integer cents at the boundary', () => {
    expect(
      fromFormValues({
        purchasePrice: 300_000,
        monthlyRent: 3_000,
        downPaymentPct: 20,
        interestRatePct: 6.5,
        loanTermYears: 30,
        annualTaxes: 4_800,
        annualInsurance: 2_400.5,
        hoaMonthly: 0,
        vacancyRatePct: 5,
        maintenancePct: 8,
        managementPct: 10,
        closingCosts: 6_000,
      })
    ).toEqual(baseInput({ annualInsuranceCents: 240_050 }));
  });

  it('the insurance field is required with NO prefill (Part 6.1)', () => {
    const field = RENTAL_CASHFLOW_ENGINE.fields.find(
      (f) => f.key === 'annualInsurance'
    );
    expect(field?.required).toBe(true);
    expect(field?.default).toBeUndefined();
    expect(field?.defaultFromAssumption).toBeUndefined();
  });

  it('registers all twelve fields with wide bands (Part 6.2)', () => {
    expect(RENTAL_CASHFLOW_ENGINE.id).toBe('rental-cashflow');
    expect(RENTAL_CASHFLOW_ENGINE.fields.map((f) => f.key)).toEqual([
      'purchasePrice',
      'monthlyRent',
      'downPaymentPct',
      'interestRatePct',
      'loanTermYears',
      'annualTaxes',
      'annualInsurance',
      'hoaMonthly',
      'vacancyRatePct',
      'maintenancePct',
      'managementPct',
      'closingCosts',
    ]);
    const price = RENTAL_CASHFLOW_ENGINE.fields[0]!;
    // Wide-band rule: never narrowed around an assumed typical property.
    expect(price.max).toBeGreaterThanOrEqual(100_000_000);
  });
});
