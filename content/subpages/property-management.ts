import type { PortalSubpage } from '@/lib/types';

/**
 * LANDLORDS → PROPERTY MANAGEMENT subpage — registered in dispatch 5d (Part 5
 * route map row 12). Structure authored in-house; the title, question and
 * answer are licensed professional counsel and ship as placeholder markers
 * until the client supplies them (report mode publishes them visibly, strict
 * mode unpublishes — Part 3.2). Related tools stay empty until the landlord
 * calculators exist. `slug` must match SUBPAGE_SEG in lib/seo/href.ts —
 * enforced by test.
 */

export const PROPERTY_MANAGEMENT_SUBPAGE: PortalSubpage = {
  id: 'landlords-property-management',
  portalId: 'landlords',
  slug: {
    en: 'property-management',
    es: 'administracion-de-propiedades',
  },
  title: {
    en: 'TK_SUBPAGE_PROPERTY_MANAGEMENT_TITLE',
    es: 'TK_SUBPAGE_PROPERTY_MANAGEMENT_TITLE',
  },
  answer: {
    question: {
      en: 'TK_SUBPAGE_PROPERTY_MANAGEMENT_QUESTION',
      es: 'TK_SUBPAGE_PROPERTY_MANAGEMENT_QUESTION',
    },
    answer: {
      en: 'TK_SUBPAGE_PROPERTY_MANAGEMENT_ANSWER',
      es: 'TK_SUBPAGE_PROPERTY_MANAGEMENT_ANSWER',
    },
    updated: '2026-07-28',
  },
  adviceIds: [], // client counsel never blocks a route — AdviceList renders null
  relatedToolIds: [], // landlord calculators do not exist yet
  faqIds: [],
  status: 'published',
};
