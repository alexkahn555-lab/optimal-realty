import type { Localized } from '@/lib/types';

/**
 * ============================================================================
 * UI STRINGS — the chrome vocabulary. Phase 1 (Foundation Shell).
 * ============================================================================
 *
 * Every user-visible chrome string on this branch lives here as `Localized`,
 * with real EN and real neutral Latin American ES. Chrome is authorable in-house;
 * broker counsel, listing narrative, and FAQ answers are NOT — those stay as
 * content placeholder markers in content/ and never appear on this branch.
 *
 * This file MUST contain zero placeholder markers: it is scanned by
 * check-content.mjs, and any such marker here would move the baseline count.
 * Missing chrome copy is a bug to author, not a slot to defer.
 *
 * Portal / section nav labels for entity-backed routes (the five portals) come
 * from their content `title`, not from here — those entities do not exist in
 * Phase 1, so the header renders no section links yet. The `nav` labels below are
 * authored ahead for the fixed non-portal sections so later phases wire them in
 * without re-authoring.
 *
 * ES review flags (see completion report): `home.metaDescription` uses
 * "tasación certificada" (certified appraisal) and "administración de asociaciones
 * comunitarias" (community association management) — confirm the client's preferred
 * Spanish terms for the appraiser + CAM credentials before launch.
 */

export const UI = {
  /* ---- Skip link + mobile disclosure -------------------------------------- */
  a11y: {
    skipToContent: { en: 'Skip to content', es: 'Saltar al contenido' },
  },

  /* ---- Primary nav labels (non-portal fixed sections) --------------------- */
  nav: {
    tools: { en: 'Tools', es: 'Herramientas' },
    listings: { en: 'Listings', es: 'Propiedades' },
    neighborhoods: { en: 'Neighborhoods', es: 'Vecindarios' },
    about: { en: 'About', es: 'Nosotros' },
    contact: { en: 'Contact', es: 'Contacto' },
    menu: { en: 'Menu', es: 'Menú' },
    close: { en: 'Close', es: 'Cerrar' },
  },

  /* ---- Locale switch ------------------------------------------------------ */
  locale: {
    // Language names, rendered per current locale at equal visual weight.
    en: { en: 'English', es: 'Inglés' },
    es: { en: 'Spanish', es: 'Español' },
    switchLabel: { en: 'Change language', es: 'Cambiar idioma' },
  },

  /* ---- Footer ------------------------------------------------------------- */
  footer: {
    licenses: { en: 'Licenses', es: 'Licencias' },
    rights: { en: 'All rights reserved.', es: 'Todos los derechos reservados.' },
  },

  /* ---- Not found (global 404) --------------------------------------------- */
  notFound: {
    heading: { en: 'Page not found', es: 'Página no encontrada' },
    home: { en: 'Return home', es: 'Volver al inicio' },
  },

  /* ---- Answer block freshness label --------------------------------------- */
  answer: {
    updated: { en: 'Updated', es: 'Actualizado' },
  },

  /* ---- Breadcrumbs -------------------------------------------------------- */
  breadcrumb: {
    home: { en: 'Home', es: 'Inicio' },
  },

  /* ---- Home stub metadata (chrome-level, assembled from confirmed facts) --- */
  home: {
    metaDescription: {
      en:
        'Optimal Realty — Florida real estate brokerage, certified appraisal, and ' +
        'community association management serving Miami-Dade County.',
      es:
        'Optimal Realty — corretaje inmobiliario, tasación certificada y administración ' +
        'de asociaciones comunitarias en el condado de Miami-Dade, Florida.',
    },
  },
} satisfies Record<string, Record<string, Localized>>;
