import type { AssumptionSet } from '@/config/assumptions';
import type { EngineResult, LedgerLine } from '@/lib/types';
import type { CalcEngine, FieldSpec } from '@/lib/calc/types';
import { UI } from '@/content/ui-strings';

/**
 * ============================================================================
 * ENGINE 4 — CONDO ASSESSMENT EXPOSURE. Build reference v2.0, Part 6.3.
 * Dispatch 5g.
 * ============================================================================
 *
 * FRAMING (Part 6.3, binding): a structured way to think about exposure using
 * ASSOCIATION-DISCLOSED figures the buyer supplies. The engine takes what the
 * association discloses and does arithmetic on it. It does not estimate,
 * forecast, score, or rate anything; no input asks the user to judge a
 * building; no output ranks or characterizes risk; NO figure is defaulted —
 * a prefilled reserve balance would be an invented claim about a real
 * building. Zero assumptions are consulted; every line's basis is 'input'.
 *
 *   unitShare = the unit's ownership percentage as disclosed
 *   shareOfReserveBalance = reserveBalance × unitShare
 *   shareOfDeferredItems  = deferredItemsTotal × unitShare
 *   fundingGap = shareOfDeferredItems − shareOfReserveBalance  (may be
 *     negative where reserves exceed deferred items — stated plainly)
 *   unitAssessment = assessmentTotal × unitShare, amortized over the
 *     disclosed installment term at the disclosed interest rate
 *
 * HEADLINE RULE: the unit's assessment total (including disclosed interest)
 * where an assessment is levied or proposed; otherwise the unit's funding
 * gap. Pure and deterministic; integer cents, each line rounded ONCE from its
 * exact rational.
 */

export interface CondoAssessmentInput {
  unitSharePct: number;
  reserveBalanceCents: number;
  deferredItemsTotalCents: number;
  /** 0 = no assessment levied or proposed. */
  assessmentTotalCents: number;
  /** 0 = lump sum (no installment term disclosed). */
  assessmentTermMonths: number;
  assessmentInterestPct: number;
  monthlyDuesCents: number;
}

export interface CondoAssessmentResult extends EngineResult {
  shareOfReserveCents: number;
  shareOfDeferredCents: number;
  fundingGapCents: number;
  /** The unit's share of the levied total, BEFORE any disclosed interest. */
  unitAssessmentCents: number;
  /** The unit's assessment total including disclosed interest; null when no
   *  assessment is levied or proposed. */
  assessmentTotalCents: number | null;
}

function line(
  key: string,
  label: LedgerLine['label'],
  amountCents: number
): LedgerLine {
  // Part 6.3: every figure in this engine is user-supplied disclosure data or
  // pure arithmetic on it — basis 'input', never flagged.
  return { key, label, amountCents, basis: 'input' };
}

export function compute(
  input: CondoAssessmentInput,
  _cfg: AssumptionSet
): CondoAssessmentResult {
  const shareOf = (cents: number) =>
    Math.round((cents * input.unitSharePct) / 100);

  const shareOfReserveCents = shareOf(input.reserveBalanceCents);
  const shareOfDeferredCents = shareOf(input.deferredItemsTotalCents);
  const fundingGapCents = shareOfDeferredCents - shareOfReserveCents;

  const unitAssessmentCents = shareOf(input.assessmentTotalCents);
  const term = input.assessmentTermMonths;
  const levied = unitAssessmentCents > 0;

  // Amortized installment over the disclosed term at the disclosed rate;
  // straight division at 0%. The with-interest total rounds ONCE from the
  // exact n × payment, so a 0% amortization totals exactly the principal.
  let installmentCents = 0;
  let totalCents = unitAssessmentCents;
  if (levied && term >= 1) {
    const i = input.assessmentInterestPct / 100 / 12;
    const exact =
      i === 0
        ? unitAssessmentCents / term
        : (unitAssessmentCents * i) / (1 - (1 + i) ** -term);
    installmentCents = Math.round(exact);
    totalCents = Math.round(term * exact);
  }

  const monthlyLines: LedgerLine[] = [
    line('monthlyDues', UI.ledger.monthlyDues, input.monthlyDuesCents),
    ...(levied && term >= 1
      ? [
          line(
            'assessmentInstallment',
            UI.ledger.assessmentInstallment,
            installmentCents
          ),
        ]
      : []),
  ];

  const oneTimeLines: LedgerLine[] = [
    line(
      'shareOfDeferredItems',
      UI.ledger.shareOfDeferredItems,
      shareOfDeferredCents
    ),
    line(
      'shareOfReserveBalance',
      UI.ledger.shareOfReserveBalance,
      shareOfReserveCents
    ),
    line('fundingGap', UI.ledger.fundingGap, fundingGapCents),
    ...(levied
      ? [line('assessmentTotal', UI.ledger.assessmentTotal, totalCents)]
      : []),
  ];

  return {
    monthlyLines,
    oneTimeLines,
    headline: levied
      ? { key: 'assessmentTotal', amountCents: totalCents }
      : { key: 'fundingGap', amountCents: fundingGapCents },
    assumptionKeysUsed: [], // Part 6.3: zero assumptions — nothing is defaulted
    shareOfReserveCents,
    shareOfDeferredCents,
    fundingGapCents,
    unitAssessmentCents,
    assessmentTotalCents: levied ? totalCents : null,
  };
}

/* ---- FieldSpec surface (drives the form, validation, and tests — D9) ------- */

/**
 * Every field is a disclosure figure the user supplies: required or
 * explicitly optional, NONE prefilled (no `default`, no assumption). Wide
 * bands per Part 6.2 — association balances can be enormous.
 */
const FIELDS: FieldSpec[] = [
  {
    key: 'unitSharePct',
    kind: 'percent',
    min: 0.0001,
    max: 100,
    step: 0.0001,
    required: true,
    labelKey: 'calcField.unitSharePct',
    helperKey: 'calcHelper.unitSharePct',
  },
  {
    key: 'reserveBalance',
    kind: 'currency',
    min: 0,
    max: 1_000_000_000,
    required: true,
    labelKey: 'calcField.reserveBalance',
    helperKey: 'calcHelper.disclosedFigure',
  },
  {
    key: 'deferredItemsTotal',
    kind: 'currency',
    min: 0,
    max: 1_000_000_000,
    required: true,
    labelKey: 'calcField.deferredItemsTotal',
    helperKey: 'calcHelper.disclosedFigure',
  },
  {
    key: 'assessmentTotal',
    kind: 'currency',
    min: 0,
    max: 1_000_000_000,
    required: false,
    labelKey: 'calcField.assessmentTotal',
    helperKey: 'calcHelper.assessmentTotal',
  },
  {
    key: 'assessmentTermMonths',
    kind: 'integer',
    min: 0,
    max: 600,
    step: 1,
    required: false,
    labelKey: 'calcField.assessmentTermMonths',
  },
  {
    key: 'assessmentInterestPct',
    kind: 'percent',
    min: 0,
    max: 30,
    step: 0.125,
    required: false,
    labelKey: 'calcField.assessmentInterestPct',
  },
  {
    key: 'monthlyDues',
    kind: 'currency',
    min: 0,
    max: 100_000,
    required: true,
    labelKey: 'calcField.monthlyDues',
  },
];

export const CONDO_ASSESSMENT_ENGINE: CalcEngine<
  CondoAssessmentInput,
  CondoAssessmentResult
> = {
  id: 'condo-assessment',
  fields: FIELDS,
  compute,
};

/**
 * Form values (display dollars / percents / integers) → engine input
 * (integer cents). Absent optional fields coerce to 0 — the "not disclosed /
 * none levied" state — WITHOUT a prefilled form value. The single conversion
 * point at the engine boundary; pure, shared by island and server.
 */
export function fromFormValues(
  values: Record<string, number | string | boolean>
): CondoAssessmentInput {
  const dollars = (key: string) => Math.round(Number(values[key] ?? 0) * 100);
  const num = (key: string) => Number(values[key] ?? 0);
  return {
    unitSharePct: num('unitSharePct'),
    reserveBalanceCents: dollars('reserveBalance'),
    deferredItemsTotalCents: dollars('deferredItemsTotal'),
    assessmentTotalCents: dollars('assessmentTotal'),
    assessmentTermMonths: Math.round(num('assessmentTermMonths')),
    assessmentInterestPct: num('assessmentInterestPct'),
    monthlyDuesCents: dollars('monthlyDues'),
  };
}
