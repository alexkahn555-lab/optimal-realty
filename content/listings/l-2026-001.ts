import type { Listing } from '@/lib/types';

/**
 * FIXTURE LISTING 1 — single-family, full address shown (showFullAddress: true).
 *
 * REALISTIC-BUT-INVENTED (content-integrity hard rule): "100 Fixture Boulevard"
 * does not exist; the street name itself signals fixture while the city/zip and
 * every field SHAPE stay realistic so templates are exercised honestly. Status
 * is 'active' ONLY — a sold/leased fixture would imply a real transaction the
 * broker didn't make, so a fixture must never sit in a proof position. Media
 * are labeled placeholder graphics (visibly not photographs) and the alt text
 * describes the placeholder itself, never an imagined property. geo is a
 * city-center approximation, not a parcel.
 *
 * `summary` is auto-templated from the facts (structural sentence — price,
 * class, beds, baths, sqft, city), generated at authoring, NOT free copy.
 * `narrative` is broker-authored prose and stays a placeholder marker until
 * the client supplies it (the report degrades by omission). Real listings
 * replace this file with a data file of the same shape — no template change.
 */
export const LISTING_L_2026_001: Listing = {
  id: 'L-2026-001',
  slug: '100-fixture-boulevard-coral-gables',
  status: 'active',
  class: 'single-family',
  offerType: 'sale',
  address: {
    line1: '100 Fixture Boulevard',
    city: 'Coral Gables',
    state: 'FL',
    zip: '33134',
  },
  showFullAddress: true,
  geo: { lat: 25.7215, lng: -80.2684 },
  price: 1_285_000,
  // Two events so the temporal price-history chart (M5) renders on this
  // fixture; the condo fixture has none and demonstrates degrade-by-omission.
  priceHistory: [
    { date: '2026-06-18', price: 1_315_000, kind: 'listed' },
    { date: '2026-07-10', price: 1_285_000, kind: 'reduced' },
  ],
  facts: {
    beds: 4,
    bathsFull: 3,
    bathsHalf: 1,
    sqft: 2_640,
    lotSqft: 7_500,
    yearBuilt: 1998,
    parkingSpaces: 2,
    taxesAnnual: 14_820,
    pool: true,
  },
  media: [
    {
      src: '/listings/L-2026-001/hero-01.jpg',
      w: 2000,
      h: 1333,
      alt: {
        en: 'Solid-color placeholder graphic labeled "fixture listing — placeholder, not a photograph" (hero slot). No real property is shown.',
        es: 'Gráfico de relleno de color sólido con la etiqueta "fixture listing — placeholder, not a photograph" (imagen principal). No se muestra ninguna propiedad real.',
      },
      role: 'hero',
    },
    {
      src: '/listings/L-2026-001/gallery-01.jpg',
      w: 2000,
      h: 1333,
      alt: {
        en: 'Solid-color placeholder graphic labeled as gallery slot 01 for a fixture listing. Not a photograph.',
        es: 'Gráfico de relleno de color sólido etiquetado como espacio de galería 01 de una propiedad ficticia de prueba. No es una fotografía.',
      },
      role: 'gallery',
    },
    {
      src: '/listings/L-2026-001/gallery-02.jpg',
      w: 2000,
      h: 1333,
      alt: {
        en: 'Solid-color placeholder graphic labeled as gallery slot 02 for a fixture listing. Not a photograph.',
        es: 'Gráfico de relleno de color sólido etiquetado como espacio de galería 02 de una propiedad ficticia de prueba. No es una fotografía.',
      },
      role: 'gallery',
    },
    {
      src: '/listings/L-2026-001/floorplan-01.jpg',
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
      'Single-family home at 100 Fixture Boulevard, Coral Gables, FL 33134 — ' +
      '$1,285,000, 4 bedrooms, 3 full and 1 half baths, 2,640 square feet, ' +
      'built in 1998.',
    es:
      'Casa unifamiliar en 100 Fixture Boulevard, Coral Gables, FL 33134 — ' +
      '$1,285,000, 4 habitaciones, 3 baños completos y 1 medio baño, 2,640 ' +
      'pies cuadrados, construida en 1998.',
  },
  narrative: {
    en: 'TK_LISTING_L_2026_001_NARRATIVE',
    es: 'TK_LISTING_L_2026_001_NARRATIVE',
  },
  highlights: [],
  // Structural amenity labels (fact-shaped fixture data, same class as
  // beds/baths — not broker prose). Replaced per real listing.
  featureGroups: [
    {
      group: { en: 'Interior', es: 'Interior' },
      items: [
        { en: 'Impact-resistant windows', es: 'Ventanas resistentes a impactos' },
        { en: 'Quartz kitchen counters', es: 'Encimeras de cuarzo en la cocina' },
        { en: 'Split floor plan', es: 'Distribución dividida' },
      ],
    },
    {
      group: { en: 'Exterior', es: 'Exterior' },
      items: [
        { en: 'Heated pool', es: 'Piscina climatizada' },
        { en: 'Covered terrace', es: 'Terraza cubierta' },
        { en: 'Two-car garage', es: 'Garaje para dos autos' },
      ],
    },
  ],
  dates: { listed: '2026-06-18' },
};
