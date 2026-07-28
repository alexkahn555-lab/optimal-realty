import type {
  AnswerBlock,
  Faq,
  Listing,
  Localized,
  Neighborhood,
  Portal,
  PortalSubpage,
  ToolDef,
} from '@/lib/types';
import { LISTING_L_2026_001 } from '@/content/listings/l-2026-001';
import { LISTING_L_2026_002 } from '@/content/listings/l-2026-002';
import { LISTING_L_2026_003 } from '@/content/listings/l-2026-003';
import { BUYERS_PORTAL } from '@/content/portals/buyers';
import { INVESTORS_PORTAL } from '@/content/portals/investors';
import { LANDLORDS_PORTAL } from '@/content/portals/landlords';
import { SELLERS_FAQS, SELLERS_PORTAL } from '@/content/portals/sellers';
import { TENANTS_PORTAL } from '@/content/portals/tenants';
import { EXCHANGE_1031_SUBPAGE } from '@/content/subpages/1031-exchange';
import { FIRST_TIME_BUYER_PROGRAMS_SUBPAGE } from '@/content/subpages/first-time-buyer-programs';
import {
  HOME_VALUATION_FAQS,
  HOME_VALUATION_SUBPAGE,
} from '@/content/subpages/home-valuation';
import { PROPERTY_MANAGEMENT_SUBPAGE } from '@/content/subpages/property-management';
import {
  SELLING_PROCESS_FAQS,
  SELLING_PROCESS_SUBPAGE,
} from '@/content/subpages/selling-process';
import { CONDO_ASSESSMENT_TOOL } from '@/content/tools/condo-assessment-exposure';
import { NET_PROCEEDS_FAQS, NET_PROCEEDS_TOOL } from '@/content/tools/net-proceeds';
import { RENTAL_CASHFLOW_TOOL } from '@/content/tools/rental-cash-flow';
import { VACANCY_COST_TOOL } from '@/content/tools/vacancy-cost';

/**
 * ============================================================================
 * CONTENT LOADERS — the `published()` gate for routing, sitemap, nav, llms.txt.
 * ============================================================================
 *
 * "Published" (reference status D3) means: the entity is marked published AND the
 * fields that make its page indexable pass the TK gate in BOTH locales. Since 5b
 * the ANSWER prose — and since 5c the QUESTION and portal TITLE — are
 * mode-sensitive (Part 3.2): in report mode an unfilled field publishes and
 * ships visibly as PlaceholderTK (the preview is the discovery instrument);
 * in strict mode it unpublishes — see answerClean/titleClean. The
 * marker itself never serves: meta falls back to the title (lib/seo/meta.ts) and
 * JSON-LD strips it (pageGraph). Drafts and stubs stay invisible everywhere.
 *
 * Note the division of labor with the non-negotiables: a route may still SHIP with
 * empty `adviceIds` or a TK `decision`/`narrative` (those degrade to null or a
 * visible PlaceholderTK in preview — never block a route). What gates PUBLICATION
 * here is only the indexable surface: the AnswerBlock, title, and localized slug.
 *
 * PHASE 1: no content entities exist. The source collections below are empty by
 * design and MUST stay empty this phase — a near-empty sitemap (home pair only) is
 * correct Foundation behavior, not a gap. Later phases register typed content into
 * these collections; the predicates already encode the gate, so nothing downstream
 * changes.
 */

/* ---- Source collections (Phase 3: seller path · Phase 4a: listings ·
 * Phase 5c: the four remaining portal hubs, in route-map order) ------------- */
const PORTALS: readonly Portal[] = [
  SELLERS_PORTAL,
  BUYERS_PORTAL,
  INVESTORS_PORTAL,
  LANDLORDS_PORTAL,
  TENANTS_PORTAL,
];
const SUBPAGES: readonly PortalSubpage[] = [
  HOME_VALUATION_SUBPAGE,
  SELLING_PROCESS_SUBPAGE,
  // 5d — the three remaining portal subpages, in route-map order.
  FIRST_TIME_BUYER_PROGRAMS_SUBPAGE,
  EXCHANGE_1031_SUBPAGE,
  PROPERTY_MANAGEMENT_SUBPAGE,
];
const TOOLS: readonly ToolDef[] = [
  NET_PROCEEDS_TOOL,
  VACANCY_COST_TOOL,
  RENTAL_CASHFLOW_TOOL,
  CONDO_ASSESSMENT_TOOL,
];
// Phase 4a/4b: three realistic-but-invented fixtures (two active, one sold —
// the test surface). Real listings later replace the fixture files 1:1.
const LISTINGS: readonly Listing[] = [
  LISTING_L_2026_001,
  LISTING_L_2026_002,
  LISTING_L_2026_003,
];
const NEIGHBORHOODS: readonly Neighborhood[] = [];

/** Site-wide FAQ pool (ids are globally unique; enforced by test). */
export const ALL_FAQS: readonly Faq[] = [
  ...SELLERS_FAQS,
  ...HOME_VALUATION_FAQS,
  ...SELLING_PROCESS_FAQS,
  ...NET_PROCEEDS_FAQS,
];

/* ---- TK gate ------------------------------------------------------------- */
const TK = /\bTK_/;

/**
 * A Localized value is clean when NEITHER locale carries a TK_ marker.
 * Exported so degrading modules (listing report) apply the SAME predicate the
 * publish gate uses — one definition of "unfilled" everywhere.
 */
export function localizedClean(value: Localized): boolean {
  return !TK.test(value.en) && !TK.test(value.es);
}

/**
 * The indexable surface of an AnswerBlock, gated per Part 3.2 mode (5b/5c):
 *
 *  - Both the QUESTION (the page's H1) and the ANSWER prose gate only in
 *    strict mode. In report mode (the default, every preview) an unfilled
 *    question or answer publishes and renders VISIBLY as PlaceholderTK — the
 *    preview with visible placeholders is the instrument that gets the client
 *    to respond; unpublishing (the pre-5b behavior for the answer, pre-5c for
 *    the question) 404'd the very page the client needed to review. 5c extends
 *    the 5b answer rule to the question because the four remaining portal hubs
 *    ship with an unfilled question and must still resolve in preview.
 *  - Strict retains the unpublish as defense in depth only: in practice
 *    check-content.mjs fails the prebuild before next build can run, so this
 *    branch never decides a production page's fate.
 *
 * The mode signal (CONTENT_STRICT) is read per call, matching check-content.mjs.
 */
function answerClean(answer: AnswerBlock): boolean {
  if (process.env.CONTENT_STRICT === '1') {
    return localizedClean(answer.question) && localizedClean(answer.answer);
  }
  return true;
}

/**
 * Portal (5c), subpage (5d) and tool (5e) titles are client-facing naming
 * still under review and follow the same mode split: report mode publishes an
 * unfilled title (nav, crumbs, racks and llms.txt fall back to `portalLabel`;
 * metaFor falls back to the site name), strict mode unpublishes.
 */
function titleClean(title: Localized): boolean {
  if (process.env.CONTENT_STRICT === '1') return localizedClean(title);
  return true;
}

/**
 * Display label for a portal or subpage wherever its title is rendered as
 * chrome (site nav, breadcrumbs, llms.txt): the title when filled, else the
 * structural localized slug — route-table data, never a raw marker and never
 * agent-authored prose. Centralized so every render site degrades identically.
 */
export function portalLabel(entity: Pick<Portal, 'slug' | 'title'>): Localized {
  return localizedClean(entity.title) ? entity.title : entity.slug;
}

/* ---- Published accessors ------------------------------------------------- */

export function publishedPortals(): Portal[] {
  return PORTALS.filter(
    (p) =>
      p.status === 'published' &&
      localizedClean(p.slug) &&
      titleClean(p.title) &&
      answerClean(p.answer)
  );
}

export function publishedSubpages(): PortalSubpage[] {
  return SUBPAGES.filter(
    (s) =>
      s.status === 'published' &&
      localizedClean(s.slug) &&
      titleClean(s.title) &&
      answerClean(s.answer)
  );
}

export function publishedTools(): ToolDef[] {
  return TOOLS.filter(
    (tool) =>
      tool.status === 'published' &&
      localizedClean(tool.slug) &&
      titleClean(tool.title) &&
      answerClean(tool.answer)
  );
}

/**
 * Listing data-integrity validation (Part 8.3 / D2): media[0] MUST be the hero
 * and every asset MUST carry explicit positive w/h (CLS-proof) and a
 * /listings/-rooted src. A malformed listing is an authoring error that fails
 * the BUILD (publishedListings runs on every routed surface), never a listing
 * that silently drops out.
 */
export function validateListingMedia(listing: Listing): void {
  if (listing.media.length === 0) {
    throw new Error(`listing ${listing.id}: media must not be empty`);
  }
  if (listing.media[0]?.role !== 'hero') {
    throw new Error(`listing ${listing.id}: media[0].role must be 'hero'`);
  }
  for (const asset of listing.media) {
    if (!Number.isInteger(asset.w) || asset.w <= 0 || !Number.isInteger(asset.h) || asset.h <= 0) {
      throw new Error(
        `listing ${listing.id}: media asset ${asset.src} needs explicit positive integer w/h`
      );
    }
    if (!asset.src.startsWith('/listings/')) {
      throw new Error(`listing ${listing.id}: media src must live under /listings/`);
    }
  }
}

/**
 * Listing publish gate (D3 semantics adapted to listings, which carry no
 * AnswerBlock): visible only when the INDEXABLE surface — the auto-templated
 * `summary` and every media alt — is TK-clean in both locales and the status
 * is not `withdrawn`. A TK `narrative` degrades to a visible placeholder in
 * preview and never gates the URL (client copy never blocks a route).
 */
export function isPublishedListing(listing: Listing): boolean {
  return (
    listing.status !== 'withdrawn' &&
    localizedClean(listing.summary) &&
    listing.media.every((asset) => localizedClean(asset.alt))
  );
}

export function publishedListings(): Listing[] {
  for (const listing of LISTINGS) validateListingMedia(listing);
  return LISTINGS.filter(isPublishedListing);
}

/**
 * Status predicates — exported so the active↔sold flip (a ONE-FIELD edit that
 * moves a listing between indexes and adds/drops its Offer node) is testable
 * on listing variants without re-registering content.
 */
export function isMarketed(listing: Listing): boolean {
  return (
    listing.status === 'active' ||
    listing.status === 'coming-soon' ||
    listing.status === 'pending'
  );
}

export function isSoldArchived(listing: Listing): boolean {
  return listing.status === 'sold' || listing.status === 'leased';
}

/**
 * Discovery predicate (dispatch 4c): fixtures stay ROUTABLE (their pages
 * exist for template review, behind a visible demonstration banner) but are
 * EXCLUDED from every discovery surface — sitemap, llms.txt, OG images. A
 * demonstration listing that search engines or answer engines can find reads
 * as a real property or transaction, which the content-integrity rules forbid.
 */
export function isDiscoverable(listing: Listing): boolean {
  return listing.isFixture !== true;
}

/** Currently-marketed inventory: the active index, report routes, Offer nodes. */
export function activeListings(): Listing[] {
  return publishedListings().filter(isMarketed);
}

/**
 * Closed transactions (Phase 4b sold view). Sold detail pages keep their URLs
 * permanently but emit WebPage — never RealEstateListing/Offer (an offer for
 * unavailable property is misleading structured data).
 */
export function soldListings(): Listing[] {
  return publishedListings().filter(isSoldArchived);
}

/**
 * Resolve a page's faqIds against its co-located FAQ pool, keeping only entries
 * whose ANSWER is TK-clean in both locales (questions are structural; an
 * unanswered FAQ simply does not render — the max-8 cap lives in FaqSection).
 */
export function resolvedFaqs(
  pool: readonly Faq[],
  ids: readonly string[]
): { question: Localized; answer: Localized }[] {
  return ids
    .map((id) => pool.find((faq) => faq.id === id))
    .filter((faq): faq is Faq => faq !== undefined)
    .filter((faq) => localizedClean(faq.question) && localizedClean(faq.answer))
    .map(({ question, answer }) => ({ question, answer }));
}

export function publishedNeighborhoods(): Neighborhood[] {
  return NEIGHBORHOODS.filter(
    (n) =>
      n.status === 'published' &&
      localizedClean(n.name) &&
      answerClean(n.answer)
  );
}
