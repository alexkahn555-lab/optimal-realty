import { ASSUMPTIONS } from '@/config/assumptions';
import type { AssumptionSet } from '@/config/assumptions';
import type { EngineResult, IsoDate, LedgerLine } from '@/lib/types';
import type { CalcEngine, FieldSpec } from '@/lib/calc/types';
import { UI } from '@/content/ui-strings';

/**
 * ============================================================================
 * ENGINE 1 — SELLER NET PROCEEDS. Build reference v2.0, Part 6.2. FLAGSHIP, P3.
 * ============================================================================
 *
 * Pure and deterministic: no Date.now(), no I/O, no locale reads — the closing
 * date enters as an input and calendar math is done on the ISO string. Integer
 * cents everywhere; rounding only at display. Every fee and rate is read from
 * config/assumptions.ts by key — nothing is inlined here. Statutory figures are
 * placeholders with a shape until verified (Part 6 hard rule).
 *
 * monthlyLines and oneTimeLines are SEPARATE arrays; a sale ledger has no
 * recurring lines, so monthlyLines is always empty — the shape is the contract.
 */

export type County = 'miami-dade' | 'other-fl';
export type NetProceedsPropertyClass = 'single-family' | 'other';

export interface NetProceedsInput {
  salePriceCents: number;
  county: County;
  propertyClass: NetProceedsPropertyClass;
  mortgagePayoffCents: number;
  secondLienPayoffCents: number;
  commissionRatePct: number;
  sellerConcessionsCents: number;
  /** 0 = unknown/omitted; a positive value enables the proration line. */
  annualPropertyTaxCents: number;
  closingDate: IsoDate;
  /** 0 = no association; a positive value enables proration + estoppel. */
  hoaMonthlyCents: number;
  titlePaidBySeller: boolean;
}

export interface NetProceedsResult extends EngineResult {
  /** Sale price echoed in cents so result UIs can show gross − costs = net. */
  grossCents: number;
}

/* ---- Calendar math on the ISO string (pure; no Date object) --------------- */

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function parseIso(date: IsoDate): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return { year, month, day };
}

/** Day-of-year of the closing date; Jul 1 in a non-leap year = 182. */
function dayOfYear(date: IsoDate): number {
  const { year, month, day } = parseIso(date);
  let days = day;
  for (let m = 0; m < month - 1; m += 1) days += MONTH_DAYS[m] as number;
  if (month > 2 && isLeapYear(year)) days += 1;
  return days;
}

function daysInMonth(date: IsoDate): number {
  const { year, month } = parseIso(date);
  if (month === 2 && isLeapYear(year)) return 29;
  return MONTH_DAYS[month - 1] as number;
}

/* ---- Assumption access ----------------------------------------------------- */

/** Dollars-valued assumption → integer cents. */
function centsOf(cfg: AssumptionSet, key: string): number {
  const assumption = cfg[key];
  if (!assumption) throw new Error(`net-proceeds: missing assumption key "${key}"`);
  return Math.round(assumption.value * 100);
}

function rateOf(cfg: AssumptionSet, key: string): number {
  const assumption = cfg[key];
  if (!assumption) throw new Error(`net-proceeds: missing assumption key "${key}"`);
  return assumption.value;
}

/* ---- Documentary stamps (statutory; county branch, Part 6.2) --------------- */

/**
 * Per $100 of consideration "or fraction thereof" — units ceil. Rates come from
 * the AssumptionSet; per-unit cents are rounded once so unit math stays integer.
 * Miami-Dade adds a surtax on transfers OTHER THAN single-family residences;
 * condo/townhouse treatment of the exemption is D-03, so only single-family is
 * treated as exempt (conservative: over-estimates cost).
 */
export function docStampsCents(
  priceCents: number,
  county: County,
  cls: NetProceedsPropertyClass,
  cfg: AssumptionSet = ASSUMPTIONS
): number {
  const units = Math.ceil(priceCents / 100_00);
  if (county === 'other-fl') {
    return units * Math.round(rateOf(cfg, 'docStampPer100Statewide') * 100);
  }
  const base = units * Math.round(rateOf(cfg, 'docStampPer100MiamiDade') * 100);
  const surtax =
    cls === 'single-family'
      ? 0
      : units * Math.round(rateOf(cfg, 'miamiDadeSurtaxPer100') * 100);
  return base + surtax;
}

/** Surtax component alone (its own ledger line when non-zero). */
function surtaxCents(
  priceCents: number,
  cls: NetProceedsPropertyClass,
  cfg: AssumptionSet
): number {
  if (cls === 'single-family') return 0;
  const units = Math.ceil(priceCents / 100_00);
  return units * Math.round(rateOf(cfg, 'miamiDadeSurtaxPer100') * 100);
}

/* ---- Title premium (promulgated bands — VERIFY schedule at use) ------------ */

/**
 * FL promulgated owner's-policy rate bands, per $1,000 of coverage or fraction
 * thereof. The band table lives HERE keyed off the `titleScheduleVerify` config
 * marker (basis: promulgated-verify) so the AssumptionsTable surfaces the basis;
 * the schedule itself is structural band data, seeded per the reference and
 * UNVERIFIED until checked against the current promulgated schedule (D-03).
 */
const TITLE_BANDS: { upToThousands: number; centsPerThousand: number }[] = [
  { upToThousands: 100, centsPerThousand: 575 },
  { upToThousands: 1_000, centsPerThousand: 500 },
  { upToThousands: 5_000, centsPerThousand: 250 },
  { upToThousands: 10_000, centsPerThousand: 225 },
  { upToThousands: Number.POSITIVE_INFINITY, centsPerThousand: 200 },
];

export function titlePremiumCents(priceCents: number): number {
  let remaining = Math.ceil(priceCents / 1_000_00); // $1,000 units, fraction ceils
  let previousCap = 0;
  let premium = 0;
  for (const band of TITLE_BANDS) {
    if (remaining <= 0) break;
    const bandUnits = Math.min(remaining, band.upToThousands - previousCap);
    premium += bandUnits * band.centsPerThousand;
    remaining -= bandUnits;
    previousCap = band.upToThousands;
  }
  return premium;
}

/* ---- The engine ------------------------------------------------------------ */

/**
 * Keys surfaced to the AssumptionsTable. Deterministic on the county branch
 * only (not on transient field edits) so the rendered table never flickers:
 * the full fee/title/commission set is always listed, and the statutory
 * doc-stamp column follows the selected county.
 */
function assumptionKeysUsed(county: County): string[] {
  const countyKeys =
    county === 'miami-dade'
      ? ['docStampPer100MiamiDade', 'miamiDadeSurtaxPer100']
      : ['docStampPer100Statewide'];
  return [
    ...countyKeys,
    'commissionRatePct',
    'titlePaidBySeller',
    'titleScheduleVerify',
    'settlementFee',
    'lienSearchFee',
    'satisfactionRecordingFee',
    'estoppelFee',
  ];
}

function ledgerLine(
  key: string,
  label: LedgerLine['label'],
  amountCents: number,
  basis: LedgerLine['basis']
): LedgerLine {
  const flagged = basis !== 'statutory' && basis !== 'input';
  return { key, label, amountCents, basis, ...(flagged ? { flagged: true } : {}) };
}

/** Computation order per Part 6.2, steps 1–10. */
export function compute(input: NetProceedsInput, cfg: AssumptionSet): NetProceedsResult {
  const oneTimeLines: LedgerLine[] = [];
  const gross = input.salePriceCents;

  // 2 — payoffs (basis: input)
  if (input.mortgagePayoffCents > 0) {
    oneTimeLines.push(
      ledgerLine('mortgagePayoff', UI.ledger.mortgagePayoff, input.mortgagePayoffCents, 'input')
    );
  }
  if (input.secondLienPayoffCents > 0) {
    oneTimeLines.push(
      ledgerLine(
        'secondLienPayoff',
        UI.ledger.secondLienPayoff,
        input.secondLienPayoffCents,
        'input'
      )
    );
  }

  // 3 — commission (basis: unconfirmed-default)
  oneTimeLines.push(
    ledgerLine(
      'commission',
      UI.ledger.commission,
      Math.round((gross * input.commissionRatePct) / 100),
      'unconfirmed-default'
    )
  );

  // 4 — documentary stamps (basis: statutory), surtax as its own line
  const surtax = input.county === 'miami-dade' ? surtaxCents(gross, input.propertyClass, cfg) : 0;
  const stampsBase = docStampsCents(gross, input.county, input.propertyClass, cfg) - surtax;
  oneTimeLines.push(ledgerLine('docStamps', UI.ledger.docStamps, stampsBase, 'statutory'));
  if (surtax > 0) {
    oneTimeLines.push(ledgerLine('docStampSurtax', UI.ledger.docStampSurtax, surtax, 'statutory'));
  }

  // 5 — title (basis: promulgated-verify), only when the seller pays
  if (input.titlePaidBySeller) {
    oneTimeLines.push(
      ledgerLine('titlePremium', UI.ledger.titlePremium, titlePremiumCents(gross), 'promulgated-verify')
    );
  }

  // 6 — tax proration (arrears: seller credits buyer for elapsed days).
  //     Denominator fixed at 365 per the reference formula. The method note
  //     must state the estimate ignores early-payment discounts and exemptions.
  if (input.annualPropertyTaxCents > 0) {
    const elapsed = dayOfYear(input.closingDate);
    oneTimeLines.push(
      ledgerLine(
        'taxProration',
        UI.ledger.taxProration,
        Math.round((input.annualPropertyTaxCents * elapsed) / 365),
        'input'
      )
    );
  }

  // 7 — HOA proration + estoppel (only when an association exists)
  if (input.hoaMonthlyCents > 0) {
    const day = parseIso(input.closingDate).day;
    oneTimeLines.push(
      ledgerLine(
        'hoaProration',
        UI.ledger.hoaProration,
        Math.round((input.hoaMonthlyCents * day) / daysInMonth(input.closingDate)),
        'input'
      )
    );
    oneTimeLines.push(
      ledgerLine('estoppelFee', UI.ledger.estoppelFee, centsOf(cfg, 'estoppelFee'), 'promulgated-verify')
    );
  }

  // 8 — misc fees (basis: unconfirmed-default); satisfaction is per lien released
  oneTimeLines.push(
    ledgerLine('settlementFee', UI.ledger.settlementFee, centsOf(cfg, 'settlementFee'), 'unconfirmed-default')
  );
  oneTimeLines.push(
    ledgerLine('lienSearchFee', UI.ledger.lienSearchFee, centsOf(cfg, 'lienSearchFee'), 'unconfirmed-default')
  );
  const lienCount =
    (input.mortgagePayoffCents > 0 ? 1 : 0) + (input.secondLienPayoffCents > 0 ? 1 : 0);
  if (lienCount > 0) {
    oneTimeLines.push(
      ledgerLine(
        'satisfactionRecording',
        UI.ledger.satisfactionRecording,
        lienCount * centsOf(cfg, 'satisfactionRecordingFee'),
        'unconfirmed-default'
      )
    );
  }

  // 9 — concessions (basis: input)
  if (input.sellerConcessionsCents > 0) {
    oneTimeLines.push(
      ledgerLine('sellerConcessions', UI.ledger.sellerConcessions, input.sellerConcessionsCents, 'input')
    );
  }

  // 10 — net; may be negative, and the UI states the shortfall plainly
  const totalOneTime = oneTimeLines.reduce((sum, l) => sum + l.amountCents, 0);

  return {
    monthlyLines: [],
    oneTimeLines,
    headline: { key: 'netProceeds', amountCents: gross - totalOneTime },
    assumptionKeysUsed: assumptionKeysUsed(input.county),
    grossCents: gross,
  };
}

/* ---- FieldSpec surface (drives the form, validation, and tests — D9) ------- */

const FIELDS: FieldSpec[] = [
  {
    key: 'salePrice',
    kind: 'currency',
    min: 50_000,
    max: 20_000_000,
    required: true,
    labelKey: 'calcField.salePrice',
  },
  {
    key: 'county',
    kind: 'enum',
    required: true,
    default: 'miami-dade',
    enumValues: ['miami-dade', 'other-fl'],
    labelKey: 'calcField.county',
  },
  {
    key: 'propertyClass',
    kind: 'enum',
    required: true,
    default: 'single-family',
    enumValues: ['single-family', 'other'],
    labelKey: 'calcField.propertyClass',
  },
  {
    // Reference upper bound is relative (1.5 x price) — enforced cross-field in
    // the island; the static max is the bound at the price ceiling.
    key: 'mortgagePayoff',
    kind: 'currency',
    min: 0,
    max: 30_000_000,
    required: false,
    default: 0,
    labelKey: 'calcField.mortgagePayoff',
    helperKey: 'calcHelper.mortgagePayoff',
  },
  {
    key: 'secondLienPayoff',
    kind: 'currency',
    min: 0,
    max: 20_000_000,
    required: false,
    default: 0,
    labelKey: 'calcField.secondLienPayoff',
  },
  {
    key: 'commissionRatePct',
    kind: 'percent',
    min: 0,
    max: 10,
    step: 0.1,
    required: true,
    defaultFromAssumption: 'commissionRatePct',
    labelKey: 'calcField.commissionRatePct',
  },
  {
    // Reference bound: 0–0.10 x price (cross-field in the island).
    key: 'sellerConcessions',
    kind: 'currency',
    min: 0,
    max: 2_000_000,
    required: false,
    default: 0,
    labelKey: 'calcField.sellerConcessions',
  },
  {
    key: 'annualPropertyTax',
    kind: 'currency',
    min: 0,
    max: 500_000,
    required: false,
    default: 0,
    labelKey: 'calcField.annualPropertyTax',
    helperKey: 'calcHelper.annualPropertyTax',
  },
  {
    // Default "today + 45d" is computed in the island at mount (client clock is
    // outside compute); range today…+365d is likewise island-enforced.
    key: 'closingDate',
    kind: 'date',
    required: true,
    labelKey: 'calcField.closingDate',
  },
  {
    key: 'hoaMonthly',
    kind: 'currency',
    min: 0,
    max: 10_000,
    required: false,
    default: 0,
    labelKey: 'calcField.hoaMonthly',
    helperKey: 'calcHelper.hoaMonthly',
  },
  {
    key: 'titlePaidBySeller',
    kind: 'boolean',
    required: false,
    defaultFromAssumption: 'titlePaidBySeller',
    labelKey: 'calcField.titlePaidBySeller',
  },
];

export const NET_PROCEEDS_ENGINE: CalcEngine<NetProceedsInput, NetProceedsResult> = {
  id: 'net-proceeds',
  fields: FIELDS,
  compute,
};

/**
 * Cross-field bounds from the reference input table that FieldSpec cannot
 * express statically: payoff <= 1.5 x price, second lien <= price,
 * concessions <= 0.10 x price. Pure; applied by the island before compute.
 */
export function clampInputs(
  values: Record<string, number | string | boolean>
): Record<string, number | string | boolean> {
  const price = Number(values.salePrice ?? 0);
  if (!Number.isFinite(price) || price <= 0) return values;
  const cap = (key: string, max: number) => {
    const v = Number(values[key] ?? 0);
    return Number.isFinite(v) ? Math.min(v, max) : 0;
  };
  return {
    ...values,
    mortgagePayoff: cap('mortgagePayoff', 1.5 * price),
    secondLienPayoff: cap('secondLienPayoff', price),
    sellerConcessions: cap('sellerConcessions', 0.1 * price),
  };
}

/**
 * Form values (display units: dollars / ISO date / enum strings / booleans) →
 * engine input (integer cents). The single conversion point at the engine
 * boundary; pure, shared by island and server.
 */
export function fromFormValues(
  values: Record<string, number | string | boolean>
): NetProceedsInput {
  const dollars = (key: string) => Math.round(Number(values[key] ?? 0) * 100);
  return {
    salePriceCents: dollars('salePrice'),
    county: (values.county as County) ?? 'miami-dade',
    propertyClass: (values.propertyClass as NetProceedsPropertyClass) ?? 'single-family',
    mortgagePayoffCents: dollars('mortgagePayoff'),
    secondLienPayoffCents: dollars('secondLienPayoff'),
    commissionRatePct: Number(values.commissionRatePct ?? 0),
    sellerConcessionsCents: dollars('sellerConcessions'),
    annualPropertyTaxCents: dollars('annualPropertyTax'),
    closingDate: String(values.closingDate ?? '') as IsoDate,
    hoaMonthlyCents: dollars('hoaMonthly'),
    titlePaidBySeller: values.titlePaidBySeller === true,
  };
}
