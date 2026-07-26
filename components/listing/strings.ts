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
} satisfies Record<string, Record<string, Localized>>;
