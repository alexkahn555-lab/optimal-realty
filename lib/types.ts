/**
 * ============================================================================
 * OPTIMAL REALTY — DATA MODEL
 * The contract everything else compiles against. Build reference v2.0, Part 2.
 * ============================================================================
 *
 * Rules encoded here:
 *  - Every user-visible string is `Localized` (D3: publish = both locales or neither).
 *  - Every unconfirmed NUMBER routes through AssumptionSet (config/assumptions.ts),
 *    never a TK_ string. Every unconfirmed PROSE string is a literal 'TK_...' value.
 *  - SourcedStat has no optional source/asOf: a fabricated statistic is
 *    unrepresentable, not merely discouraged (Part 1.4 content-integrity rule).
 *  - The Listing type has NO mlsNumber / IDX / syndication fields. Adding IDX is a
 *    re-scope, not a feature request (R-12).
 *  - ScorecardEntry has NO 'schools' or 'desirability' key. Fair-housing hard rule
 *    (D11 / R-04). Scores are the broker's own assessment, never third-party ratings.
 *
 * Mirroring zod schemas live in lib/content/schema.ts and enforce all of this at
 * prebuild via scripts/check-content.mjs.
 */

/* ---- Primitives --------------------------------------------------------- */

export type Locale = 'en' | 'es';
export type Localized<T = string> = Record<Locale, T>;
export type ContentStatus = 'draft' | 'published';
export type IsoDate = `${number}-${number}-${number}`; // '2026-07-19'

export type PortalId =
  | 'sellers'
  | 'buyers'
  | 'investors'
  | 'landlords'
  | 'tenants';

/**
 * Recommended tool lineup — UNCONFIRMED (D-01). Rebuilt around the broker's
 * appraiser + CAM credential stack. Mortgage-payment and rent-vs-buy are
 * deliberately excluded as commodities; add only if the client asks.
 */
export type CalcId =
  | 'net-proceeds' // sellers   — flagship, ships P3
  | 'tax-reset' // buyers    — signature differentiator (appraiser license)
  | 'homestead-portability' // sellers → buyers
  | 'condo-assessment' // buyers/investors — CAM credential surface
  | 'rental-cashflow' // investors
  | 'vacancy-cost'; // landlords

/* ---- Routing ------------------------------------------------------------ */

export type RouteId =
  | 'home'
  | `portal.${PortalId}`
  | `subpage.${string}`
  | 'tools'
  | `tool.${CalcId}`
  | 'listings'
  | 'listings.sold'
  | `listing.${string}`
  | 'neighborhoods'
  | `neighborhood.${string}`
  | 'about'
  | 'contact'
  | `legal.${'privacy' | 'terms' | 'disclosures' | 'accessibility'}`;

export interface RouteDef {
  id: RouteId;
  slug: Localized | string; // string = locale-invariant (listings, neighborhoods)
  parent?: RouteId; // breadcrumb + URL nesting
  phase: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/**
 * The ONLY legal way to build an internal URL. Raw string hrefs fail a custom
 * lint rule. Defined in lib/seo/href.ts; declared here so types can reference it.
 */
export type HrefFn = (id: RouteId, locale: Locale) => string;

/* ---- AEO primitives ----------------------------------------------------- */

export interface AnswerBlock {
  question: Localized; // question-shaped; becomes the H1
  answer: Localized; // 40–60 words, plain text; also seeds the meta description
  updated: IsoDate; // rendered visibly + emitted as dateModified
}

/**
 * No statistic renders without source + asOf. Both REQUIRED — a fabricated
 * market number cannot be expressed in the type system.
 */
export interface SourcedStat {
  value: number;
  unit: 'usd' | 'usd_sqft' | 'pct' | 'days' | 'count' | 'minutes' | 'sqft';
  asOf: IsoDate;
  source: string; // must be licensed or public-record (R-08)
}

export interface Faq {
  id: string;
  question: Localized;
  answer: Localized; // TK_ — never generated
  scope: {
    type: 'global' | 'portal' | 'tool' | 'listing' | 'neighborhood';
    refId?: string;
  };
}

/* ---- Broker guidance ---------------------------------------------------- */

export interface AdviceSection {
  id: string;
  portalId: PortalId;
  heading: Localized; // question-shaped
  body: Localized; // 'TK_ADVICE_<PORTAL>_<ID>' — professional counsel, never generated
  reviewedBy: 'raul-perez';
  lastReviewed?: IsoDate; // rendered "reviewed <date>" — authorship + freshness signal
  status: ContentStatus; // a draft section is simply omitted from render
}

/* ---- Portals & tools ---------------------------------------------------- */

export interface Portal {
  id: PortalId;
  slug: Localized;
  title: Localized;
  answer: AnswerBlock;
  decision: Localized; // the ONE decision this portal supports — TK_ (D-02)
  decisionSteps: { label: Localized; detail: Localized }[]; // 3–5, structural
  toolIds: CalcId[]; // ordered rail — UNCONFIRMED D-01
  subpageIds: string[];
  adviceIds: string[]; // MAY BE EMPTY — client copy never blocks a route
  faqIds: string[]; // max 8 rendered
  featuredListings: { mode: 'active' | 'sold' | 'leased'; limit: number };
  serviceSchema: { serviceType: string };
  status: ContentStatus;
}

export interface PortalSubpage {
  id: string; // e.g. 'sellers-home-valuation'
  portalId: PortalId;
  slug: Localized;
  title: Localized;
  answer: AnswerBlock;
  adviceIds: string[]; // resolved → published AdviceSections only
  relatedToolIds: CalcId[];
  faqIds: string[];
  status: ContentStatus;
}

export interface ToolDef {
  id: CalcId;
  slug: Localized;
  title: Localized;
  portalIds: PortalId[]; // a tool may serve several portals
  answer: AnswerBlock;
  engineId: CalcId; // 1:1 binding to lib/calc/<engineId>.ts
  methodNote: Localized; // TK_ — broker review of methodology
  disclaimer: Localized; // TK_ — attorney review, required before Phase 6
  faqIds: string[];
  leadCapture: { enabled: boolean };
  status: ContentStatus;
}

/* ---- Listings ----------------------------------------------------------- */

export type ListingStatus =
  | 'coming-soon'
  | 'active'
  | 'pending'
  | 'sold'
  | 'leased'
  | 'withdrawn';

export type PropertyClass =
  | 'single-family'
  | 'condo'
  | 'townhouse'
  | 'multi-family'
  | 'land'
  | 'commercial';

export interface MediaAsset {
  src: `/listings/${string}`; // repo-committed, ingest-processed
  w: number; // REQUIRED — CLS-proof
  h: number;
  alt: Localized; // MUST describe what the image actually shows (content-integrity)
  role: 'hero' | 'gallery' | 'floorplan' | 'aerial';
}

/**
 * NOTE: no 'schools' or 'neighborhood-desirability' key exists in this union.
 * Fair-housing hard rule (Part 1.4). Scores are the broker's own professional
 * assessment, per listing — never a third-party rating service (R-08).
 */
export interface ScorecardEntry {
  key:
    | 'location'
    | 'condition'
    | 'layout'
    | 'outdoor'
    | 'build-quality'
    | 'hoa'
    | 'rentability';
  score: 1 | 2 | 3 | 4 | 5;
  note: Localized; // TK_ — broker-authored, per listing
}

export interface Listing {
  id: string; // stable internal id, never reused — e.g. 'L-2026-004'
  slug: string; // locale-INVARIANT (addresses do not translate)
  status: ListingStatus;
  class: PropertyClass; // drives Miami-Dade surtax branch (Part 6.2)
  offerType: 'sale' | 'lease';
  address: {
    line1: string;
    unit?: string;
    city: string;
    state: 'FL';
    zip: string;
  };
  showFullAddress: boolean; // privacy toggle: report + JSON-LD degrade to city/zip
  geo: { lat: number; lng: number };
  price: number; // integer USD (converted to cents at the engine boundary)
  priceHistory?: {
    date: IsoDate;
    price: number;
    kind: 'listed' | 'reduced' | 'sold';
  }[];
  facts: {
    beds: number;
    bathsFull: number;
    bathsHalf: number;
    sqft: number;
    lotSqft?: number;
    yearBuilt: number;
    parkingSpaces?: number;
    hoaMonthly?: number;
    taxesAnnual?: number;
    waterfront?: boolean;
    pool?: boolean;
  };
  media: MediaAsset[]; // media[0].role must be 'hero' (validated)
  scorecard?: ScorecardEntry[]; // optional — module renders null if absent
  summary: Localized; // auto-templated from facts — structural, not copy
  narrative: Localized; // 'TK_LISTING_<ID>_NARRATIVE'
  highlights: Localized[]; // 3–6 fact bullets — TK_
  featureGroups: { group: Localized; items: Localized[] }[];
  neighborhoodId?: string;
  rentEstimateMonthly?: number;
  rentEstimateSource?: string; // zod refine: REQUIRED if estimate present
  marketContext?: {
    // broker-authored or licensed ONLY (R-08)
    areaMedianPricePerSqFt?: SourcedStat;
    areaMedianDom?: SourcedStat;
  };
  faqIds?: string[];
  dates: { listed: IsoDate; sold?: IsoDate };
  soldData?: {
    closedPrice?: number; // optional: disclosure choice
    represented: 'seller' | 'buyer' | 'both';
  };
  virtualTourUrl?: string;
  // DELIBERATELY ABSENT: mlsNumber, IDX feed fields, syndication flags. See R-12.
}

/* ---- Neighborhoods ------------------------------------------------------ */

export interface Neighborhood {
  id: string;
  slug: string; // locale-invariant
  name: Localized;
  county: 'Miami-Dade';
  status: 'stub' | 'published'; // ONLY 'published' builds — the elasticity valve (R-01)
  answer: AnswerBlock;
  overview: Localized; // 'TK_NBHD_<ID>_OVERVIEW'
  stats?: Record<string, SourcedStat>; // StatGrid renders only the keys present
  geo: { lat: number; lng: number };
  relatedPortalIds: PortalId[];
  faqIds: string[];
  heroMedia?: MediaAsset;
  priority: number; // authoring order — UNCONFIRMED D-04
}

/* ---- Site entity -------------------------------------------------------- */

/**
 * Single source for the footer NAP, JSON-LD graph, contact page, email
 * signatures, and the Google Business Profile. grep for the phone number must
 * return exactly one file. GBP is edited to match this, never the reverse.
 */
export interface SiteConfig {
  origin: string; // from config/origin.ts — the ONLY host constant
  entity: {
    legalName: string; // 'TK_LEGAL_NAME'
    tradeName: 'Optimal Realty';
    licenses: {
      role: 'broker' | 'appraiser' | 'cam';
      number: string;
    }[];
    // [{broker,'BK3446865'},{appraiser,'RD8416'},{cam,'CAM64581'}] — confirmed
    phone: string; // TK_ — stored E.164
    email: string; // TK_
    address: { line1: string; city: string; state: 'FL'; zip: string }; // TK_
    sameAs: string[]; // GBP URL, profiles — TK_
    founder: { name: 'Raul Perez'; sameAs?: string[] };
  };
}

/* ---- Leads (wire format; DB shape in supabase/schema.sql) --------------- */

export type LeadSourceType =
  | 'portal_cta'
  | 'tool'
  | 'listing'
  | 'contact'
  | 'booking';

export type LeadIntent =
  | 'sell'
  | 'buy'
  | 'invest'
  | 'lease-out'
  | 'rent'
  | 'valuation'
  | 'booking'
  | 'general';

export interface LeadSubmission {
  locale: Locale;
  portal?: PortalId;
  sourceType: LeadSourceType;
  sourceSlug?: string; // tool slug or listing slug
  route: string; // pathname at submission, includes locale
  intent: LeadIntent;
  fullName: string;
  email: string;
  phone?: string;
  message?: string;
  payload?: Record<string, unknown>; // calculator inputs + outputs snapshot
  utm?: Record<string, string>;
  consentSms: boolean;
  consentMarketing: boolean;
  turnstileToken: string;
  hp?: string; // honeypot — must be empty
  startedAt: number; // epoch ms when the form rendered (time-trap)
}

/* ---- Calculator engine contract (spec in lib/calc/README) --------------- */

export type Basis =
  | 'statutory'
  | 'promulgated-verify'
  | 'unconfirmed-default'
  | 'market-must-update'
  | 'input';

export interface LedgerLine {
  key: string;
  label: Localized;
  amountCents: number;
  basis: Basis;
  flagged?: boolean; // true when basis is unconfirmed/market — UI marks it
}

/**
 * Every engine returns monthly and one-time lines as SEPARATE arrays. No result
 * component may sum across them — a one-time cost inside a recurring total is a
 * real error a user would act on (caught in design review, Part 6.2).
 */
export interface EngineResult {
  monthlyLines: LedgerLine[];
  oneTimeLines: LedgerLine[];
  headline: { key: string; amountCents: number };
  assumptionKeysUsed: string[]; // feeds the AssumptionsTable
}
