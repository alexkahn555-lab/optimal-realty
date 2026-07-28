import type { PortalSubpage } from '@/lib/types';

/**
 * INVESTORS → 1031 EXCHANGE subpage — registered in dispatch 5d (Part 5 route
 * map row 11). Structure authored in-house; the title, question and answer
 * are licensed professional counsel and ship as placeholder markers until the
 * client supplies them (report mode publishes them visibly, strict mode
 * unpublishes — Part 3.2). Related tools stay empty until the investor
 * calculators exist. `slug` must match SUBPAGE_SEG in lib/seo/href.ts —
 * enforced by test.
 */

export const EXCHANGE_1031_SUBPAGE: PortalSubpage = {
  id: 'investors-1031-exchange',
  portalId: 'investors',
  slug: {
    en: '1031-exchange',
    es: 'intercambio-1031',
  },
  title: {
    en: 'TK_SUBPAGE_1031_EXCHANGE_TITLE',
    es: 'TK_SUBPAGE_1031_EXCHANGE_TITLE',
  },
  answer: {
    question: {
      en: 'TK_SUBPAGE_1031_EXCHANGE_QUESTION',
      es: 'TK_SUBPAGE_1031_EXCHANGE_QUESTION',
    },
    answer: {
      en: 'TK_SUBPAGE_1031_EXCHANGE_ANSWER',
      es: 'TK_SUBPAGE_1031_EXCHANGE_ANSWER',
    },
    updated: '2026-07-28',
  },
  adviceIds: [], // client counsel never blocks a route — AdviceList renders null
  relatedToolIds: [], // investor calculators do not exist yet
  faqIds: [],
  status: 'published',
};
