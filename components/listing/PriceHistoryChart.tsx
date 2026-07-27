import { t } from '@/lib/i18n';
import type { Listing, Locale } from '@/lib/types';
import { StepLineSvg, type StepPoint } from '@/components/charts/StepLineSvg';
import { Heading } from '@/components/primitives';

import { formatPriceUsd } from './helpers';
import { LISTING_UI } from './strings';

/**
 * M5 — price history. Zero JS: a server-rendered SVG step line (no charting
 * library — banned, Part 8.2). Temporal single-series in the single chart
 * color; the event KIND is carried by the axis label, never by color
 * (Part 1.4). Renders null with fewer than two events — a single price is a
 * fact, not a history.
 */

/** ISO date → UTC epoch days (pure; no clock). */
function epochDays(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

export function PriceHistoryChart({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  const history = listing.priceHistory ?? [];
  if (history.length < 2) return null;

  const dateFormat = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const points: StepPoint[] = [...history]
    .sort((a, b) => epochDays(a.date) - epochDays(b.date))
    .map((event) => ({
      x: epochDays(event.date),
      y: event.price,
      valueLabel: formatPriceUsd(event.price, locale),
      xLabel: `${t(LISTING_UI.priceHistory[event.kind], locale)} · ${dateFormat.format(
        new Date(`${event.date}T00:00:00Z`)
      )}`,
    }));

  return (
    <section>
      <Heading level={2}>{t(LISTING_UI.priceHistory.heading, locale)}</Heading>
      <div className="mt-4">
        <StepLineSvg
          points={points}
          ariaLabel={t(LISTING_UI.priceHistory.heading, locale)}
        />
      </div>
    </section>
  );
}
