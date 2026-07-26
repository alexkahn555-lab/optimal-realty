import type { Faq, LeadIntent, PortalSubpage } from '@/lib/types';

/**
 * SELLERS → HOME VALUATION subpage. Structure authored; the AnswerBlock is
 * assembled strictly from confirmed facts (appraiser license RD8416 in
 * config/entity.ts, service area, languages) and FLAGGED for client review.
 * `slug` must match SUBPAGE_SEG in lib/seo/href.ts — enforced by test.
 */

export const HOME_VALUATION_SUBPAGE: PortalSubpage = {
  id: 'sellers-home-valuation',
  portalId: 'sellers',
  slug: { en: 'home-valuation', es: 'valoracion-de-vivienda' },
  title: { en: 'Home valuation', es: 'Valoración de vivienda' },
  answer: {
    question: {
      en: 'How much is my Miami-Dade home worth?',
      es: '¿Cuánto vale mi vivienda en Miami-Dade?',
    },
    // 49 words / confirmed facts only — FLAGGED for client review.
    answer: {
      en:
        "A home's market value in Miami-Dade County is estimated from recent " +
        "comparable sales, property condition, and location. Optimal Realty's " +
        'founding broker is also a Florida state-certified appraiser, so listing ' +
        'valuations follow appraisal methodology rather than an automated ' +
        'estimate. Request a valuation in English or Spanish through the ' +
        'contact page.',
      es:
        'El valor de mercado de una vivienda en el condado de Miami-Dade se ' +
        'estima a partir de ventas comparables recientes, el estado de la ' +
        'propiedad y su ubicación. El corredor fundador de Optimal Realty es ' +
        'además tasador certificado por el estado de Florida, por lo que las ' +
        'valoraciones siguen metodología de tasación y no una estimación ' +
        'automatizada. Solicite una valoración en inglés o español a través de ' +
        'la página de contacto.',
    },
    updated: '2026-07-26',
  },
  adviceIds: [],
  relatedToolIds: ['net-proceeds'],
  faqIds: ['sellers-valuation-vs-appraisal'],
  status: 'published',
};

/** Lead attribution intent for this subpage's CTA (structural wiring). */
export const HOME_VALUATION_LEAD_INTENT: LeadIntent = 'valuation';

export const HOME_VALUATION_FAQS: Faq[] = [
  {
    id: 'sellers-valuation-vs-appraisal',
    question: {
      en: 'What is the difference between a valuation and an appraisal?',
      es: '¿Cuál es la diferencia entre una valoración y una tasación?',
    },
    answer: {
      en: 'TK_FAQ_SELLERS_VALUATION_VS_APPRAISAL',
      es: 'TK_FAQ_SELLERS_VALUATION_VS_APPRAISAL',
    },
    scope: { type: 'portal', refId: 'sellers' },
  },
];
