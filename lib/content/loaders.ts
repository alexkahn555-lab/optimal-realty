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
import { SELLERS_PORTAL } from '@/content/portals/sellers';
import { HOME_VALUATION_SUBPAGE } from '@/content/subpages/home-valuation';
import { SELLING_PROCESS_SUBPAGE } from '@/content/subpages/selling-process';
import { NET_PROCEEDS_TOOL } from '@/content/tools/net-proceeds';

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

/* ---- Source collections (Phase 3: seller path registered) ----------------- */
const PORTALS: readonly Portal[] = [SELLERS_PORTAL];
const SUBPAGES: readonly PortalSubpage[] = [
  HOME_VALUATION_SUBPAGE,
  SELLING_PROCESS_SUBPAGE,
];
const TOOLS: readonly ToolDef[] = [NET_PROCEEDS_TOOL];
const LISTINGS: readonly Listing[] = [];
const NEIGHBORHOODS: readonly Neighborhood[] = [];

/* ---- TK gate ------------------------------------------------------------- */
const TK = /\bTK_/;

/** A Localized value is clean when NEITHER locale carries a TK_ marker. */
function localizedClean(value: Localized): boolean {
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
 * A listing is visible when it is not a draft-equivalent state. Listings carry no
 * AnswerBlock; a TK narrative degrades to a visible placeholder in preview and does
 * not gate the URL. `withdrawn` listings are removed from public routing.
 */
export function publishedListings(): Listing[] {
  return LISTINGS.filter((l) => l.status !== 'withdrawn');
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
