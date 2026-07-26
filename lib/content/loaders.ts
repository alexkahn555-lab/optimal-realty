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
import { SELLERS_FAQS, SELLERS_PORTAL } from '@/content/portals/sellers';
import {
  HOME_VALUATION_FAQS,
  HOME_VALUATION_SUBPAGE,
} from '@/content/subpages/home-valuation';
import {
  SELLING_PROCESS_FAQS,
  SELLING_PROCESS_SUBPAGE,
} from '@/content/subpages/selling-process';
import { NET_PROCEEDS_FAQS, NET_PROCEEDS_TOOL } from '@/content/tools/net-proceeds';

/**
 * ============================================================================
 * CONTENT LOADERS — the `published()` gate for routing, sitemap, nav, llms.txt.
 * ============================================================================
 *
 * "Published" (reference status D3) means: the entity is marked published AND the
 * fields that make its page indexable pass the TK gate in BOTH locales. A page
 * whose answer still carries a `TK_` marker must never reach params, the sitemap,
 * nav, or llms.txt — an unfilled answer is not something to serve as structured
 * data or a crawlable URL. Drafts and stubs are invisible everywhere routing looks.
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

/* ---- Source collections (Phase 3: seller path · Phase 4a: listings) ------- */
const PORTALS: readonly Portal[] = [SELLERS_PORTAL];
const SUBPAGES: readonly PortalSubpage[] = [
  HOME_VALUATION_SUBPAGE,
  SELLING_PROCESS_SUBPAGE,
];
const TOOLS: readonly ToolDef[] = [NET_PROCEEDS_TOOL];
// Phase 4a: two realistic-but-invented fixtures (the test surface). Real
// listings later replace the fixture files with same-shape data files.
const LISTINGS: readonly Listing[] = [LISTING_L_2026_001, LISTING_L_2026_002];
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

/** The indexable surface of an AnswerBlock (H1 + answer prose) is TK-clean. */
function answerClean(answer: AnswerBlock): boolean {
  return localizedClean(answer.question) && localizedClean(answer.answer);
}

/* ---- Published accessors ------------------------------------------------- */

export function publishedPortals(): Portal[] {
  return PORTALS.filter(
    (p) =>
      p.status === 'published' &&
      localizedClean(p.slug) &&
      localizedClean(p.title) &&
      answerClean(p.answer)
  );
}

export function publishedSubpages(): PortalSubpage[] {
  return SUBPAGES.filter(
    (s) =>
      s.status === 'published' &&
      localizedClean(s.slug) &&
      localizedClean(s.title) &&
      answerClean(s.answer)
  );
}

export function publishedTools(): ToolDef[] {
  return TOOLS.filter(
    (tool) =>
      tool.status === 'published' &&
      localizedClean(tool.slug) &&
      localizedClean(tool.title) &&
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
 * Currently-marketed listings — the inventory the index, report routes,
 * sitemap, and llms.txt surface this phase. The sold archive (`sold`/`leased`)
 * is a Phase 4b view; until it exists, sold listings publish nowhere.
 */
export function activeListings(): Listing[] {
  return publishedListings().filter(
    (l) => l.status === 'active' || l.status === 'coming-soon' || l.status === 'pending'
  );
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
