import type { AssumptionSet } from '@/config/assumptions';
import type { EngineResult, LedgerLine } from '@/lib/types';
import type { CalcEngine, FieldSpec } from '@/lib/calc/types';
import { UI } from '@/content/ui-strings';

/**
 * ============================================================================
 * ENGINE 2 — VACANCY COST. Build reference v2.0, Part 6.4. Dispatch 5e.
 * ============================================================================
 *
 * The landlord tool nobody offers: what a vacant unit costs, and how many
 * ADDITIONAL vacant days a proposed rent increase can pay for over the lease
 * term — the trade-off behind "hold out for more rent".
 *
 *   dailyRent = rent × 12 / 365
 *   vacancyLoss = dailyRent × vacantDays
 *   totalCost = vacancyLoss + turnoverCost
 *   maxExtraVacantDays(delta) = (delta × leaseMonths) / dailyRent
 *
 * Pure and deterministic: no Date.now(), no I/O, no locale reads. Integer
 * cents everywhere, rounded ONCE per line from the exact rational (dailyRent
 * is never pre-rounded). Vacancy loss and turnover cost are one-time;
 * NOTHING here is recurring, so monthlyLines is always empty — the shape is
 * the contract, never summed across.
 *
 * maxExtraVacantDays is a DAYS quantity, not money: it rides in
 * `secondaryLines` (neither cost array), its amount is integer HUNDREDTHS OF
 * A DAY, and the display layer formats it as days (components/calc/labels).
 * The only assumption surfaced is the default lease term (unconfirmed-default
 * — config/assumptions.ts); every other value is user input, basis 'input'.
 */

export interface VacancyCostInput {
  monthlyRentCents: number;
  vacantDays: number;
  turnoverCostCents: number;
  /** The proposed MONTHLY rent increase (the delta), in cents. */
  proposedRentIncreaseCents: number;
  leaseMonths: number;
}

export interface VacancyCostResult extends EngineResult {
  /**
   * Days-valued output lines (unit: integer hundredths of a day in
   * `amountCents`). Kept OUT of monthlyLines/oneTimeLines so the money
   * ledgers stay money; rendered by ResultPanel's secondary block.
   */
  secondaryLines: LedgerLine[];
  /** The days figure echoed plainly for payload consumers and tests. */
  maxExtraVacantDayHundredths: number;
}

export function compute(
  input: VacancyCostInput,
  _cfg: AssumptionSet
): VacancyCostResult {
  const {
    monthlyRentCents,
    vacantDays,
    turnoverCostCents,
    proposedRentIncreaseCents,
    leaseMonths,
  } = input;

  // vacancyLoss = (rent × 12 / 365) × vacantDays, rounded once at the line.
  const vacancyLossCents = Math.round((monthlyRentCents * 12 * vacantDays) / 365);
  const totalCents = vacancyLossCents + turnoverCostCents;

  // maxExtraVacantDays = (delta × leaseMonths) / dailyRent, in hundredths of
  // a day. Form bounds keep rent >= $1; the guard still forbids divide-by-zero.
  const annualRentCents = monthlyRentCents * 12;
  const maxExtraVacantDayHundredths =
    annualRentCents > 0
      ? Math.round(
          (proposedRentIncreaseCents * leaseMonths * 365 * 100) / annualRentCents
        )
      : 0;

  const oneTimeLines: LedgerLine[] = [
    {
      key: 'vacancyLoss',
      label: UI.ledger.vacancyLoss,
      amountCents: vacancyLossCents,
      basis: 'input',
    },
    {
      key: 'turnoverCost',
      label: UI.ledger.turnoverCost,
      amountCents: turnoverCostCents,
      basis: 'input',
    },
  ];

  const secondaryLines: LedgerLine[] = [
    {
      key: 'maxExtraVacantDays',
      label: UI.ledger.maxExtraVacantDays,
      amountCents: maxExtraVacantDayHundredths,
      basis: 'input',
    },
  ];

  return {
    monthlyLines: [],
    oneTimeLines,
    headline: { key: 'vacancyTotal', amountCents: totalCents },
    assumptionKeysUsed: ['leaseMonthsDefault'],
    secondaryLines,
    maxExtraVacantDayHundredths,
  };
}

/* ---- FieldSpec surface (drives the form, validation, and tests — D9) ------- */

/**
 * Wide bands per Part 6.2 — never narrowed around an assumed typical
 * Miami-Dade rental. The only default that is not a plain zero is the lease
 * term, which routes through config/assumptions.ts as an unconfirmed default.
 */
const FIELDS: FieldSpec[] = [
  {
    key: 'monthlyRent',
    kind: 'currency',
    min: 1,
    max: 1_000_000,
    required: true,
    labelKey: 'calcField.monthlyRent',
  },
  {
    key: 'vacantDays',
    kind: 'integer',
    min: 0,
    max: 3_650,
    step: 1,
    required: false,
    default: 0,
    labelKey: 'calcField.vacantDays',
    helperKey: 'calcHelper.vacantDays',
  },
  {
    key: 'turnoverCost',
    kind: 'currency',
    min: 0,
    max: 1_000_000,
    required: false,
    default: 0,
    labelKey: 'calcField.turnoverCost',
    helperKey: 'calcHelper.turnoverCost',
  },
  {
    key: 'proposedRentIncrease',
    kind: 'currency',
    min: 0,
    max: 100_000,
    required: false,
    default: 0,
    labelKey: 'calcField.proposedRentIncrease',
    helperKey: 'calcHelper.proposedRentIncrease',
  },
  {
    key: 'leaseMonths',
    kind: 'integer',
    min: 1,
    max: 120,
    step: 1,
    required: false,
    defaultFromAssumption: 'leaseMonthsDefault',
    labelKey: 'calcField.leaseMonths',
  },
];

export const VACANCY_COST_ENGINE: CalcEngine<VacancyCostInput, VacancyCostResult> = {
  id: 'vacancy-cost',
  fields: FIELDS,
  compute,
};

/**
 * Form values (display dollars / integers) → engine input (integer cents).
 * The single conversion point at the engine boundary; pure, shared by island
 * and server.
 */
export function fromFormValues(
  values: Record<string, number | string | boolean>
): VacancyCostInput {
  const dollars = (key: string) => Math.round(Number(values[key] ?? 0) * 100);
  const int = (key: string) => Math.round(Number(values[key] ?? 0));
  return {
    monthlyRentCents: dollars('monthlyRent'),
    vacantDays: int('vacantDays'),
    turnoverCostCents: dollars('turnoverCost'),
    proposedRentIncreaseCents: dollars('proposedRentIncrease'),
    leaseMonths: int('leaseMonths'),
  };
}
