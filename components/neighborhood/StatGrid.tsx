import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import type { Locale, NeighborhoodStatKey, SourcedStat } from '@/lib/types';

/**
 * STAT GRID (Part 7.1, dispatch 7a) — RSC, zero JS, tokens only. Renders ONLY
 * the keys present in `stats`; no stats means the caller renders nothing (not
 * an empty grid). Every figure carries its VISIBLE source and as-of line
 * beneath it in mono at small size — Part 1.3 treats sources as typographic
 * furniture, not a disclaimer. SourcedStat makes an unsourced figure
 * unrepresentable (Part 2.1), and the closed NeighborhoodStatKey union makes
 * the Part 1.4 exclusions unrepresentable. NO comparison across
 * neighborhoods exists anywhere in this component; color encodes nothing.
 */

export interface StatGridProps {
  stats: Partial<Record<NeighborhoodStatKey, SourcedStat>>;
  locale: Locale;
}

/** Key order is the union's declaration order — structural, not a ranking. */
const KEY_ORDER: NeighborhoodStatKey[] = [
  'medianSalePrice',
  'medianPricePerSqFt',
  'medianDom',
  'salesLastYear',
  'activeListingCount',
  'medianRentMonthly',
];

function formatValue(stat: SourcedStat, locale: Locale): string {
  const number = (digits = 0) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(
      stat.value
    );
  const currency = () =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(stat.value);

  switch (stat.unit) {
    case 'usd':
      return currency();
    case 'usd_sqft':
      return `${currency()} ${t(UI.statFurniture.perSqFt, locale)}`;
    case 'pct':
      return `${number(2)} %`;
    case 'days':
      return `${number()} ${t(UI.statFurniture.daysUnit, locale)}`;
    case 'minutes':
      return `${number()} min`;
    case 'sqft':
      return `${number()} ft²`;
    case 'count':
      return number();
  }
}

export function StatGrid({ stats, locale }: StatGridProps): JSX.Element | null {
  const entries = KEY_ORDER.filter(
    (key): key is NeighborhoodStatKey => stats[key] !== undefined
  ).map((key) => ({ key, stat: stats[key]! }));
  if (entries.length === 0) return null;

  const asOf = (stat: SourcedStat) =>
    new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${stat.asOf}T00:00:00Z`));

  return (
    <dl className="grid gap-x-10 gap-y-6 md:grid-cols-2">
      {entries.map(({ key, stat }) => (
        <div key={key} className="border-b border-hair pb-4">
          <dt className="font-mono text-xs uppercase tracking-wide text-marine">
            {t(UI.neighborhoodStats[key], locale)}
          </dt>
          <dd>
            <p className="mt-1 font-mono text-2xl tabular-nums text-ink">
              {formatValue(stat, locale)}
            </p>
            {/* The Part 1.3 source line: visible, mono, small — furniture. */}
            <p className="mt-1 font-mono text-xs tracking-wide text-marine">
              {`${t(UI.statFurniture.sourceLabel, locale)}: ${stat.source} · ${t(
                UI.statFurniture.asOfLabel,
                locale
              )} ${asOf(stat)}`}
            </p>
          </dd>
        </div>
      ))}
    </dl>
  );
}
