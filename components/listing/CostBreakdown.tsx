import { ASSUMPTIONS } from '@/config/assumptions';
import { UI } from '@/content/ui-strings';
import { compute, NET_PROCEEDS_ENGINE } from '@/lib/calc/net-proceeds';
import type { NetProceedsInput } from '@/lib/calc/net-proceeds';
import type { CalcFormValues } from '@/lib/calc/registry';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import type { IsoDate, LedgerLine, Listing, Locale } from '@/lib/types';
import { formatCents } from '@/components/calc/labels';
import { serializeCalcState } from '@/components/calc/query';
import { Heading } from '@/components/primitives';

import { LISTING_UI } from './strings';

/**
 * M6 — cost breakdown. Zero JS: everything is computed server-side at BUILD
 * from the net-proceeds engine (lib/calc, integer cents).
 *
 * Two blocks, NEVER summed with each other (the two-array contract of
 * Part 6.2 holds here too):
 *   - monthly ledger — carrying costs read from the listing data file
 *     (HOA dues, property taxes ÷ 12), basis 'input';
 *   - one-time costs at closing — the engine's oneTimeLines at the list price
 *     with assumption defaults; unverified bases are flagged †.
 *
 * "Adjust assumptions" deep-links to the net-proceeds calculator with the
 * listing's figures prefilled through the SAME querystring codec the island
 * parses (components/calc/query.ts) — only non-default values serialize.
 */

/** Fixed probe date — compute() is pure; dates enter as inputs (never a clock). */
const PROBE_DATE: IsoDate = '2026-01-15';

const CENTS = 100;

export interface ListingCosts {
  monthlyLines: LedgerLine[];
  oneTimeLines: LedgerLine[];
  /** Prefilled querystring for the net-proceeds deep link (no leading '?'). */
  query: string;
}

/** Engine-boundary defaults, mirroring the island's server-resolved defaults. */
function fieldDefaults(): CalcFormValues {
  const defaults: CalcFormValues = {};
  for (const field of NET_PROCEEDS_ENGINE.fields) {
    if (field.defaultFromAssumption !== undefined) {
      const assumption = ASSUMPTIONS[field.defaultFromAssumption];
      if (assumption !== undefined) {
        defaults[field.key] =
          field.kind === 'boolean' ? assumption.value === 1 : assumption.value;
      }
    } else if (field.default !== undefined) {
      defaults[field.key] = field.default;
    }
  }
  return defaults;
}

/** Pure builder — exported for the module tests (incl. the no-cross-sum rule). */
export function buildListingCosts(listing: Listing): ListingCosts {
  const facts = listing.facts;
  const commission = ASSUMPTIONS['commissionRatePct'];
  const titlePaid = ASSUMPTIONS['titlePaidBySeller'];
  if (!commission || !titlePaid) {
    throw new Error('cost-breakdown: missing commission/title assumptions');
  }

  const monthlyLines: LedgerLine[] = [];
  if (facts.hoaMonthly !== undefined && facts.hoaMonthly > 0) {
    monthlyLines.push({
      key: 'hoaDues',
      label: LISTING_UI.costs.hoaDues,
      amountCents: facts.hoaMonthly * CENTS,
      basis: 'input',
    });
  }
  if (facts.taxesAnnual !== undefined && facts.taxesAnnual > 0) {
    monthlyLines.push({
      key: 'taxMonthly',
      label: LISTING_UI.costs.monthlyTax,
      amountCents: Math.round((facts.taxesAnnual * CENTS) / 12),
      basis: 'input',
    });
  }

  const propertyClass = listing.class === 'single-family' ? 'single-family' : 'other';
  const input: NetProceedsInput = {
    salePriceCents: listing.price * CENTS,
    county: 'miami-dade',
    propertyClass,
    mortgagePayoffCents: 0,
    secondLienPayoffCents: 0,
    commissionRatePct: commission.value,
    sellerConcessionsCents: 0,
    annualPropertyTaxCents: (facts.taxesAnnual ?? 0) * CENTS,
    closingDate: PROBE_DATE,
    hoaMonthlyCents: (facts.hoaMonthly ?? 0) * CENTS,
    titlePaidBySeller: titlePaid.value === 1,
  };
  const result = compute(input, ASSUMPTIONS);

  const values: CalcFormValues = {
    salePrice: listing.price,
    county: 'miami-dade',
    propertyClass,
    annualPropertyTax: facts.taxesAnnual ?? 0,
    hoaMonthly: facts.hoaMonthly ?? 0,
  };
  const query = serializeCalcState(NET_PROCEEDS_ENGINE.fields, values, fieldDefaults());

  return { monthlyLines, oneTimeLines: result.oneTimeLines, query };
}

function Ledger({ lines, locale }: { lines: LedgerLine[]; locale: Locale }): JSX.Element {
  return (
    <dl>
      {lines.map((line) => (
        <div
          key={line.key}
          className="flex items-baseline justify-between gap-6 border-b border-hair py-2"
        >
          <dt className="font-sans text-sm text-ink">
            {t(line.label, locale)}
            {line.flagged ? ' †' : ''}
          </dt>
          <dd className="font-mono text-sm tabular-nums text-ink">
            {formatCents(line.amountCents, locale)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function CostBreakdown({
  listing,
  locale,
}: {
  listing: Listing;
  locale: Locale;
}): JSX.Element | null {
  if (listing.offerType !== 'sale') return null;
  const costs = buildListingCosts(listing);
  if (costs.monthlyLines.length === 0 && costs.oneTimeLines.length === 0) return null;

  const calcHref = `${href('tool.net-proceeds', locale)}${costs.query ? `?${costs.query}` : ''}`;

  return (
    <section>
      <Heading level={2}>{t(LISTING_UI.costs.heading, locale)}</Heading>
      <p className="mt-1 font-mono text-xs uppercase tracking-wider text-marine">
        {t(UI.calc.estimateTag, locale)}
      </p>

      {costs.monthlyLines.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-mono text-xs uppercase tracking-wider text-marine">
            {t(UI.calc.monthlyHeading, locale)}
          </h3>
          <Ledger lines={costs.monthlyLines} locale={locale} />
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="font-mono text-xs uppercase tracking-wider text-marine">
          {t(UI.calc.oneTimeHeading, locale)}
        </h3>
        <Ledger lines={costs.oneTimeLines} locale={locale} />
      </div>

      <p className="mt-4 max-w-prose font-sans text-xs text-marine">
        {t(LISTING_UI.costs.methodNote, locale)}
      </p>
      <a
        className="mt-3 inline-block font-mono text-sm uppercase tracking-wider text-ink underline"
        href={calcHref}
      >
        {t(LISTING_UI.costs.adjust, locale)}
      </a>
    </section>
  );
}
