import type { AssumptionSet } from '@/config/assumptions';
import type { EngineResult, LedgerLine } from '@/lib/types';
import type { CalcEngine, FieldSpec } from '@/lib/calc/types';
import { UI } from '@/content/ui-strings';

/**
 * ============================================================================
 * ENGINE 3 — RENTAL CASH FLOW. Build reference v2.0, Part 6.4. Dispatch 5f.
 * ============================================================================
 *
 *   GSI  = 12 × monthlyRent
 *   EGI  = GSI × (1 − vacancyRate)
 *   opex = annualTaxes + annualInsurance + 12 × hoaMonthly
 *          + GSI × (maintenancePct + managementPct)
 *   NOI  = EGI − opex
 *   debtService = standard amortization of the loan
 *   capRate = NOI / purchasePrice · cashOnCash = annualCashFlow / cashInvested
 *   dscr = NOI / annualDebtService
 *
 * Pure and deterministic: no Date.now(), no I/O, no locale reads. Integer
 * cents everywhere, each line rounded ONCE from its exact rational.
 *
 * THE TWO ARRAYS NEVER MIX (D4 / Part 6.2 — first engine with BOTH
 * populated): monthlyLines is the recurring picture (rent, vacancy allowance,
 * operating expense components, debt service); oneTimeLines is cash to close
 * (down payment, closing costs). The headline (annual cash flow) derives from
 * recurring figures alone; the one-time total feeds ONLY cash-on-cash.
 *
 * Ratios are NOT money (the 5e precedent for non-currency outputs): capRate
 * and cashOnCash ride in `secondaryLines` as integer BASIS POINTS, dscr as
 * integer HUNDREDTHS — the display layer (components/calc/labels) formats
 * them as percentages / a plain ratio, never USD. When debt service is zero,
 * dscr is UNDEFINED: its line is simply absent and `dscrHundredths` is null —
 * never Infinity. Same for cashOnCash when no cash is invested.
 *
 * Flagged defaults (Part 6.4): vacancyRatePct, maintenancePct, managementPct
 * (unconfirmed-default) and mortgageRatePct (market-must-update) — surfaced
 * via assumptionKeysUsed. NO insurance default exists (Part 6.1): Florida
 * insurance variance is extreme, so annual insurance is a REQUIRED input.
 */

export interface RentalCashflowInput {
  purchasePriceCents: number;
  monthlyRentCents: number;
  downPaymentPct: number;
  interestRatePct: number;
  loanTermYears: number;
  annualTaxesCents: number;
  annualInsuranceCents: number;
  hoaMonthlyCents: number;
  vacancyRatePct: number;
  maintenancePct: number;
  managementPct: number;
  closingCostsCents: number;
}

export interface RentalCashflowResult extends EngineResult {
  /** Ratio + NOI outputs (5e pattern): capRate/cashOnCash in basis points,
   *  dscr in hundredths, noi in cents. Undefined ratios are ABSENT. */
  secondaryLines: LedgerLine[];
  noiCents: number;
  capRateBps: number | null;
  cashOnCashBps: number | null;
  dscrHundredths: number | null;
}

/** Standard amortization payment in integer cents; straight-line at 0%. */
export function monthlyPaymentCents(
  loanCents: number,
  ratePct: number,
  termYears: number
): number {
  const n = termYears * 12;
  if (loanCents <= 0 || n <= 0) return 0;
  const i = ratePct / 100 / 12;
  if (i === 0) return Math.round(loanCents / n);
  return Math.round((loanCents * i) / (1 - (1 + i) ** -n));
}

function line(
  key: string,
  label: LedgerLine['label'],
  amountCents: number,
  basis: LedgerLine['basis']
): LedgerLine {
  const flagged = basis !== 'statutory' && basis !== 'input';
  return { key, label, amountCents, basis, ...(flagged ? { flagged: true } : {}) };
}

export function compute(
  input: RentalCashflowInput,
  _cfg: AssumptionSet
): RentalCashflowResult {
  const gsiCents = 12 * input.monthlyRentCents;
  const vacancyAnnual = Math.round((gsiCents * input.vacancyRatePct) / 100);
  const egiCents = gsiCents - vacancyAnnual;

  const maintenanceAnnual = Math.round((gsiCents * input.maintenancePct) / 100);
  const managementAnnual = Math.round((gsiCents * input.managementPct) / 100);
  const opexCents =
    input.annualTaxesCents +
    input.annualInsuranceCents +
    12 * input.hoaMonthlyCents +
    maintenanceAnnual +
    managementAnnual;
  const noiCents = egiCents - opexCents;

  const downPaymentCents = Math.round(
    (input.purchasePriceCents * input.downPaymentPct) / 100
  );
  const loanCents = input.purchasePriceCents - downPaymentCents;
  const debtServiceMonthly = monthlyPaymentCents(
    loanCents,
    input.interestRatePct,
    input.loanTermYears
  );
  const annualDebtService = 12 * debtServiceMonthly;
  const annualCashFlow = noiCents - annualDebtService;

  const totalCashInvested = downPaymentCents + input.closingCostsCents;
  const capRateBps =
    input.purchasePriceCents > 0
      ? Math.round((noiCents / input.purchasePriceCents) * 10_000)
      : null;
  const cashOnCashBps =
    totalCashInvested > 0
      ? Math.round((annualCashFlow / totalCashInvested) * 10_000)
      : null;
  const dscrHundredths =
    annualDebtService > 0 ? Math.round((noiCents / annualDebtService) * 100) : null;

  const monthlyLines: LedgerLine[] = [
    line('rent', UI.ledger.rent, input.monthlyRentCents, 'input'),
    line(
      'vacancyAllowance',
      UI.ledger.vacancyAllowance,
      Math.round(vacancyAnnual / 12),
      'unconfirmed-default'
    ),
    line(
      'propertyTaxes',
      UI.ledger.propertyTaxes,
      Math.round(input.annualTaxesCents / 12),
      'input'
    ),
    line(
      'insurance',
      UI.ledger.insurance,
      Math.round(input.annualInsuranceCents / 12),
      'input'
    ),
    ...(input.hoaMonthlyCents > 0
      ? [line('hoa', UI.ledger.hoa, input.hoaMonthlyCents, 'input')]
      : []),
    line(
      'maintenance',
      UI.ledger.maintenance,
      Math.round(maintenanceAnnual / 12),
      'unconfirmed-default'
    ),
    line(
      'management',
      UI.ledger.management,
      Math.round(managementAnnual / 12),
      'unconfirmed-default'
    ),
    ...(debtServiceMonthly > 0
      ? [
          line(
            'debtService',
            UI.ledger.debtService,
            debtServiceMonthly,
            'market-must-update'
          ),
        ]
      : []),
  ];

  const oneTimeLines: LedgerLine[] = [
    line('downPayment', UI.ledger.downPayment, downPaymentCents, 'input'),
    line('closingCosts', UI.ledger.closingCosts, input.closingCostsCents, 'input'),
  ];

  // Derived figures rest on the flagged percentage defaults, so they carry
  // (and display) the unconfirmed basis even after the user edits — the
  // conservative reading, surfaced in the dispatch report.
  const secondaryLines: LedgerLine[] = [
    line('noi', UI.ledger.noi, noiCents, 'unconfirmed-default'),
    ...(capRateBps === null
      ? []
      : [line('capRate', UI.ledger.capRate, capRateBps, 'unconfirmed-default')]),
    ...(cashOnCashBps === null
      ? []
      : [
          line(
            'cashOnCash',
            UI.ledger.cashOnCash,
            cashOnCashBps,
            'unconfirmed-default'
          ),
        ]),
    ...(dscrHundredths === null
      ? []
      : [line('dscr', UI.ledger.dscr, dscrHundredths, 'unconfirmed-default')]),
  ];

  return {
    monthlyLines,
    oneTimeLines,
    headline: { key: 'annualCashFlow', amountCents: annualCashFlow },
    assumptionKeysUsed: [
      'vacancyRatePct',
      'maintenancePct',
      'managementPct',
      'mortgageRatePct',
    ],
    secondaryLines,
    noiCents,
    capRateBps,
    cashOnCashBps,
    dscrHundredths,
  };
}

/* ---- FieldSpec surface (drives the form, validation, and tests — D9) ------- */

/**
 * Wide bands per Part 6.2 — never narrowed around an assumed typical
 * Miami-Dade investment property. Annual insurance is REQUIRED with no
 * prefill (Part 6.1). The three percentage defaults and the mortgage rate
 * route through config/assumptions.ts.
 */
const FIELDS: FieldSpec[] = [
  {
    key: 'purchasePrice',
    kind: 'currency',
    min: 1_000,
    max: 100_000_000,
    required: true,
    labelKey: 'calcField.purchasePrice',
  },
  {
    key: 'monthlyRent',
    kind: 'currency',
    min: 1,
    max: 1_000_000,
    required: true,
    labelKey: 'calcField.monthlyRent',
  },
  {
    key: 'downPaymentPct',
    kind: 'percent',
    min: 0,
    max: 100,
    step: 0.5,
    required: true,
    labelKey: 'calcField.downPaymentPct',
  },
  {
    key: 'interestRatePct',
    kind: 'percent',
    min: 0,
    max: 25,
    step: 0.125,
    required: true,
    defaultFromAssumption: 'mortgageRatePct',
    labelKey: 'calcField.interestRatePct',
  },
  {
    key: 'loanTermYears',
    kind: 'integer',
    min: 1,
    max: 50,
    step: 1,
    required: true,
    labelKey: 'calcField.loanTermYears',
  },
  {
    key: 'annualTaxes',
    kind: 'currency',
    min: 0,
    max: 2_000_000,
    required: true,
    labelKey: 'calcField.annualTaxes',
  },
  {
    // Part 6.1: NO default — Florida insurance variance is extreme by age,
    // construction and flood zone; the user must supply their quote.
    key: 'annualInsurance',
    kind: 'currency',
    min: 0,
    max: 2_000_000,
    required: true,
    labelKey: 'calcField.annualInsurance',
    helperKey: 'calcHelper.annualInsurance',
  },
  {
    key: 'hoaMonthly',
    kind: 'currency',
    min: 0,
    max: 50_000,
    required: false,
    default: 0,
    labelKey: 'calcField.hoaMonthly',
  },
  {
    key: 'vacancyRatePct',
    kind: 'percent',
    min: 0,
    max: 100,
    step: 0.5,
    required: false,
    defaultFromAssumption: 'vacancyRatePct',
    labelKey: 'calcField.vacancyRatePct',
  },
  {
    key: 'maintenancePct',
    kind: 'percent',
    min: 0,
    max: 100,
    step: 0.5,
    required: false,
    defaultFromAssumption: 'maintenancePct',
    labelKey: 'calcField.maintenancePct',
  },
  {
    key: 'managementPct',
    kind: 'percent',
    min: 0,
    max: 100,
    step: 0.5,
    required: false,
    defaultFromAssumption: 'managementPct',
    labelKey: 'calcField.managementPct',
  },
  {
    key: 'closingCosts',
    kind: 'currency',
    min: 0,
    max: 10_000_000,
    required: false,
    default: 0,
    labelKey: 'calcField.closingCosts',
  },
];

export const RENTAL_CASHFLOW_ENGINE: CalcEngine<
  RentalCashflowInput,
  RentalCashflowResult
> = {
  id: 'rental-cashflow',
  fields: FIELDS,
  compute,
};

/**
 * Form values (display dollars / percents / integers) → engine input
 * (integer cents). The single conversion point at the engine boundary; pure,
 * shared by island and server.
 */
export function fromFormValues(
  values: Record<string, number | string | boolean>
): RentalCashflowInput {
  const dollars = (key: string) => Math.round(Number(values[key] ?? 0) * 100);
  const num = (key: string) => Number(values[key] ?? 0);
  return {
    purchasePriceCents: dollars('purchasePrice'),
    monthlyRentCents: dollars('monthlyRent'),
    downPaymentPct: num('downPaymentPct'),
    interestRatePct: num('interestRatePct'),
    loanTermYears: Math.round(num('loanTermYears')),
    annualTaxesCents: dollars('annualTaxes'),
    annualInsuranceCents: dollars('annualInsurance'),
    hoaMonthlyCents: dollars('hoaMonthly'),
    vacancyRatePct: num('vacancyRatePct'),
    maintenancePct: num('maintenancePct'),
    managementPct: num('managementPct'),
    closingCostsCents: dollars('closingCosts'),
  };
}
