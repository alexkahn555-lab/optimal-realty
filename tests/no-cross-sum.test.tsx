import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ResultPanel } from '@/components/calc/ResultPanel';
import type { EngineResult } from '@/lib/types';

/**
 * THE NO-CROSS-SUM RULE (Part 6.2): monthly and one-time ledgers are SEPARATE
 * arrays and no component may total across them — a one-time cost folded into
 * a recurring figure is a real error a user would act on. The fixture makes
 * the illegal cross-sum a distinctive figure and asserts it appears NOWHERE,
 * while both blocks render under their own headings.
 */

const FIXTURE: EngineResult & { grossCents?: number } = {
  monthlyLines: [
    {
      key: 'm1',
      label: { en: 'Monthly fixture line', es: 'Monthly fixture line' },
      amountCents: 11_111,
      basis: 'input',
    },
  ],
  oneTimeLines: [
    {
      key: 'o1',
      label: { en: 'One-time fixture line', es: 'One-time fixture line' },
      amountCents: 22_222,
      basis: 'input',
    },
  ],
  headline: { key: 'netProceeds', amountCents: 55_555 },
  assumptionKeysUsed: [],
};

describe('no summing across monthlyLines and oneTimeLines', () => {
  const markup = renderToStaticMarkup(
    <ResultPanel
      result={FIXTURE}
      locale="en"
      values={{}}
      sourceSlug="net-proceeds"
      leadIntent="sell"
    />
  );

  it('renders the two ledgers as separate blocks with their own headings', () => {
    expect(markup).toContain('$111.11');
    expect(markup).toContain('$222.22');
    expect(markup).toContain('$555.55');
    // Heading generalized in 5e ('at closing' dropped — serves all engines).
    expect(markup).toContain('One-time costs');
    expect(markup).toContain('Monthly');
  });

  it('the cross-array total appears nowhere', () => {
    // 11_111 + 22_222 = 33_333 → the forbidden figure.
    expect(markup).not.toContain('$333.33');
    // Nor a cross-sum folded into the headline: 55_555 + 11_111 etc.
    expect(markup).not.toContain('$666.66');
  });
});

/**
 * 5e extension of the same rule to DAY-VALUED secondary lines: a day count is
 * not money — it renders in its own block, formatted as days, and never sums
 * with (or formats as) a currency amount.
 */
describe('day-valued secondary lines never read as money', () => {
  const WITH_SECONDARY: EngineResult & {
    secondaryLines?: import('@/lib/types').LedgerLine[];
  } = {
    monthlyLines: [],
    oneTimeLines: [
      {
        key: 'vacancyLoss',
        label: { en: 'Rent lost to vacancy', es: 'Renta perdida por vacancia' },
        amountCents: 46_027,
        basis: 'input',
      },
    ],
    headline: { key: 'vacancyTotal', amountCents: 46_027 },
    assumptionKeysUsed: [],
    secondaryLines: [
      {
        key: 'maxExtraVacantDays',
        label: {
          en: 'Extra vacant days the increase could pay for',
          es: 'Días adicionales de vacancia que cubriría el aumento',
        },
        amountCents: 913, // 9.13 DAYS, not $9.13
        basis: 'input',
      },
    ],
  };

  const markup = renderToStaticMarkup(
    <ResultPanel
      result={WITH_SECONDARY}
      locale="en"
      values={{}}
      sourceSlug="vacancy-cost"
      leadIntent="lease-out"
    />
  );

  it('the headline label follows the headline key, not net proceeds', () => {
    expect(markup).toContain('Estimated cost of the vacancy');
    expect(markup).not.toContain('Estimated net proceeds');
  });

  it('the days figure renders as days, never as a dollar amount', () => {
    expect(markup).toContain('9.13 days');
    expect(markup).not.toContain('$9.13');
  });

  it('the days figure never folds into a money total', () => {
    // 46_027 + 913 = 46_940 → the forbidden cross-unit figure.
    expect(markup).not.toContain('$469.40');
    expect(markup).toContain('$460.27');
  });
});

/**
 * 5f — the FIRST result with BOTH arrays genuinely populated (rental cash
 * flow): the monthly picture (debt service included) and the one-time
 * cash-to-close render as separate blocks, ratio lines render as percentages
 * or plain ratios (never USD), and no figure combines a monthly line with a
 * one-time line anywhere in the panel.
 */
describe('both arrays populated: debt service and cash-to-close never meet (5f)', () => {
  const RENTAL_FIXTURE: EngineResult & {
    secondaryLines?: import('@/lib/types').LedgerLine[];
  } = {
    monthlyLines: [
      {
        key: 'rent',
        label: { en: 'Gross scheduled rent', es: 'Renta bruta programada' },
        amountCents: 300_000,
        basis: 'input',
      },
      {
        key: 'debtService',
        label: { en: 'Debt service', es: 'Servicio de la deuda' },
        amountCents: 151_696,
        basis: 'market-must-update',
        flagged: true,
      },
    ],
    oneTimeLines: [
      {
        key: 'downPayment',
        label: { en: 'Down payment', es: 'Pago inicial' },
        amountCents: 6_000_000,
        basis: 'input',
      },
      {
        key: 'closingCosts',
        label: { en: 'Closing costs', es: 'Costos de cierre' },
        amountCents: 600_000,
        basis: 'input',
      },
    ],
    headline: { key: 'annualCashFlow', amountCents: 231_648 },
    assumptionKeysUsed: [],
    secondaryLines: [
      {
        key: 'capRate',
        label: { en: 'Cap rate', es: 'Tasa de capitalización' },
        amountCents: 684,
        basis: 'unconfirmed-default',
        flagged: true,
      },
      {
        key: 'dscr',
        label: { en: 'Debt service coverage (DSCR)', es: 'DSCR' },
        amountCents: 113,
        basis: 'unconfirmed-default',
        flagged: true,
      },
    ],
  };

  const markup = renderToStaticMarkup(
    <ResultPanel
      result={RENTAL_FIXTURE}
      locale="en"
      values={{}}
      sourceSlug="rental-cashflow"
      leadIntent="invest"
    />
  );

  it('both blocks render under their own headings with their own lines', () => {
    expect(markup).toContain('Monthly');
    expect(markup).toContain('One-time costs');
    expect(markup).toContain('$1,516.96'); // debt service — monthly block
    expect(markup).toContain('$60,000.00'); // down payment — one-time block
    expect(markup).toContain('$6,000.00'); // closing costs — one-time block
  });

  it('no combined total across the arrays appears anywhere', () => {
    // monthly sum 451,696 + one-time sum 6,600,000 = 7,051,696 → forbidden.
    expect(markup).not.toContain('$70,516.96');
    // debt service + down payment = 6,151,696 → forbidden.
    expect(markup).not.toContain('$61,516.96');
    // headline + cash-to-close = 6,831,648 → forbidden.
    expect(markup).not.toContain('$68,316.48');
  });

  it('ratio lines render as percent / plain ratio, never USD', () => {
    expect(markup).toContain('6.84%');
    expect(markup).toContain('1.13');
    expect(markup).not.toContain('$6.84');
    expect(markup).not.toContain('$1.13');
  });

  it('a negative FUNDING GAP keeps its own label and reads plainly (5g)', () => {
    // Condo exposure, reserves exceeding deferred items (golden case 2):
    // the gap is a negative ONE-TIME line and the headline — never clamped,
    // never relabeled as a closing shortfall.
    const condo = renderToStaticMarkup(
      <ResultPanel
        result={{
          monthlyLines: [
            {
              key: 'monthlyDues',
              label: { en: 'Monthly dues', es: 'Cuota mensual' },
              amountCents: 85_000,
              basis: 'input',
            },
          ],
          oneTimeLines: [
            {
              key: 'fundingGap',
              label: {
                en: 'Reserve funding gap (unit share)',
                es: 'Brecha de financiamiento de reservas (parte de la unidad)',
              },
              amountCents: -625_000,
              basis: 'input',
            },
          ],
          headline: { key: 'fundingGap', amountCents: -625_000 },
          assumptionKeysUsed: [],
        }}
        locale="en"
        values={{}}
        sourceSlug="condo-assessment"
        leadIntent="buy"
      />
    );
    expect(condo).toContain('Reserve funding gap (unit share)');
    expect(condo).not.toContain('shortfall at closing');
    expect(condo).toContain('-$6,250.00');
    // dues 850 + |gap| never combine: 85_000 + 625_000 = 710_000 forbidden.
    expect(condo).not.toContain('$7,100.00');
  });

  it('a negative annual cash flow keeps its own label — no shortfall swap', () => {
    const negative = renderToStaticMarkup(
      <ResultPanel
        result={{
          ...RENTAL_FIXTURE,
          headline: { key: 'annualCashFlow', amountCents: -230_352 },
        }}
        locale="en"
        values={{}}
        sourceSlug="rental-cashflow"
        leadIntent="invest"
      />
    );
    expect(negative).toContain('Estimated annual cash flow');
    expect(negative).not.toContain('shortfall at closing');
    expect(negative).toContain('-$2,303.52'); // stated plainly, never clamped
  });
});
