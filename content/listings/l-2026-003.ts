import type { Listing } from '@/lib/types';

/**
 * FIXTURE LISTING 3 — the SOLD fixture (Phase 4b: the sold view needs one).
 *
 * REALISTIC-BUT-INVENTED, and it must read that way even harder than the
 * active fixtures: a sold listing sits where PROOF of a real transaction
 * would sit, and no fixture may ever imply a transaction the broker didn't
 * make. "300 Example Court" does not exist; the street name signals fixture,
 * the media are labeled placeholder graphics, and every figure (list price,
 * closed price, dates) is invented shape-data for the sold template. Real
 * sold listings replace this file 1:1.
 *
 * NO scorecard: scores are the broker's professional assessment, and a
 * fabricated professional assessment cannot exist in this codebase even on a
 * fixture (Part 1.4 / dispatch 4c). M7 renders null here by contract; its
 * rendering is proven in tests against an inline-constructed scorecard.
 * The status flip active↔sold is a one-field edit: it moves this listing
 * between the active and sold indexes and adds/drops the Offer node
 * (verified in tests).
 */
export const LISTING_L_2026_003: Listing = {
  id: 'L-2026-003',
  slug: '300-example-court-palmetto-bay',
  isFixture: true,
  status: 'sold',
  class: 'townhouse',
  offerType: 'sale',
  address: {
    line1: '300 Example Court',
    city: 'Palmetto Bay',
    state: 'FL',
    zip: '33157',
  },
  showFullAddress: true,
  geo: { lat: 25.6215, lng: -80.3245 },
  price: 765_000,
  priceHistory: [
    { date: '2026-02-12', price: 765_000, kind: 'listed' },
    { date: '2026-05-29', price: 742_500, kind: 'sold' },
  ],
  facts: {
    beds: 3,
    bathsFull: 2,
    bathsHalf: 1,
    sqft: 1_920,
    yearBuilt: 2007,
    parkingSpaces: 2,
    hoaMonthly: 310,
    taxesAnnual: 9_480,
  },
  media: [
    {
      src: '/listings/L-2026-003/hero-01.jpg',
      w: 2000,
      h: 1333,
      alt: {
        en: 'Solid-color placeholder graphic labeled "fixture listing — placeholder, not a photograph" (hero slot). No real property is shown.',
        es: 'Gráfico de relleno de color sólido con la etiqueta "fixture listing — placeholder, not a photograph" (imagen principal). No se muestra ninguna propiedad real.',
      },
      role: 'hero',
    },
    {
      src: '/listings/L-2026-003/gallery-01.jpg',
      w: 2000,
      h: 1333,
      alt: {
        en: 'Solid-color placeholder graphic labeled as gallery slot 01 for a fixture listing. Not a photograph.',
        es: 'Gráfico de relleno de color sólido etiquetado como espacio de galería 01 de una propiedad ficticia de prueba. No es una fotografía.',
      },
      role: 'gallery',
    },
  ],
  summary: {
    en:
      'Townhouse at 300 Example Court, Palmetto Bay, FL 33157 — 3 bedrooms, ' +
      '2 full and 1 half baths, 1,920 square feet, built in 2007. Sold May 2026.',
    es:
      'Townhouse en 300 Example Court, Palmetto Bay, FL 33157 — 3 habitaciones, ' +
      '2 baños completos y 1 medio baño, 1,920 pies cuadrados, construido en ' +
      '2007. Vendido en mayo de 2026.',
  },
  narrative: {
    en: 'TK_LISTING_L_2026_003_NARRATIVE',
    es: 'TK_LISTING_L_2026_003_NARRATIVE',
  },
  highlights: [],
  featureGroups: [],
  dates: { listed: '2026-02-12', sold: '2026-05-29' },
  soldData: { closedPrice: 742_500, represented: 'seller' },
};
