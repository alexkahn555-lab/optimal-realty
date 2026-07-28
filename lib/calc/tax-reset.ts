import type { AssumptionSet } from '@/config/assumptions';
import type { Basis, EngineResult, LedgerLine } from '@/lib/types';
import type { CalcEngine, FieldSpec } from '@/lib/calc/types';
import { UI } from '@/content/ui-strings';

/**
 * ============================================================================
 * ENGINE 5 — PROPERTY TAX RESET. Build reference v2.0, Part 6.3. Dispatch 5h.
 * ============================================================================
 *
 * The buyer's trap this engine names: the seller's tax bill reflects an
 * assessed value held below market by the growth limitation for years; the
 * sale re-benchmarks it to the purchase price.
 *
 *   currentTaxableValue = max(0, currentAssessedValue − currentExemptions)
 *   currentAnnualTax = currentTaxableValue × millageRate / 1000
 *   newAssessedValue = purchasePrice
 *   newTaxableValue  = max(0, newAssessedValue − (homestead ? buyerExemptions : 0))
 *   newAnnualTax = newTaxableValue × millageRate / 1000
 *   difference = newAnnualTax − currentAnnualTax   (the headline; may be
 *     negative and is stated plainly)
 *   Projection: the first full tax year after purchase carries the
 *     re-benchmarked value; each SUBSEQUENT year grows assessed value by the
 *     growth limitation (saveOurHomesCapPct — statutory, VERIFY) and the tax
 *     is recomputed. Projection rows carry that assumption's basis.
 *
 * INPUT MODEL (binding, Part 6.1): millage and BOTH exemption amounts are
 * REQUIRED user inputs from the parcel's TRIM notice — never config defaults
 * ("do not guess"; composite millage varies by municipality and district).
 * Millage rides as integer MILLI-MILLS (mills × 1000), the 5f fixed-point
 * pattern for non-money numbers. Deliberately NOT modeled (Part 6.3
 * verification items): non-homestead assessment caps, portability, exemption
 * tiering, save-our-homes eligibility windows.
 *
 * Pure and deterministic; integer cents, each figure rounded ONCE from its
 * exact rational. monthlyLines is ALWAYS empty — annual figures only.
 */

export interface TaxResetInput {
  currentAssessedValueCents: number;
  currentExemptionsCents: number;
  purchasePriceCents: number;
  /** Mills × 1000 (integer fixed-point; 19.8 mills = 19,800). */
  millageMilliMills: number;
  buyerIntendsHomestead: boolean;
  buyerExemptionsCents: number;
  purchaseYear: number;
  projectionYears: number;
}

export interface TaxResetProjectionRow {
  year: number;
  assessedCents: number;
  taxCents: number;
  /** The growth limitation's basis — statutory (verify). */
  basis: Basis;
}

export interface TaxResetResult extends EngineResult {
  /** Two scenario bars (current vs new owner) for the comparison chart —
   *  keyed into UI.ledger; NEVER a place-vs-place comparison. */
  compareBars: { aKey: string; bKey: string; aCents: number; bCents: number };
  /** Multi-year projection under the growth limitation — a TABLE, not lines
   *  in either ledger; the headline never includes a projection figure. */
  projection: TaxResetProjectionRow[];
  currentAnnualTaxCents: number;
  newAnnualTaxCents: number;
}

/** tax = taxable × mills / 1000, with mills in integer milli-mills. */
function taxCentsOf(taxableCents: number, milliMills: number): number {
  return Math.round((taxableCents * milliMills) / 1_000_000);
}

function line(
  key: string,
  label: LedgerLine['label'],
  amountCents: number
): LedgerLine {
  return { key, label, amountCents, basis: 'input' };
}

export function compute(input: TaxResetInput, cfg: AssumptionSet): TaxResetResult {
  const cap = cfg.saveOurHomesCapPct;
  if (!cap) throw new Error('tax-reset: missing assumption key "saveOurHomesCapPct"');

  const currentTaxable = Math.max(
    0,
    input.currentAssessedValueCents - input.currentExemptionsCents
  );
  const currentAnnualTaxCents = taxCentsOf(currentTaxable, input.millageMilliMills);

  const buyerExemption = input.buyerIntendsHomestead
    ? input.buyerExemptionsCents
    : 0;
  const newAssessedCents = input.purchasePriceCents;
  const newTaxable = Math.max(0, newAssessedCents - buyerExemption);
  const newAnnualTaxCents = taxCentsOf(newTaxable, input.millageMilliMills);

  const differenceCents = newAnnualTaxCents - currentAnnualTaxCents;

  const projection: TaxResetProjectionRow[] = [];
  let assessed = newAssessedCents;
  for (let i = 1; i <= input.projectionYears; i += 1) {
    if (i > 1) assessed = Math.round(assessed * (1 + cap.value / 100));
    const taxable = Math.max(0, assessed - buyerExemption);
    projection.push({
      year: input.purchaseYear + i,
      assessedCents: assessed,
      taxCents: taxCentsOf(taxable, input.millageMilliMills),
      basis: cap.basis,
    });
  }

  return {
    monthlyLines: [], // annual figures only — never a synthesized monthly view
    oneTimeLines: [
      line('currentAnnualTax', UI.ledger.currentAnnualTax, currentAnnualTaxCents),
      line('newAnnualTax', UI.ledger.newAnnualTax, newAnnualTaxCents),
      line('taxDifference', UI.ledger.taxDifference, differenceCents),
    ],
    headline: { key: 'taxDifference', amountCents: differenceCents },
    assumptionKeysUsed: ['saveOurHomesCapPct'],
    compareBars: {
      aKey: 'currentAnnualTax',
      bKey: 'newAnnualTax',
      aCents: currentAnnualTaxCents,
      bCents: newAnnualTaxCents,
    },
    projection,
    currentAnnualTaxCents,
    newAnnualTaxCents,
  };
}

/* ---- FieldSpec surface (drives the form, validation, and tests — D9) ------- */

/**
 * Millage and both exemption amounts are REQUIRED with no default and no
 * assumption reference (binding). Wide bands per Part 6.2. The projection
 * horizon default (5 years) is a display parameter, not a market or
 * statutory figure.
 */
const FIELDS: FieldSpec[] = [
  {
    key: 'currentAssessedValue',
    kind: 'currency',
    min: 0,
    max: 100_000_000,
    required: true,
    labelKey: 'calcField.currentAssessedValue',
    helperKey: 'calcHelper.trimNotice',
  },
  {
    key: 'currentExemptions',
    kind: 'currency',
    min: 0,
    max: 100_000_000,
    required: true,
    labelKey: 'calcField.currentExemptions',
    helperKey: 'calcHelper.trimNotice',
  },
  {
    key: 'purchasePrice',
    kind: 'currency',
    min: 1_000,
    max: 100_000_000,
    required: true,
    labelKey: 'calcField.purchasePrice',
  },
  {
    key: 'millageRate',
    kind: 'percent',
    min: 0.1,
    max: 100,
    step: 0.0001,
    required: true,
    labelKey: 'calcField.millageRate',
    helperKey: 'calcHelper.trimNotice',
  },
  {
    key: 'buyerIntendsHomestead',
    kind: 'boolean',
    required: false,
    labelKey: 'calcField.buyerIntendsHomestead',
  },
  {
    key: 'buyerExemptions',
    kind: 'currency',
    min: 0,
    max: 100_000_000,
    required: true,
    labelKey: 'calcField.buyerExemptions',
    helperKey: 'calcHelper.buyerExemptions',
  },
  {
    key: 'purchaseYear',
    kind: 'integer',
    min: 1990,
    max: 2100,
    step: 1,
    required: true,
    labelKey: 'calcField.purchaseYear',
  },
  {
    key: 'projectionYears',
    kind: 'integer',
    min: 0,
    max: 30,
    step: 1,
    required: false,
    default: 5,
    labelKey: 'calcField.projectionYears',
  },
];

export const TAX_RESET_ENGINE: CalcEngine<TaxResetInput, TaxResetResult> = {
  id: 'tax-reset',
  fields: FIELDS,
  compute,
};

/**
 * Form values (display dollars / mills / integers) → engine input (integer
 * cents; mills → integer milli-mills). The single conversion point at the
 * engine boundary; pure, shared by island and server.
 */
export function fromFormValues(
  values: Record<string, number | string | boolean>
): TaxResetInput {
  const dollars = (key: string) => Math.round(Number(values[key] ?? 0) * 100);
  const int = (key: string) => Math.round(Number(values[key] ?? 0));
  return {
    currentAssessedValueCents: dollars('currentAssessedValue'),
    currentExemptionsCents: dollars('currentExemptions'),
    purchasePriceCents: dollars('purchasePrice'),
    millageMilliMills: Math.round(Number(values.millageRate ?? 0) * 1000),
    buyerIntendsHomestead: values.buyerIntendsHomestead === true,
    buyerExemptionsCents: dollars('buyerExemptions'),
    purchaseYear: int('purchaseYear'),
    projectionYears: int('projectionYears'),
  };
}
