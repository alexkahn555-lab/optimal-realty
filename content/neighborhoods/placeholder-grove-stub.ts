import type { Neighborhood } from '@/lib/types';

/**
 * STUB DEMONSTRATION FIXTURE (7a) — proves the R-01 elasticity valve: a stub
 * is NOT a draft that renders empty, it does not exist as a route. This
 * entity must never appear in generateStaticParams, the sitemap, llms.txt,
 * the index, or any internal link — its URL 404s (enforced by test). The
 * slug is obviously invented; prose fields are placeholder markers.
 */

export const PLACEHOLDER_GROVE_STUB_NEIGHBORHOOD: Neighborhood = {
  id: 'placeholder-grove',
  slug: 'placeholder-grove-stub',
  name: {
    en: 'TK_NBHD_PLACEHOLDER_GROVE_NAME',
    es: 'TK_NBHD_PLACEHOLDER_GROVE_NAME',
  },
  county: 'Miami-Dade',
  status: 'stub',
  answer: {
    question: {
      en: 'TK_NBHD_PLACEHOLDER_GROVE_QUESTION',
      es: 'TK_NBHD_PLACEHOLDER_GROVE_QUESTION',
    },
    answer: {
      en: 'TK_NBHD_PLACEHOLDER_GROVE_ANSWER',
      es: 'TK_NBHD_PLACEHOLDER_GROVE_ANSWER',
    },
    updated: '2026-07-28',
  },
  overview: {
    en: 'TK_NBHD_PLACEHOLDER_GROVE_OVERVIEW',
    es: 'TK_NBHD_PLACEHOLDER_GROVE_OVERVIEW',
  },
  geo: { lat: 25.7, lng: -80.3 },
  relatedPortalIds: [],
  faqIds: [],
  priority: 2,
  isFixture: true,
};
