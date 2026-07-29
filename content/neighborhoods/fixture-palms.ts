import type { Neighborhood } from '@/lib/types';

/**
 * PUBLISHED DEMONSTRATION FIXTURE (7a) — exercises the full neighborhood
 * template behind the visible demonstration banner. The slug is obviously
 * invented ("fixture-palms-example") and could not be mistaken for a real
 * Miami-Dade neighborhood; every prose field is a placeholder marker; every
 * stat is a plainly invented figure whose source string SAYS it is invented.
 * Excluded from sitemap, llms.txt, the index, and every link (isFixture, the
 * 4c convention). Real instances are client data (D-04) — never authored here.
 */

export const FIXTURE_PALMS_NEIGHBORHOOD: Neighborhood = {
  id: 'fixture-palms',
  slug: 'fixture-palms-example',
  name: { en: 'TK_NBHD_FIXTURE_PALMS_NAME', es: 'TK_NBHD_FIXTURE_PALMS_NAME' },
  county: 'Miami-Dade',
  status: 'published',
  answer: {
    question: {
      en: 'TK_NBHD_FIXTURE_PALMS_QUESTION',
      es: 'TK_NBHD_FIXTURE_PALMS_QUESTION',
    },
    answer: {
      en: 'TK_NBHD_FIXTURE_PALMS_ANSWER',
      es: 'TK_NBHD_FIXTURE_PALMS_ANSWER',
    },
    updated: '2026-07-28',
  },
  overview: {
    en: 'TK_NBHD_FIXTURE_PALMS_OVERVIEW',
    es: 'TK_NBHD_FIXTURE_PALMS_OVERVIEW',
  },
  stats: {
    medianSalePrice: {
      value: 987_654,
      unit: 'usd',
      asOf: '2026-07-28',
      source: 'Invented fixture figure — template review only, not a market source',
    },
    medianPricePerSqFt: {
      value: 543,
      unit: 'usd_sqft',
      asOf: '2026-07-28',
      source: 'Invented fixture figure — template review only, not a market source',
    },
    medianDom: {
      value: 43,
      unit: 'days',
      asOf: '2026-07-28',
      source: 'Invented fixture figure — template review only, not a market source',
    },
  },
  geo: { lat: 25.75, lng: -80.25 },
  relatedPortalIds: ['buyers'],
  faqIds: [],
  priority: 1,
  isFixture: true,
};
