'use client';

import { t } from '@/lib/i18n';
import { formatCents } from '@/components/calc/labels';
import type { Locale, Localized } from '@/lib/types';

/**
 * TWO-BAR COMPARISON (Part 6.3, dispatch 5h) — inline SVG computed in the
 * island; no charting library (D5 bans libraries, not client-computed SVG).
 *
 * FAIR-HOUSING BASIS (Part 1.4): the two series are SCENARIOS for the same
 * parcel — current owner vs new owner — never places. This component takes
 * two labeled amounts and draws two bars; it has no notion of geography, and
 * teal/coral encode the scenario distinction on exactly that basis. Axis and
 * label text render in ink (tokens only — no raw hex anywhere).
 */

export interface TwoBarCompareProps {
  aLabel: Localized;
  bLabel: Localized;
  aCents: number;
  bCents: number;
  locale: Locale;
}

const WIDTH = 640;
const BAR_HEIGHT = 36;
const ROW_GAP = 18;
const LABEL_HEIGHT = 16;
const PAD_RIGHT = 4;

export function TwoBarCompare({
  aLabel,
  bLabel,
  aCents,
  bCents,
  locale,
}: TwoBarCompareProps): JSX.Element | null {
  // Bars scale against the larger amount; negatives never occur here (annual
  // tax bills), but guard so a zero pair renders nothing rather than NaN.
  const max = Math.max(aCents, bCents);
  if (max <= 0) return null;

  const rows = [
    { label: aLabel, cents: aCents, fill: 'fill-teal' },
    { label: bLabel, cents: bCents, fill: 'fill-coral' },
  ];
  const rowHeight = LABEL_HEIGHT + BAR_HEIGHT + ROW_GAP;
  const height = rows.length * rowHeight - ROW_GAP;
  const title = rows
    .map((row) => `${t(row.label, locale)}: ${formatCents(row.cents, locale)}`)
    .join(' · ');

  return (
    <svg
      className="block h-auto w-full max-w-xl"
      role="img"
      aria-label={title}
      viewBox={`0 0 ${WIDTH} ${height}`}
      data-testid="two-bar-compare"
    >
      <title>{title}</title>
      {rows.map((row, index) => {
        const y = index * rowHeight;
        const barWidth = Math.max(2, Math.round((row.cents / max) * (WIDTH - PAD_RIGHT)));
        return (
          <g key={index}>
            <text
              className="fill-ink font-mono text-[12px] uppercase tracking-wider"
              x={0}
              y={y + 12}
            >
              {t(row.label, locale)}
            </text>
            <rect
              className={row.fill}
              height={BAR_HEIGHT}
              width={barWidth}
              x={0}
              y={y + LABEL_HEIGHT}
            />
            <text
              className="fill-ink font-mono text-[14px] tabular-nums"
              x={barWidth > WIDTH / 2 ? barWidth - 8 : barWidth + 8}
              textAnchor={barWidth > WIDTH / 2 ? 'end' : 'start'}
              y={y + LABEL_HEIGHT + BAR_HEIGHT / 2 + 5}
            >
              {formatCents(row.cents, locale)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
