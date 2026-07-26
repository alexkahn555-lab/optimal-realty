import { t } from '@/lib/i18n';
import type { Listing, Locale, Localized } from '@/lib/types';
import { Heading } from '@/components/primitives';

import { formatNumber, formatPriceUsd } from './helpers';
import { LISTING_UI } from './strings';

/**
 * M8 — facts table. Zero JS. A four-column mono grid built from the keys
 * actually present on `facts` — absent keys simply don't render (degrade by
 * omission), booleans render only when true. Single-color, value-neutral
 * (Part 1.4): no fact is tinted, ranked, or scored here.
 */

interface FactCell {
  key: string;
  label: Localized;
  value: string;
}

/** Present-facts → ordered cells. Pure; exported for the module tests. */
export function factCells(listing: Listing, locale: Locale): FactCell[] {
  const f = listing.facts;
  const cells: FactCell[] = [
    { key: 'beds', label: LISTING_UI.facts.beds, value: formatNumber(f.beds, locale) },
    {
      key: 'bathsFull',
      label: LISTING_UI.facts.bathsFull,
      value: formatNumber(f.bathsFull, locale),
    },
  ];
  if (f.bathsHalf > 0) {
    cells.push({
      key: 'bathsHalf',
      label: LISTING_UI.facts.bathsHalf,
      value: formatNumber(f.bathsHalf, locale),
    });
  }
  cells.push({
    key: 'sqft',
    label: LISTING_UI.facts.sqft,
    value: `${formatNumber(f.sqft, locale)} ${t(LISTING_UI.rail.sqft, locale)}`,
  });
  if (f.lotSqft !== undefined) {
    cells.push({
      key: 'lotSqft',
      label: LISTING_UI.facts.lotSqft,
      value: `${formatNumber(f.lotSqft, locale)} ${t(LISTING_UI.rail.sqft, locale)}`,
    });
  }
  cells.push({
    key: 'yearBuilt',
    label: LISTING_UI.facts.yearBuilt,
    value: String(f.yearBuilt),
  });
  if (f.parkingSpaces !== undefined) {
    cells.push({
      key: 'parkingSpaces',
      label: LISTING_UI.facts.parkingSpaces,
      value: formatNumber(f.parkingSpaces, locale),
    });
  }
  if (f.hoaMonthly !== undefined) {
    cells.push({
      key: 'hoaMonthly',
      label: LISTING_UI.facts.hoaMonthly,
      value: formatPriceUsd(f.hoaMonthly, locale),
    });
  }
  if (f.taxesAnnual !== undefined) {
    cells.push({
      key: 'taxesAnnual',
      label: LISTING_UI.facts.taxesAnnual,
      value: formatPriceUsd(f.taxesAnnual, locale),
    });
  }
  if (f.waterfront === true) {
    cells.push({
      key: 'waterfront',
      label: LISTING_UI.facts.waterfront,
      value: t(LISTING_UI.facts.yes, locale),
    });
  }
  if (f.pool === true) {
    cells.push({
      key: 'pool',
      label: LISTING_UI.facts.pool,
      value: t(LISTING_UI.facts.yes, locale),
    });
  }
  return cells;
}

export function FactsTable({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  const cells = factCells(listing, locale);
  if (cells.length === 0) return null;

  return (
    <section>
      <Heading level={2}>{t(LISTING_UI.facts.heading, locale)}</Heading>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
        {cells.map((cell) => (
          <div key={cell.key} className="border-t border-hair pt-2">
            <dt className="font-mono text-xs uppercase tracking-wider text-marine">
              {t(cell.label, locale)}
            </dt>
            <dd className="mt-1 font-mono tabular-nums text-ink">{cell.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
