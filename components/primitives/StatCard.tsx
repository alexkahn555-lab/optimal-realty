import type { ReactNode } from 'react';

import type { Locale, Localized, SourcedStat } from '@/lib/types';

export interface StatCardProps {
  label: ReactNode;
  stat: SourcedStat;
  locale: Locale;
  unitLabel?: Localized;
  className?: string;
}

function formatStatValue(
  stat: SourcedStat,
  locale: Locale,
  unitLabel?: Localized,
): string {
  const currency = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  switch (stat.unit) {
    case 'usd':
      return currency.format(stat.value);
    case 'usd_sqft':
      return `${currency.format(stat.value)}/ft²`;
    case 'pct':
      return `${new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
      }).format(stat.value)}%`;
    case 'minutes':
      return new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'minute',
        unitDisplay: 'long',
      }).format(stat.value);
    case 'days':
    case 'count':
    case 'sqft': {
      const value = new Intl.NumberFormat(locale).format(stat.value);
      return unitLabel ? `${value} ${unitLabel[locale]}` : value;
    }
  }
}

export function StatCard({
  label,
  stat,
  locale,
  unitLabel,
  className,
}: StatCardProps): JSX.Element {
  // Parse as UTC and format in UTC so an ISO date never drifts a day in a
  // negative-offset timezone (Miami is UTC−4/5).
  const formattedAsOf = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${stat.asOf}T00:00:00Z`));

  return (
    <div
      className={['border-t border-hair pt-3', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="font-mono text-xs uppercase tracking-wider text-marine">
        {label}
      </div>
      <div className="font-mono text-3xl tabular-nums text-ink md:text-4xl">
        {formatStatValue(stat, locale, unitLabel)}
      </div>
      <div className="font-mono text-xs text-marine">
        {`${stat.source} · ${formattedAsOf}`}
      </div>
    </div>
  );
}
