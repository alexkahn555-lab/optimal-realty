import { ASSUMPTIONS } from '@/config/assumptions';
import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import { DataTable } from '@/components/primitives';
import type { Basis, Locale } from '@/lib/types';

/**
 * ASSUMPTIONS TABLE (RSC, zero JS). Every assumption key the engine consulted,
 * rendered VISIBLY with its basis category, note, and verification date. A
 * flagged default must be visible and correctable, never silently applied —
 * every value here is editable in the calculator form above.
 */

export interface AssumptionsTableProps {
  /** EngineResult.assumptionKeysUsed */
  keys: string[];
  locale: Locale;
}

const BASIS_LABEL: Record<Basis, { en: string; es: string }> = {
  statutory: UI.calc.basisStatutory,
  'promulgated-verify': UI.calc.basisPromulgatedVerify,
  'unconfirmed-default': UI.calc.basisUnconfirmedDefault,
  'market-must-update': UI.calc.basisMarketMustUpdate,
  input: UI.calc.basisInput,
};

/**
 * Marker rows (value 0 with a verify-class basis) exist to surface a basis for
 * a schedule that lives in the engine (e.g. the title band table); a literal
 * "0" would read as a zero rate, so the value cell renders an em dash.
 */
function formatValue(value: number, basis: Basis, locale: Locale): string {
  if (value === 0 && basis !== 'unconfirmed-default') return '—';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

export function AssumptionsTable({
  keys,
  locale,
}: AssumptionsTableProps): JSX.Element | null {
  const rows = keys
    .map((key) => ASSUMPTIONS[key])
    .filter((a): a is NonNullable<typeof a> => a !== undefined)
    .map((assumption) => ({
      key: <span className="font-mono text-xs text-ink">{assumption.key}</span>,
      value: formatValue(assumption.value, assumption.basis, locale),
      basis: (
        <span className="font-mono text-xs uppercase tracking-wide text-marine">
          {t(BASIS_LABEL[assumption.basis], locale)}
        </span>
      ),
      asOf: new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${assumption.asOf}T00:00:00Z`)),
      note: assumption.note ? (
        <span className="font-sans text-xs text-ink">{t(assumption.note, locale)}</span>
      ) : null,
    }));

  if (rows.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-ink md:text-3xl">
        {t(UI.calc.assumptionsHeading, locale)}
      </h2>
      <p className="mt-2 max-w-prose font-sans text-sm text-ink">
        {t(UI.calc.assumptionsIntro, locale)}
      </p>
      <div className="mt-6 overflow-x-auto">
        <DataTable
          columns={[
            { key: 'key', label: t(UI.calc.colAssumption, locale) },
            { key: 'value', label: t(UI.calc.colValue, locale), numeric: true },
            { key: 'basis', label: t(UI.calc.colBasis, locale) },
            { key: 'asOf', label: t(UI.calc.colAsOf, locale) },
            { key: 'note', label: t(UI.calc.colNote, locale) },
          ]}
          rows={rows}
        />
      </div>
    </section>
  );
}
