'use client';

import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { LeadForm } from '@/components/forms';
import { TwoBarCompare } from '@/components/charts/TwoBarCompare';
import type { CalcFormValues } from '@/lib/calc/registry';
import type {
  Basis,
  EngineResult,
  LeadIntent,
  LedgerLine,
  Locale,
  Localized,
} from '@/lib/types';

import {
  DAY_VALUED_KEYS,
  PERCENT_BPS_KEYS,
  RATIO_HUNDREDTH_KEYS,
  formatCents,
  formatDayHundredths,
  formatPercentBps,
  formatRatioHundredths,
} from './labels';

/**
 * Result panel (Part 7.4): marine background, ONE large mono headline figure,
 * the monthlyLines ledger, oneTimeLines as a SEPARATE block — this component
 * never sums across the two arrays (type-level rule, tested). Then "email me
 * this breakdown" wired to LeadForm with payload = { inputs, outputs } and
 * attribution { sourceType: 'tool', sourceSlug }.
 */

export interface ResultPanelProps {
  result:
    | (EngineResult & {
        grossCents?: number;
        /** Engine extras that are OUTPUTS but not costs (5e): rendered in
         *  their own block under the headline, never inside a cost ledger. */
        secondaryLines?: LedgerLine[];
        /** Two-scenario comparison bars (5h) — keyed into UI.ledger. The
         *  series are SCENARIOS, never places (Part 1.4). */
        compareBars?: {
          aKey: string;
          bKey: string;
          aCents: number;
          bCents: number;
        };
        /** Year-by-year projection TABLE (5h) — never folded into a ledger
         *  or the headline. */
        projection?: {
          year: number;
          assessedCents: number;
          taxCents: number;
          basis: Basis;
        }[];
      })
    | null;
  locale: Locale;
  /** Current form values (display units) — snapshotted into the lead payload. */
  values: CalcFormValues;
  sourceSlug: string;
  leadIntent: LeadIntent;
}

/** Non-money keys format per their unit (labels.ts); everything else is USD. */
function formatLineAmount(line: LedgerLine, locale: Locale): string {
  if (DAY_VALUED_KEYS.has(line.key)) {
    return formatDayHundredths(line.amountCents, locale);
  }
  if (PERCENT_BPS_KEYS.has(line.key)) {
    return formatPercentBps(line.amountCents, locale);
  }
  if (RATIO_HUNDREDTH_KEYS.has(line.key)) {
    return formatRatioHundredths(line.amountCents, locale);
  }
  return formatCents(line.amountCents, locale);
}

/**
 * Negative-headline label overrides, keyed by headline key (data, not a
 * per-engine branch): net proceeds flips to "shortfall"; a headline absent
 * here (annual cash flow) keeps its own label and simply reads negative.
 */
const NEGATIVE_HEADLINE_LABEL: Record<string, Localized> = {
  netProceeds: UI.ledger.shortfall,
};

function Ledger({
  lines,
  locale,
}: {
  lines: LedgerLine[];
  locale: Locale;
}): JSX.Element {
  return (
    <dl>
      {lines.map((line) => (
        <div
          key={line.key}
          className="flex items-baseline justify-between gap-6 border-b border-bone/20 py-2"
        >
          <dt className="font-sans text-sm text-bone">
            {t(line.label, locale)}
            {line.flagged ? ' †' : ''}
          </dt>
          <dd className="font-mono text-sm tabular-nums text-bone">
            {formatLineAmount(line, locale)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ResultPanel({
  result,
  locale,
  values,
  sourceSlug,
  leadIntent,
}: ResultPanelProps): JSX.Element | null {
  if (result === null) return null;

  const negative = result.headline.amountCents < 0;
  // The headline label follows the headline KEY (5e: a second engine ships a
  // different headline); a key without a ledger label is an authoring bug
  // caught by the fieldspec parity tests, so netProceeds stays the fallback.
  // Negative overrides are keyed data too (5f): only engines that DEFINE a
  // negative reading swap labels; others state the negative amount plainly.
  const ledgerLabels = UI.ledger as Record<string, Localized>;
  const headlineLabel =
    (negative ? NEGATIVE_HEADLINE_LABEL[result.headline.key] : undefined) ??
    ledgerLabels[result.headline.key] ??
    UI.ledger.netProceeds;

  const payload = {
    inputs: values,
    outputs: {
      headline: result.headline,
      grossCents: result.grossCents,
      oneTimeLines: result.oneTimeLines.map(({ key, amountCents, basis }) => ({
        key,
        amountCents,
        basis,
      })),
      monthlyLines: result.monthlyLines.map(({ key, amountCents, basis }) => ({
        key,
        amountCents,
        basis,
      })),
      ...(result.secondaryLines
        ? {
            secondaryLines: result.secondaryLines.map(
              ({ key, amountCents, basis }) => ({ key, amountCents, basis })
            ),
          }
        : {}),
      ...(result.projection && result.projection.length > 0
        ? { projection: result.projection }
        : {}),
    },
  };

  return (
    <section className="bg-marine px-6 py-8 md:px-8">
      <p className="font-mono text-xs uppercase tracking-wider text-teal">
        {t(UI.calc.estimateTag, locale)}
      </p>
      <p className="font-mono text-xs uppercase tracking-wider text-bone">
        {t(headlineLabel, locale)}
      </p>
      <p
        className={[
          'font-mono text-4xl tabular-nums md:text-5xl',
          negative ? 'text-coral' : 'text-bone',
        ].join(' ')}
        data-testid="calc-headline"
      >
        {formatCents(result.headline.amountCents, locale)}
      </p>

      {result.secondaryLines && result.secondaryLines.length > 0 ? (
        // Secondary OUTPUTS (not costs — e.g. a day count): their own block,
        // directly under the headline, outside both cost ledgers.
        <div className="mt-6">
          <Ledger lines={result.secondaryLines} locale={locale} />
        </div>
      ) : null}

      {result.monthlyLines.length > 0 ? (
        <div className="mt-8">
          <h3 className="font-mono text-xs uppercase tracking-wider text-teal">
            {t(UI.calc.monthlyHeading, locale)}
          </h3>
          <Ledger lines={result.monthlyLines} locale={locale} />
        </div>
      ) : null}

      <div className="mt-8">
        <h3 className="font-mono text-xs uppercase tracking-wider text-teal">
          {t(UI.calc.oneTimeHeading, locale)}
        </h3>
        <Ledger lines={result.oneTimeLines} locale={locale} />
      </div>

      {result.compareBars &&
      ledgerLabels[result.compareBars.aKey] &&
      ledgerLabels[result.compareBars.bKey] ? (
        // Scenario comparison (5h): rendered on bone so the ink axis text and
        // the teal/coral scenario bars keep their Part 1.4 contrast contract.
        <div className="mt-8 bg-bone px-4 py-4">
          <TwoBarCompare
            aLabel={ledgerLabels[result.compareBars.aKey]!}
            bLabel={ledgerLabels[result.compareBars.bKey]!}
            aCents={result.compareBars.aCents}
            bCents={result.compareBars.bCents}
            locale={locale}
          />
        </div>
      ) : null}

      {result.projection && result.projection.length > 0 ? (
        <div className="mt-8">
          <h3 className="font-mono text-xs uppercase tracking-wider text-teal">
            {t(UI.calc.projectionHeading, locale)}
          </h3>
          <table className="mt-2 w-full">
            <thead>
              <tr className="border-b border-bone/20">
                <th className="py-1 text-left font-mono text-xs uppercase tracking-wider text-bone">
                  {t(UI.calc.projectionYearCol, locale)}
                </th>
                <th className="py-1 text-right font-mono text-xs uppercase tracking-wider text-bone">
                  {t(UI.calc.projectionAssessedCol, locale)}
                </th>
                <th className="py-1 text-right font-mono text-xs uppercase tracking-wider text-bone">
                  {t(UI.calc.projectionTaxCol, locale)}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.projection.map((row) => (
                <tr key={row.year} className="border-b border-bone/20">
                  <td className="py-1 font-mono text-sm tabular-nums text-bone">
                    {row.year}
                  </td>
                  <td className="py-1 text-right font-mono text-sm tabular-nums text-bone">
                    {formatCents(row.assessedCents, locale)}
                  </td>
                  <td className="py-1 text-right font-mono text-sm tabular-nums text-bone">
                    {formatCents(row.taxCents, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <details className="mt-8">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-bone">
          {t(UI.calc.emailBreakdown, locale)}
        </summary>
        <div className="mt-4 bg-bone px-4 py-6">
          <LeadForm
            intent={leadIntent}
            locale={locale}
            payload={payload}
            sourceSlug={sourceSlug}
            sourceType="tool"
          />
        </div>
      </details>
    </section>
  );
}
