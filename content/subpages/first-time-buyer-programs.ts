import type { PortalSubpage } from '@/lib/types';

/**
 * BUYERS → FIRST-TIME BUYER PROGRAMS subpage — registered in dispatch 5d
 * (Part 5 route map row 10). Structure authored in-house; the title, question
 * and answer are licensed professional counsel and ship as placeholder
 * markers until the client supplies them (report mode publishes them visibly,
 * strict mode unpublishes — Part 3.2). Related tools stay empty until the
 * buyer calculators exist. `slug` must match SUBPAGE_SEG in lib/seo/href.ts —
 * enforced by test.
 */

export const FIRST_TIME_BUYER_PROGRAMS_SUBPAGE: PortalSubpage = {
  id: 'buyers-first-time-buyer-programs',
  portalId: 'buyers',
  slug: {
    en: 'first-time-buyer-programs',
    es: 'programas-para-compradores-primerizos',
  },
  title: {
    en: 'TK_SUBPAGE_FIRST_TIME_BUYER_PROGRAMS_TITLE',
    es: 'TK_SUBPAGE_FIRST_TIME_BUYER_PROGRAMS_TITLE',
  },
  answer: {
    question: {
      en: 'TK_SUBPAGE_FIRST_TIME_BUYER_PROGRAMS_QUESTION',
      es: 'TK_SUBPAGE_FIRST_TIME_BUYER_PROGRAMS_QUESTION',
    },
    answer: {
      en: 'TK_SUBPAGE_FIRST_TIME_BUYER_PROGRAMS_ANSWER',
      es: 'TK_SUBPAGE_FIRST_TIME_BUYER_PROGRAMS_ANSWER',
    },
    updated: '2026-07-28',
  },
  adviceIds: [], // client counsel never blocks a route — AdviceList renders null
  relatedToolIds: [], // buyer calculators do not exist yet
  faqIds: [],
  status: 'published',
};
