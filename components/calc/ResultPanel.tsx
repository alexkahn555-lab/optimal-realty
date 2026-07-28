'use client';

import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { LeadForm } from '@/components/forms';
import type { CalcFormValues } from '@/lib/calc/registry';
import type {
  EngineResult,
  LeadIntent,
  LedgerLine,
  Locale,
  Localized,
} from '@/lib/types';

import { DAY_VALUED_KEYS, formatCents, formatDayHundredths } from './labels';

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
      })
    | null;
  locale: Locale;
  /** Current form values (display units) — snapshotted into the lead payload. */
  values: CalcFormValues;
  sourceSlug: string;
  leadIntent: LeadIntent;
}

/** Day-valued lines format as days (labels.ts); everything else is USD. */
function formatLineAmount(line: LedgerLine, locale: Locale): string {
  return DAY_VALUED_KEYS.has(line.key)
    ? formatDayHundredths(line.amountCents, locale)
    : formatCents(line.amountCents, locale);
}

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
  const ledgerLabels = UI.ledger as Record<string, Localized>;
  const headlineLabel = negative
    ? UI.ledger.shortfall
    : (ledgerLabels[result.headline.key] ?? UI.ledger.netProceeds);

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
