import { describe, expect, it } from 'vitest';
import { parseCalcState, serializeCalcState } from '@/components/calc/query';
import { NET_PROCEEDS_ENGINE } from '@/lib/calc/net-proceeds';
import { VACANCY_COST_ENGINE } from '@/lib/calc/vacancy-cost';
import type { CalcFormValues } from '@/lib/calc/registry';

/**
 * Result-state <-> querystring codec (Part 6.5) — the roundtrip guarantee the
 * prior session owed: only non-default values serialize; parsing is
 * FieldSpec-validated so an out-of-range, malformed, or unknown param is
 * dropped, never trusted.
 */

const FIELDS = NET_PROCEEDS_ENGINE.fields;

const DEFAULTS: CalcFormValues = {
  county: 'miami-dade',
  propertyClass: 'single-family',
  mortgagePayoff: 0,
  secondLienPayoff: 0,
  commissionRatePct: 5,
  sellerConcessions: 0,
  annualPropertyTax: 0,
  hoaMonthly: 0,
  titlePaidBySeller: false,
};

describe('calc query codec', () => {
  it('roundtrips non-default values and omits defaults', () => {
    const values: CalcFormValues = {
      ...DEFAULTS,
      salePrice: 650_000,
      county: 'other-fl',
      closingDate: '2026-09-15',
      titlePaidBySeller: true,
    };
    const query = serializeCalcState(FIELDS, values, DEFAULTS);
    const params = new URLSearchParams(query);

    // Defaults never serialize.
    expect(params.get('propertyClass')).toBeNull();
    expect(params.get('mortgagePayoff')).toBeNull();
    expect(params.get('commissionRatePct')).toBeNull();
    // Non-defaults do — booleans as 1/0.
    expect(params.get('salePrice')).toBe('650000');
    expect(params.get('county')).toBe('other-fl');
    expect(params.get('titlePaidBySeller')).toBe('1');

    const parsed = parseCalcState(FIELDS, `?${query}`);
    expect(parsed).toEqual({
      salePrice: 650_000,
      county: 'other-fl',
      closingDate: '2026-09-15',
      titlePaidBySeller: true,
    });
  });

  it('serializes an empty query when everything is default', () => {
    expect(serializeCalcState(FIELDS, { ...DEFAULTS }, DEFAULTS)).toBe('');
  });

  it('drops out-of-range numerics on parse (FieldSpec bounds)', () => {
    // salePrice min 50_000 / max 20_000_000.
    expect(parseCalcState(FIELDS, '?salePrice=49999')).toEqual({});
    expect(parseCalcState(FIELDS, '?salePrice=20000001')).toEqual({});
    expect(parseCalcState(FIELDS, '?salePrice=50000')).toEqual({
      salePrice: 50_000,
    });
    // commissionRatePct max 10.
    expect(parseCalcState(FIELDS, '?commissionRatePct=10.5')).toEqual({});
  });

  it('drops malformed dates, unknown enums, junk booleans, unknown params', () => {
    expect(parseCalcState(FIELDS, '?closingDate=not-a-date')).toEqual({});
    expect(parseCalcState(FIELDS, '?closingDate=2026-9-1')).toEqual({});
    expect(parseCalcState(FIELDS, '?county=broward')).toEqual({});
    expect(parseCalcState(FIELDS, '?titlePaidBySeller=yes')).toEqual({});
    expect(parseCalcState(FIELDS, '?salePrice=abc')).toEqual({});
    expect(parseCalcState(FIELDS, '?evil=1&__proto__=x')).toEqual({});
  });

  it('integer fields round on parse', () => {
    // No integer-kind field ships in net-proceeds; guard the codec branch
    // directly with a synthetic spec so the behavior stays pinned.
    const parsed = parseCalcState(
      [{ key: 'n', kind: 'integer', required: false, labelKey: 'calcField.salePrice' }],
      '?n=3.7'
    );
    expect(parsed).toEqual({ n: 4 });
  });
});

/** 5e — the codec roundtrip on the second engine's FieldSpec. */
describe('calc query codec — vacancy-cost (5e)', () => {
  const FIELDS_V = VACANCY_COST_ENGINE.fields;
  const DEFAULTS_V: CalcFormValues = {
    vacantDays: 0,
    turnoverCost: 0,
    proposedRentIncrease: 0,
    leaseMonths: 12,
  };

  it('roundtrips non-default values and omits defaults', () => {
    const values: CalcFormValues = {
      ...DEFAULTS_V,
      monthlyRent: 2_000,
      vacantDays: 7,
    };
    const query = serializeCalcState(FIELDS_V, values, DEFAULTS_V);
    const params = new URLSearchParams(query);
    expect(params.get('leaseMonths')).toBeNull();
    expect(params.get('turnoverCost')).toBeNull();
    expect(params.get('proposedRentIncrease')).toBeNull();
    expect(params.get('monthlyRent')).toBe('2000');
    expect(params.get('vacantDays')).toBe('7');
    expect(parseCalcState(FIELDS_V, `?${query}`)).toEqual({
      monthlyRent: 2_000,
      vacantDays: 7,
    });
  });

  it('drops out-of-range vacancy params on parse (wide bands still bound)', () => {
    expect(parseCalcState(FIELDS_V, '?monthlyRent=0')).toEqual({}); // min 1
    expect(parseCalcState(FIELDS_V, '?vacantDays=3651')).toEqual({}); // max 3650
    expect(parseCalcState(FIELDS_V, '?leaseMonths=121')).toEqual({}); // max 120
    expect(parseCalcState(FIELDS_V, '?vacantDays=7')).toEqual({ vacantDays: 7 });
  });
});
