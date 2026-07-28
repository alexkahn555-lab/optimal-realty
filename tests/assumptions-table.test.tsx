import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ASSUMPTIONS } from '@/config/assumptions';
import { NET_PROCEEDS_ENGINE, fromFormValues } from '@/lib/calc/net-proceeds';
import { AssumptionsTable } from '@/components/calc/AssumptionsTable';

/**
 * The AssumptionsTable must VISIBLY render every assumption key the engine
 * consulted — with its basis label and verification date. A flagged default
 * that the user cannot see is the exact failure mode Part 6.2 forbids.
 */

function keysFor(county: 'miami-dade' | 'other-fl'): string[] {
  return NET_PROCEEDS_ENGINE.compute(
    fromFormValues({
      salePrice: 500_000,
      county,
      propertyClass: 'single-family',
      commissionRatePct: 5,
      closingDate: '2026-06-30',
    }),
    ASSUMPTIONS
  ).assumptionKeysUsed;
}

describe('AssumptionsTable', () => {
  for (const county of ['miami-dade', 'other-fl'] as const) {
    it(`renders every used key with its as-of date (${county})`, () => {
      const keys = keysFor(county);
      const markup = renderToStaticMarkup(
        <AssumptionsTable keys={keys} locale="en" />
      );
      for (const key of keys) {
        expect(markup).toContain(ASSUMPTIONS[key]!.key);
      }
      // Every entry carries a verification date; the seeded set is 2026-07-19.
      expect(markup).toContain('Jul 19, 2026');
      // Basis labels surface (unconfirmed defaults must be marked).
      expect(markup).toContain('Unconfirmed default');
    });
  }

  it('renders null for an empty key set', () => {
    expect(renderToStaticMarkup(<AssumptionsTable keys={[]} locale="en" />)).toBe(
      ''
    );
  });

  it('renders the 5f rental keys: three unconfirmed defaults + the market rate, dates visible', () => {
    const keys = [
      'vacancyRatePct',
      'maintenancePct',
      'managementPct',
      'mortgageRatePct',
    ];
    const markup = renderToStaticMarkup(
      <AssumptionsTable keys={keys} locale="en" />
    );
    for (const key of keys) {
      expect(markup).toContain(ASSUMPTIONS[key]!.key);
    }
    // The three 5f percentage defaults carry their own asOf…
    expect(markup).toContain('Jul 28, 2026');
    // …and the market-must-update mortgage rate renders ITS date visibly.
    expect(markup).toContain('Jul 19, 2026');
    expect(markup).toContain('Unconfirmed default');
    expect(markup).toContain('Market — must update');
  });
});
