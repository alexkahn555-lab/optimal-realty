import type { Basis, Localized } from '@/lib/types';

/**
 * ============================================================================
 * CALCULATOR ASSUMPTIONS — Build reference v2.0, Part 6.1
 * ============================================================================
 *
 * Every fee and rate default lives here. NEVER inline in an engine. NEVER
 * asserted in prose.
 *
 * ⚠ VERIFICATION REQUIREMENT (Part 6, hard rule):
 * No statutory figure below is asserted as current fact. Florida property tax
 * mechanics, homestead/portability rules, doc-stamp rates, title schedules, and
 * condo structural-reserve requirements all change, and several changed recently.
 * Each 'statutory' / 'promulgated-verify' value must be confirmed against primary
 * sources AND with the client (who holds the appraiser + CAM licenses) before the
 * corresponding tool leaves preview. The seed values are placeholders with a shape.
 *
 * The UI renders every non-statutory value in the AssumptionsTable with its
 * category and asOf date, and every value is user-editable in the calculator.
 */

export interface Assumption {
  key: string;
  value: number;
  basis: Basis;
  cite?: string; // statute or rule reference
  asOf: string; // ISO date last verified or set
  note?: Localized; // rendered in the AssumptionsTable
}

export type AssumptionSet = Record<string, Assumption>;

/**
 * Placeholder note used until the client supplies real review copy.
 *
 * These deliberately do NOT carry a content marker: assumption notes are flagged
 * *config*, surfaced and overridable in the UI (Part 6.1), not gated prose. The
 * gate that governs these values is the `basis` field + the AssumptionsTable,
 * not the content scanner. Prefixed "[unverified]" so the gap stays greppable.
 */
const NOTE = (en: string): Localized => ({
  en: `[unverified] ${en}`,
  es: `[sin verificar] ${en}`,
});

export const ASSUMPTIONS: AssumptionSet = {
  /* ---- Documentary stamp tax (statutory — VERIFY ch. 201 F.S.) ---------- */
  docStampPer100Statewide: {
    key: 'docStampPer100Statewide',
    value: 0.7, // per $100 of consideration
    basis: 'statutory',
    cite: 'F.S. ch. 201 — VERIFY current rate',
    asOf: '2026-07-19',
    note: NOTE('Florida statewide deed rate per $100. Verify before launch.'),
  },
  docStampPer100MiamiDade: {
    key: 'docStampPer100MiamiDade',
    value: 0.6,
    basis: 'statutory',
    cite: 'F.S. ch. 201 / Miami-Dade — VERIFY',
    asOf: '2026-07-19',
    note: NOTE('Miami-Dade operates its own deed rate. Verify.'),
  },
  miamiDadeSurtaxPer100: {
    key: 'miamiDadeSurtaxPer100',
    value: 0.45,
    basis: 'statutory',
    cite: 'F.S. 201.031 + county code — VERIFY',
    asOf: '2026-07-19',
    note: NOTE(
      'Applies to transfers OTHER THAN single-family residences. Condo/townhouse ' +
        'classification for the exemption is D-03 — confirm with title agent. Engine ' +
        'treats only single-family as exempt (conservative: over-estimates cost).'
    ),
  },

  /* ---- Title (promulgated — verify schedule at use) --------------------- */
  // Progressive owner's-policy bands live in the engine as a table keyed off this
  // marker; the marker exists so the AssumptionsTable can surface the basis.
  titleScheduleVerify: {
    key: 'titleScheduleVerify',
    value: 0,
    basis: 'promulgated-verify',
    cite: 'FL promulgated owner-policy rates — VERIFY',
    asOf: '2026-07-19',
    note: NOTE('Progressive premium bands per $1,000. Verify the schedule at use.'),
  },
  titlePaidBySeller: {
    key: 'titlePaidBySeller',
    value: 0, // 0 = buyer pays (Miami-Dade custom); 1 = seller pays
    basis: 'unconfirmed-default',
    cite: 'Miami-Dade custom, not law',
    asOf: '2026-07-19',
    note: NOTE('County custom is buyer-pays; negotiable per contract. D-03.'),
  },

  /* ---- Fees (unconfirmed — NOT the client's numbers) -------------------- */
  commissionRatePct: {
    key: 'commissionRatePct',
    value: 5.0,
    basis: 'unconfirmed-default',
    asOf: '2026-07-19',
    note: NOTE('Placeholder. NOT the client rate. User-editable. D-03.'),
  },
  settlementFee: {
    key: 'settlementFee',
    value: 595,
    basis: 'unconfirmed-default',
    asOf: '2026-07-19',
    note: NOTE('Title/closing agent fee. D-03.'),
  },
  lienSearchFee: {
    key: 'lienSearchFee',
    value: 150,
    basis: 'unconfirmed-default',
    asOf: '2026-07-19',
    note: NOTE('D-03.'),
  },
  satisfactionRecordingFee: {
    key: 'satisfactionRecordingFee',
    value: 18.5,
    basis: 'unconfirmed-default',
    asOf: '2026-07-19',
    note: NOTE('Per lien released. D-03.'),
  },
  estoppelFee: {
    key: 'estoppelFee',
    value: 299,
    basis: 'promulgated-verify',
    cite: 'FL statutory cap, inflation-adjusted — VERIFY',
    asOf: '2026-07-19',
    note: NOTE('Charged only when an HOA/condo association is involved. Verify amount.'),
  },

  /* ---- Homestead / tax reset (statutory — DO NOT GUESS) ----------------- */
  saveOurHomesCapPct: {
    key: 'saveOurHomesCapPct',
    value: 3.0,
    basis: 'statutory',
    cite: 'Save Our Homes assessment cap — VERIFY current mechanics',
    asOf: '2026-07-19',
    note: NOTE('Assessment growth limit (3% or CPI, lower) on homesteaded property. D-03.'),
  },
  millageRateMiamiDade: {
    key: 'millageRateMiamiDade',
    value: 0, // TK — composite millage varies by municipality/district
    basis: 'market-must-update',
    asOf: '2026-07-19',
    note: NOTE(
      'Composite millage varies by municipality and taxing district. A single ' +
        'county default is an approximation the UI must state plainly. Verify before tax tools ship.'
    ),
  },

  /* ---- Market (must-update) --------------------------------------------- */
  mortgageRatePct: {
    key: 'mortgageRatePct',
    value: 6.5,
    basis: 'market-must-update',
    asOf: '2026-07-19',
    note: NOTE('asOf rendered in UI. Quarterly review (R-06).'),
  },
  insuranceAnnualDefault: {
    key: 'insuranceAnnualDefault',
    value: 0, // TK — FL variance is extreme; flag loudly or require input
    basis: 'market-must-update',
    asOf: '2026-07-19',
    note: NOTE(
      'Florida insurance varies extremely by age, construction, and flood zone. ' +
        'A single default is near-meaningless; require input or flag loudly.'
    ),
  },

  /* ---- DTI heuristics (unconfirmed) ------------------------------------- */
  frontDtiPct: {
    key: 'frontDtiPct',
    value: 28,
    basis: 'unconfirmed-default',
    asOf: '2026-07-19',
    note: NOTE('Conventional heuristic. Client may prefer others. D-03.'),
  },
  backDtiPct: {
    key: 'backDtiPct',
    value: 36,
    basis: 'unconfirmed-default',
    asOf: '2026-07-19',
    note: NOTE('Conventional heuristic. Client may prefer others. D-03.'),
  },
} as const;
