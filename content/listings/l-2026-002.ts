import type { Listing } from '@/lib/types';

/**
 * FIXTURE LISTING 2 — condo, privacy-degraded (showFullAddress: false).
 * Exercises the privacy toggle end to end: report DOM, cards, breadcrumbs, and
 * the JSON-LD PostalAddress all degrade to city/zip, and GeoCoordinates are
 * withheld (a precise pin would defeat address privacy).
 *
 * Same content-integrity rules as fixture 1: "200 Placeholder Way" does not
 * exist; status 'active' only; labeled placeholder graphics with honest alt
 * text; narrative is a placeholder marker until broker-authored. The slug
 * deliberately carries NO street address (authoring rule: a
 * showFullAddress:false listing must not leak its address through the URL)
 * and reads as a fixture.
 *
 * `summary` is auto-templated from the facts. Because this listing hides its
 * address, the authoring template uses the city/zip form — the summary is an
 * indexable surface and must not leak line1/unit.
 */
export const LISTING_L_2026_002: Listing = {
  id: 'L-2026-002',
  slug: 'fixture-condo-miami-33131',
  status: 'active',
  class: 'condo',
  offerType: 'sale',
  address: {
    line1: '200 Placeholder Way',
    unit: '1204',
    city: 'Miami',
    state: 'FL',
    zip: '33131',
  },
  showFullAddress: false,
  geo: { lat: 25.765, lng: -80.1936 },
  price: 589_000,
  facts: {
    beds: 2,
    bathsFull: 2,
    bathsHalf: 0,
    sqft: 1_180,
    yearBuilt: 2016,
    parkingSpaces: 1,
    hoaMonthly: 950,
    taxesAnnual: 8_640,
  },
  media: [
    {
      src: '/listings/L-2026-002/hero-01.jpg',
      w: 2000,
      h: 1333,
      alt: {
        en: 'Solid-color placeholder graphic labeled "fixture listing — placeholder, not a photograph" (hero slot). No real property is shown.',
        es: 'Gráfico de relleno de color sólido con la etiqueta "fixture listing — placeholder, not a photograph" (imagen principal). No se muestra ninguna propiedad real.',
      },
      role: 'hero',
    },
    {
      src: '/listings/L-2026-002/gallery-01.jpg',
      w: 2000,
      h: 1333,
      alt: {
        en: 'Solid-color placeholder graphic labeled as gallery slot 01 for a fixture listing. Not a photograph.',
        es: 'Gráfico de relleno de color sólido etiquetado como espacio de galería 01 de una propiedad ficticia de prueba. No es una fotografía.',
      },
      role: 'gallery',
    },
    {
      src: '/listings/L-2026-002/floorplan-01.jpg',
      w: 2000,
      h: 1500,
      alt: {
        en: 'Placeholder graphic standing in for a floor plan of a fixture listing. Not a real floor plan.',
        es: 'Gráfico de relleno en lugar de un plano de planta de una propiedad ficticia de prueba. No es un plano real.',
      },
      role: 'floorplan',
    },
  ],
  summary: {
    en:
      'Condominium in Miami, FL 33131 — $589,000, 2 bedrooms, 2 baths, 1,180 ' +
      'square feet, built in 2016.',
    es:
      'Condominio en Miami, FL 33131 — $589,000, 2 habitaciones, 2 baños, ' +
      '1,180 pies cuadrados, construido en 2016.',
  },
  narrative: {
    en: 'TK_LISTING_L_2026_002_NARRATIVE',
    es: 'TK_LISTING_L_2026_002_NARRATIVE',
  },
  highlights: [],
  featureGroups: [],
  dates: { listed: '2026-07-02' },
};
