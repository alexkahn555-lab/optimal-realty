import { describe, expect, it } from 'vitest';
import { ASSUMPTIONS } from '@/config/assumptions';
import { NET_PROCEEDS_ENGINE, fromFormValues } from '@/lib/calc/net-proceeds';
import { CALCS } from '@/lib/calc/registry';
import { ENUM_LABEL, uiString } from '@/components/calc/labels';

/**
 * FieldSpec → validation/chrome parity. FieldSpec is DATA driving the form,
 * client validation, and the assumptions surface — so every reference it makes
 * must resolve: chrome keys into ui-strings, enum values into ENUM_LABEL,
 * defaultFromAssumption into config/assumptions.ts (the missing-assumption-key
 * guard: a rename in config breaks HERE, not silently in the island).
 */

const FIELDS = NET_PROCEEDS_ENGINE.fields;

describe('FieldSpec parity', () => {
  it('every labelKey and helperKey resolves to a chrome string', () => {
    for (const field of FIELDS) {
      expect(() => uiString(field.labelKey)).not.toThrow();
      // Captured so the narrowing survives into the expect closure.
      const helperKey = field.helperKey;
      if (helperKey) expect(() => uiString(helperKey)).not.toThrow();
    }
  });

  it('every enum value has a chrome label', () => {
    for (const field of FIELDS) {
      if (field.kind !== 'enum') continue;
      for (const value of field.enumValues ?? []) {
        expect(ENUM_LABEL[value], `enum label for "${value}"`).toBeDefined();
      }
    }
  });

  it('every defaultFromAssumption key exists in config/assumptions.ts', () => {
    for (const field of FIELDS) {
      if (field.defaultFromAssumption === undefined) continue;
      expect(
        ASSUMPTIONS[field.defaultFromAssumption],
        `assumption "${field.defaultFromAssumption}" (field "${field.key}")`
      ).toBeDefined();
    }
  });

  it('every assumptionKeysUsed the engine reports exists in the set', () => {
    for (const county of ['miami-dade', 'other-fl'] as const) {
      const result = NET_PROCEEDS_ENGINE.compute(
        fromFormValues({
          salePrice: 500_000,
          county,
          propertyClass: 'single-family',
          commissionRatePct: 5,
          closingDate: '2026-06-30',
        }),
        ASSUMPTIONS
      );
      for (const key of result.assumptionKeysUsed) {
        expect(ASSUMPTIONS[key], `assumption "${key}"`).toBeDefined();
      }
    }
  });

  it('the registry serves net-proceeds and its clamp respects the spec bounds', () => {
    const calc = CALCS['net-proceeds'];
    expect(calc).toBeDefined();
    expect(calc!.engine.fields).toBe(FIELDS);
    // Cross-field reference bounds: payoff <= 1.5x price, second lien <= price,
    // concessions <= 0.10x price.
    const clamped = calc!.clampCrossField!({
      salePrice: 100_000,
      mortgagePayoff: 1_000_000,
      secondLienPayoff: 500_000,
      sellerConcessions: 50_000,
    });
    expect(clamped.mortgagePayoff).toBe(150_000);
    expect(clamped.secondLienPayoff).toBe(100_000);
    expect(clamped.sellerConcessions).toBe(10_000);
  });
});
