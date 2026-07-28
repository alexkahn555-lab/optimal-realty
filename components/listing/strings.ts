import type { ListingStatus, Localized } from '@/lib/types';

/**
 * Listing-module chrome strings (Phase 4a). Chrome is authorable in-house —
 * broker counsel, listing narrative, and FAQ answers are NOT and never appear
 * here (those live in content/ as TK_ markers). Co-located with the listing
 * modules because content/ui-strings.ts is outside this dispatch's allowlist;
 * shared calc chrome (monthly/one-time headings, estimate tag, basis labels)
 * is REUSED from content/ui-strings.ts, not duplicated.
 *
 * ES review flag (completion report): neutral Latin American Spanish authored
 * in-house, same review path as the Phase 1–3 chrome.
 */

/** Marketed-status labels. Sold/leased labels belong to the Phase 4b archive. */
export const LISTING_STATUS_LABEL: Partial<Record<ListingStatus, Localized>> = {
  'coming-soon': { en: 'Coming soon', es: 'Próximamente' },
  active: { en: 'Active', es: 'Activa' },
  pending: { en: 'Pending', es: 'Pendiente' },
};

export const LISTING_UI = {
  index: {
    title: { en: 'Listings', es: 'Propiedades' },
    intro: {
      en:
        'Properties represented by Optimal Realty in Miami-Dade County — own ' +
        'listings only, published in English and Spanish.',
      es:
        'Propiedades representadas por Optimal Realty en el condado de ' +
        'Miami-Dade — solo propiedades propias, publicadas en inglés y español.',
    },
  },

  /* ---- Identity header (M2) ---------------------------------------------- */
  identity: {
    // Rendered where the street line would sit when showFullAddress is false.
    addressWithheld: { en: 'Address available on request', es: 'Dirección disponible a solicitud' },
  },

  /* ---- Four-fact mono rail abbreviations (M2) ----------------------------- */
  rail: {
    beds: { en: 'bd', es: 'hab' },
    baths: { en: 'ba', es: 'baños' },
    sqft: { en: 'sq ft', es: 'ft²' },
    built: { en: 'built', es: 'constr.' },
  },

  /* ---- Media gallery (M4) ------------------------------------------------- */
  gallery: {
    heading: { en: 'Media', es: 'Galería' },
  },

  /* ---- Cost breakdown (M6) ------------------------------------------------ */
  costs: {
    heading: { en: 'Cost breakdown', es: 'Desglose de costos' },
    monthlyTax: {
      en: 'Property taxes (annual ÷ 12)',
      es: 'Impuesto predial (anual ÷ 12)',
    },
    hoaDues: { en: 'HOA dues', es: 'Cuota de la asociación' },
    methodNote: {
      en:
        'One-time closing figures follow the seller net-proceeds method with ' +
        'unverified defaults marked †. Every figure is editable in the calculator.',
      es:
        'Los costos únicos al cierre siguen el método de ganancia neta del ' +
        'vendedor con valores predeterminados sin verificar marcados con †. ' +
        'Todas las cifras son editables en la calculadora.',
    },
    adjust: {
      en: 'Adjust assumptions in the calculator',
      es: 'Ajustar los supuestos en la calculadora',
    },
  },

  /* ---- Facts table (M8) ---------------------------------------------------- */
  facts: {
    heading: { en: 'Property facts', es: 'Datos de la propiedad' },
    beds: { en: 'Bedrooms', es: 'Habitaciones' },
    bathsFull: { en: 'Full baths', es: 'Baños completos' },
    bathsHalf: { en: 'Half baths', es: 'Medios baños' },
    sqft: { en: 'Interior area', es: 'Área interior' },
    lotSqft: { en: 'Lot area', es: 'Área del lote' },
    yearBuilt: { en: 'Year built', es: 'Año de construcción' },
    parkingSpaces: { en: 'Parking spaces', es: 'Estacionamientos' },
    hoaMonthly: { en: 'HOA dues (monthly)', es: 'Cuota mensual de la asociación' },
    taxesAnnual: { en: 'Property taxes (annual)', es: 'Impuesto predial (anual)' },
    waterfront: { en: 'Waterfront', es: 'Frente al agua' },
    pool: { en: 'Pool', es: 'Piscina' },
    yes: { en: 'Yes', es: 'Sí' },
  },

  /* ---- Disclosure block (M14 zone) ----------------------------------------- */
  disclosure: {
    heading: { en: 'Disclosures', es: 'Divulgaciones' },
  },

  /* ==========================================================================
   * Phase 4b — remaining report modules, sold view, lightbox, map facade.
   * ========================================================================== */

  /* ---- Price history (M5) -------------------------------------------------- */
  priceHistory: {
    heading: { en: 'Price history', es: 'Historial de precios' },
    listed: { en: 'Listed', es: 'Listado' },
    reduced: { en: 'Reduced', es: 'Reducido' },
    sold: { en: 'Sold', es: 'Vendido' },
  },

  /* ---- Scorecard (M7) — scores are the broker's own assessment ------------- */
  scorecard: {
    heading: { en: "Broker's scorecard", es: 'Evaluación del corredor' },
    // The scale note is a DISCLAIMER (what the scores are and are not) —
    // attorney-reviewed copy, never agent-written (4c). Renders as a visible
    // placeholder in preview until supplied.
    scaleNote: {
      en: 'TK_SCORECARD_SCALE_NOTE',
      es: 'TK_SCORECARD_SCALE_NOTE',
    },
    location: { en: 'Location', es: 'Ubicación' },
    condition: { en: 'Condition', es: 'Estado' },
    layout: { en: 'Layout', es: 'Distribución' },
    outdoor: { en: 'Outdoor space', es: 'Espacio exterior' },
    'build-quality': { en: 'Build quality', es: 'Calidad de construcción' },
    hoa: { en: 'Association', es: 'Asociación' },
    rentability: { en: 'Rentability', es: 'Rentabilidad' },
  },

  /* ---- Feature groups (M9) -------------------------------------------------- */
  features: {
    heading: { en: 'Features', es: 'Características' },
  },

  /* ---- Map facade (M10) ----------------------------------------------------- */
  map: {
    heading: { en: 'Location', es: 'Ubicación' },
    load: { en: 'Load interactive map', es: 'Cargar mapa interactivo' },
    source: {
      en: 'Opens an OpenStreetMap embed',
      es: 'Abre un mapa de OpenStreetMap',
    },
    iframeTitle: { en: 'Interactive map', es: 'Mapa interactivo' },
  },

  /* ---- Neighborhood context (M11) ------------------------------------------- */
  neighborhood: {
    heading: { en: 'Neighborhood', es: 'Vecindario' },
  },

  /* ---- Narrative + highlights (M12) ----------------------------------------- */
  narrative: {
    heading: { en: 'About this property', es: 'Sobre esta propiedad' },
    highlights: { en: 'Highlights', es: 'Destacados' },
  },

  /* ---- Similar listings ------------------------------------------------------ */
  similar: {
    heading: { en: 'Similar listings', es: 'Propiedades similares' },
  },

  /* ---- Fixture banner (4c) — truth labeling, structural chrome -------------- */
  fixture: {
    tag: { en: 'Demonstration listing', es: 'Propiedad de demostración' },
    body: {
      en:
        'This page shows placeholder data to preview the site template. It is ' +
        'not a real property, offer, or transaction.',
      es:
        'Esta página muestra datos de relleno para previsualizar la plantilla ' +
        'del sitio. No es una propiedad, oferta ni transacción real.',
    },
  },

  /* ---- Lightbox (client island labels, resolved server-side) ---------------- */
  lightbox: {
    close: { en: 'Close', es: 'Cerrar' },
    prev: { en: 'Previous image', es: 'Imagen anterior' },
    next: { en: 'Next image', es: 'Imagen siguiente' },
  },

  /* ---- Sold view -------------------------------------------------------------- */
  sold: {
    indexTitle: { en: 'Sold listings', es: 'Propiedades vendidas' },
    // Free prose about the brokerage's track record — client-reviewed copy,
    // not agent-written (4c). Placeholder until supplied.
    indexIntro: {
      en: 'TK_SOLD_INDEX_INTRO',
      es: 'TK_SOLD_INDEX_INTRO',
    },
    bannerTag: { en: 'Sold', es: 'Vendida' },
    closedOn: { en: 'Transaction closed', es: 'Transacción cerrada el' },
    closedPrice: { en: 'Closed price', es: 'Precio de cierre' },
    representedSeller: {
      en: 'Optimal Realty represented the seller.',
      es: 'Optimal Realty representó al vendedor.',
    },
    representedBuyer: {
      en: 'Optimal Realty represented the buyer.',
      es: 'Optimal Realty representó al comprador.',
    },
    representedBoth: {
      en: 'Optimal Realty represented both sides.',
      es: 'Optimal Realty representó a ambas partes.',
    },
  },
} satisfies Record<string, Record<string, Localized>>;
