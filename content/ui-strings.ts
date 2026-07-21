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
 *
 * Phase 2 flags: `form.consentSms` / `form.consentMarketing` wording needs
 * attorney/client sign-off (TCPA-adjacent), and `contact.question` /
 * `contact.answer` (the contact page AnswerBlock, assembled strictly from
 * confirmed entity facts) need client review in both locales.
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
    ariaLabel: { en: 'Breadcrumb', es: 'Ruta de navegación' },
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

  /* ---- Contact page (AnswerBlock from confirmed entity facts — see flags) -- */
  contact: {
    question: {
      en: 'How do I contact Optimal Realty?',
      es: '¿Cómo puedo contactar a Optimal Realty?',
    },
    answer: {
      en:
        'Contact Optimal Realty, a Miami-Dade County real estate brokerage founded by ' +
        'Raul Perez — a Florida licensed real estate broker, certified appraiser, and ' +
        'community association manager. Use the form on this page in English or ' +
        'Spanish; your message goes directly to the broker for review and response.',
      es:
        'Contacte a Optimal Realty, una firma de corretaje inmobiliario del condado de ' +
        'Miami-Dade fundada por Raul Perez — corredor de bienes raíces licenciado en ' +
        'Florida, tasador certificado y administrador de asociaciones comunitarias. Use ' +
        'el formulario de esta página en inglés o español; su mensaje llega ' +
        'directamente al corredor para su revisión y respuesta.',
    },
  },

  /* ---- Lead form (labels, states, validation — island reads only these) ---- */
  form: {
    fullName: { en: 'Full name', es: 'Nombre completo' },
    email: { en: 'Email', es: 'Correo electrónico' },
    phone: { en: 'Phone', es: 'Teléfono' },
    message: { en: 'Message', es: 'Mensaje' },
    optional: { en: 'Optional', es: 'Opcional' },
    consentSms: {
      en:
        'I agree to receive text messages from Optimal Realty about my inquiry. ' +
        'Message and data rates may apply.',
      es:
        'Acepto recibir mensajes de texto de Optimal Realty sobre mi consulta. ' +
        'Pueden aplicarse tarifas de mensajes y datos.',
    },
    consentMarketing: {
      en: 'Send me occasional market updates by email.',
      es: 'Envíenme actualizaciones ocasionales del mercado por correo electrónico.',
    },
    hpLabel: { en: 'Leave this field empty', es: 'Deje este campo vacío' },
    submit: { en: 'Send message', es: 'Enviar mensaje' },
    sending: { en: 'Sending…', es: 'Enviando…' },
    successHeading: { en: 'Message sent', es: 'Mensaje enviado' },
    successBody: {
      en: 'Thank you — your message has been received.',
      es: 'Gracias — hemos recibido su mensaje.',
    },
    errorBody: {
      en: 'Something went wrong. Please try again.',
      es: 'Ocurrió un error. Inténtelo de nuevo.',
    },
    requiredError: { en: 'This field is required.', es: 'Este campo es obligatorio.' },
    emailError: {
      en: 'Enter a valid email address.',
      es: 'Ingrese un correo electrónico válido.',
    },
    phoneError: {
      en: 'Enter a valid phone number.',
      es: 'Ingrese un número de teléfono válido.',
    },
  },
} satisfies Record<string, Record<string, Localized>>;
