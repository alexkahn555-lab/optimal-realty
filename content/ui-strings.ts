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

  /* ==========================================================================
   * Phase 3 — calculator + portal chrome. Labels only: broker counsel, method
   * notes, disclaimers, and FAQ answers are NEVER here — those live in content/
   * as placeholder markers until the client supplies them.
   * ========================================================================== */

  /* ---- Calculator field labels (FieldSpec.labelKey resolves here) ---------- */
  calcField: {
    salePrice: { en: 'Sale price', es: 'Precio de venta' },
    county: { en: 'County', es: 'Condado' },
    propertyClass: { en: 'Property type', es: 'Tipo de propiedad' },
    mortgagePayoff: { en: 'Mortgage payoff', es: 'Saldo de cancelación de la hipoteca' },
    secondLienPayoff: {
      en: 'Second lien payoff',
      es: 'Cancelación del segundo gravamen',
    },
    commissionRatePct: { en: 'Commission rate', es: 'Tasa de comisión' },
    sellerConcessions: { en: 'Seller concessions', es: 'Concesiones del vendedor' },
    annualPropertyTax: { en: 'Annual property tax', es: 'Impuesto predial anual' },
    closingDate: { en: 'Closing date', es: 'Fecha de cierre' },
    hoaMonthly: {
      en: 'HOA monthly dues',
      es: 'Cuota mensual de la asociación',
    },
    titlePaidBySeller: {
      en: "Seller pays the owner's title policy",
      es: 'El vendedor paga la póliza de título',
    },
  },

  /* ---- Calculator enum value labels ---------------------------------------- */
  calcEnum: {
    miamiDade: { en: 'Miami-Dade', es: 'Miami-Dade' },
    otherFl: { en: 'Other Florida county', es: 'Otro condado de Florida' },
    singleFamily: { en: 'Single-family residence', es: 'Vivienda unifamiliar' },
    otherClass: { en: 'Condo / townhouse / other', es: 'Condominio / townhouse / otro' },
  },

  /* ---- Calculator field helper lines --------------------------------------- */
  calcHelper: {
    mortgagePayoff: {
      en: 'Use a payoff quote including per-diem interest.',
      es: 'Use la cotización de cancelación incluyendo el interés diario.',
    },
    annualPropertyTax: {
      en: 'Optional — enables the tax proration line.',
      es: 'Opcional — habilita el prorrateo del impuesto.',
    },
    hoaMonthly: {
      en: 'Enables HOA proration and the estoppel fee line.',
      es: 'Habilita el prorrateo de la asociación y el cargo de estoppel.',
    },
    flaggedDefault: {
      en: 'Unverified default — edit to your numbers.',
      es: 'Valor predeterminado sin verificar — edítelo con sus cifras.',
    },
  },

  /* ---- Ledger line labels (engines return these as LedgerLine.label) ------- */
  ledger: {
    gross: { en: 'Sale price (gross)', es: 'Precio de venta (bruto)' },
    mortgagePayoff: { en: 'Mortgage payoff', es: 'Cancelación de la hipoteca' },
    secondLienPayoff: {
      en: 'Second lien payoff',
      es: 'Cancelación del segundo gravamen',
    },
    commission: { en: 'Real estate commission', es: 'Comisión inmobiliaria' },
    docStamps: {
      en: 'Documentary stamp tax (deed)',
      es: 'Impuesto de timbre documental (escritura)',
    },
    docStampSurtax: { en: 'Miami-Dade surtax', es: 'Sobretasa de Miami-Dade' },
    titlePremium: {
      en: "Owner's title policy",
      es: 'Póliza de título del propietario',
    },
    taxProration: {
      en: 'Property tax proration (seller credit)',
      es: 'Prorrateo del impuesto predial (crédito al comprador)',
    },
    hoaProration: {
      en: 'HOA dues proration',
      es: 'Prorrateo de cuotas de la asociación',
    },
    estoppelFee: { en: 'Estoppel letter fee', es: 'Cargo por carta de estoppel' },
    settlementFee: { en: 'Settlement / closing fee', es: 'Cargo de cierre' },
    lienSearchFee: {
      en: 'Municipal lien search',
      es: 'Búsqueda de gravámenes municipales',
    },
    satisfactionRecording: {
      en: 'Satisfaction recording',
      es: 'Registro de cancelación de gravamen',
    },
    sellerConcessions: { en: 'Seller concessions', es: 'Concesiones del vendedor' },
    netProceeds: { en: 'Estimated net proceeds', es: 'Ganancia neta estimada' },
    shortfall: {
      en: 'Estimated shortfall at closing',
      es: 'Déficit estimado al cierre',
    },
  },

  /* ---- Calculator shell / result panel chrome ------------------------------ */
  calc: {
    estimateTag: { en: 'Estimate', es: 'Estimación' },
    oneTimeHeading: { en: 'One-time costs at closing', es: 'Costos únicos al cierre' },
    monthlyHeading: { en: 'Monthly', es: 'Mensual' },
    emailBreakdown: {
      en: 'Email me this breakdown',
      es: 'Envíenme este desglose por correo',
    },
    methodHeading: { en: 'Method', es: 'Método' },
    disclaimerHeading: { en: 'Disclaimer', es: 'Aviso legal' },
    assumptionsHeading: { en: 'Assumptions', es: 'Supuestos' },
    assumptionsIntro: {
      en:
        'Defaults this calculator relies on. Every value is editable in the form; ' +
        'unverified values are marked with their basis and date.',
      es:
        'Valores predeterminados de esta calculadora. Todos son editables en el ' +
        'formulario; los valores sin verificar están marcados con su base y fecha.',
    },
    colAssumption: { en: 'Assumption', es: 'Supuesto' },
    colValue: { en: 'Value', es: 'Valor' },
    colBasis: { en: 'Basis', es: 'Base' },
    colAsOf: { en: 'As of', es: 'Fecha' },
    colNote: { en: 'Note', es: 'Nota' },
    basisStatutory: { en: 'Statutory — verify', es: 'Estatutario — por verificar' },
    basisPromulgatedVerify: {
      en: 'Promulgated — verify',
      es: 'Promulgado — por verificar',
    },
    basisUnconfirmedDefault: {
      en: 'Unconfirmed default',
      es: 'Predeterminado sin confirmar',
    },
    basisMarketMustUpdate: {
      en: 'Market — must update',
      es: 'Mercado — requiere actualización',
    },
    basisInput: { en: 'Your input', es: 'Su dato' },
  },

  /* ---- Portal / subpage section chrome ------------------------------------- */
  sections: {
    faqHeading: { en: 'Frequently asked questions', es: 'Preguntas frecuentes' },
    relatedTools: { en: 'Related tools', es: 'Herramientas relacionadas' },
    leadCtaHeading: {
      en: 'Talk to a licensed broker',
      es: 'Hable con un corredor licenciado',
    },
    toolRack: { en: 'Decision tools', es: 'Herramientas de decisión' },
    calculatorTag: { en: 'Calculator', es: 'Calculadora' },
    decisionHeading: { en: 'The process', es: 'El proceso' },
    adviceHeading: { en: 'Broker guidance', es: 'Orientación del corredor' },
    reviewedLabel: { en: 'Reviewed', es: 'Revisado' },
    featuredListings: { en: 'Featured listings', es: 'Propiedades destacadas' },
  },

  /* ---- Tools hub (fixed section; AnswerBlock from confirmed facts — FLAG) --- */
  toolsHub: {
    question: {
      en: 'Which real estate calculators does Optimal Realty offer?',
      es: '¿Qué calculadoras inmobiliarias ofrece Optimal Realty?',
    },
    answer: {
      en:
        'Optimal Realty publishes free bilingual calculators for Miami-Dade real ' +
        'estate decisions. The first is the seller net-proceeds calculator, which ' +
        'itemizes mortgage payoff, commission, Florida documentary stamp taxes, ' +
        "the Miami-Dade surtax, title, and closing costs behind a sale. More " +
        "decision tools tied to the broker's appraiser and association-management " +
        'credentials are in progress.',
      es:
        'Optimal Realty publica calculadoras bilingües y gratuitas para ' +
        'decisiones inmobiliarias en Miami-Dade. La primera es la calculadora de ' +
        'ganancia neta del vendedor, que detalla la cancelación de la hipoteca, ' +
        'la comisión, los impuestos de timbre documental de Florida, la sobretasa ' +
        'de Miami-Dade y los costos de título y cierre de una venta. Hay más ' +
        'herramientas en preparación, ligadas a las credenciales de tasador y de ' +
        'administración de asociaciones del corredor.',
    },
  },

  /* ---- About page section labels (facts come from config/entity.ts) -------- */
  about: {
    education: { en: 'Education', es: 'Formación académica' },
    militaryService: { en: 'Military service', es: 'Servicio militar' },
    designations: { en: 'NAR designations', es: 'Designaciones de NAR' },
    standard: { en: 'Standard of representation', es: 'Estándar de representación' },
    standardFact: {
      en: 'Single agency — one client, undivided loyalty, per transaction.',
      es: 'Agencia única — un cliente y lealtad indivisa por transacción.',
    },
    serviceArea: { en: 'Service area', es: 'Área de servicio' },
  },
} satisfies Record<string, Record<string, Localized>>;
