/**
 * STEP LINE (RSC, zero JS) — the only chart primitive Phase 4b needs.
 * Charting libraries are banned outright (Part 8.2); every chart is inline
 * SVG computed at build. TEMPORAL SINGLE-SERIES ONLY, single color (teal is
 * the chart-fill color; it never encodes place, price tier, or desirability —
 * Part 1.4). Callers pre-format all labels; this component only scales.
 */

export interface StepPoint {
  /** Position on the time axis (any monotonic unit, e.g. epoch days). */
  x: number;
  /** Series value (e.g. integer USD). */
  y: number;
  /** Pre-formatted value label rendered above the point. */
  valueLabel: string;
  /** Pre-formatted time label rendered below the axis. */
  xLabel: string;
}

const W = 640;
const H = 220;
const PAD_X = 24;
const PAD_TOP = 36;
const PAD_BOTTOM = 40;

export function StepLineSvg({
  points,
  ariaLabel,
}: {
  points: StepPoint[];
  ariaLabel: string;
}): JSX.Element | null {
  if (points.length < 2) return null;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const ySpan = yMax - yMin;
  // Flat series still draws mid-band; 10% headroom keeps labels inside.
  const yLo = ySpan === 0 ? yMin - 1 : yMin - ySpan * 0.1;
  const yHi = ySpan === 0 ? yMax + 1 : yMax + ySpan * 0.1;

  const sx = (x: number): number =>
    PAD_X + ((x - xMin) / (xMax - xMin || 1)) * (W - PAD_X * 2);
  const sy = (y: number): number =>
    H - PAD_BOTTOM - ((y - yLo) / (yHi - yLo)) * (H - PAD_TOP - PAD_BOTTOM);

  const [first, ...rest] = points;
  const path = [
    `M ${sx(first!.x).toFixed(1)} ${sy(first!.y).toFixed(1)}`,
    ...rest.map(
      (p) => `H ${sx(p.x).toFixed(1)} V ${sy(p.y).toFixed(1)}`
    ),
  ].join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      className="h-auto w-full"
    >
      <line
        x1={PAD_X}
        y1={H - PAD_BOTTOM}
        x2={W - PAD_X}
        y2={H - PAD_BOTTOM}
        className="stroke-hair"
        strokeWidth={1}
      />
      <path d={path} className="stroke-teal" strokeWidth={2} fill="none" />
      {points.map((p) => (
        <g key={`${p.x}-${p.y}`}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r={3.5} className="fill-teal" />
          <text
            x={sx(p.x)}
            y={sy(p.y) - 10}
            textAnchor={p.x === xMax ? 'end' : p.x === xMin ? 'start' : 'middle'}
            className="fill-ink font-mono text-[12px]"
          >
            {p.valueLabel}
          </text>
          <text
            x={sx(p.x)}
            y={H - PAD_BOTTOM + 18}
            textAnchor={p.x === xMax ? 'end' : p.x === xMin ? 'start' : 'middle'}
            className="fill-marine font-mono text-[11px] uppercase tracking-wider"
          >
            {p.xLabel}
          </text>
        </g>
      ))}
    </svg>
  );
}
