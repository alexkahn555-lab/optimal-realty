import type { Faq, LeadIntent, PortalSubpage } from '@/lib/types';

/**
 * SELLERS → SELLING PROCESS subpage. Structure authored; AnswerBlock from
 * confirmed facts only — FLAGGED for client review. `slug` must match
 * SUBPAGE_SEG in lib/seo/href.ts — enforced by test.
 */

export const SELLING_PROCESS_SUBPAGE: PortalSubpage = {
  id: 'sellers-selling-process',
  portalId: 'sellers',
  slug: { en: 'selling-process', es: 'proceso-de-venta' },
  title: { en: 'The selling process', es: 'El proceso de venta' },
  answer: {
    question: {
      en: 'What is the process for selling a home in Miami-Dade?',
      es: '¿Cuál es el proceso para vender una vivienda en Miami-Dade?',
    },
    // 50 words / confirmed facts only — FLAGGED for client review.
    answer: {
      en:
        'Selling a Miami-Dade home moves through preparation, pricing, listing, ' +
        'negotiation, and closing. Optimal Realty guides each stage under a ' +
        'Florida broker license, with appraiser and community-association ' +
        'credentials for pricing and condo paperwork, in English or Spanish. The ' +
        'net-proceeds calculator shows the closing costs behind the final figure ' +
        'before you list.',
      es:
        'La venta de una vivienda en Miami-Dade pasa por preparación, precio, ' +
        'publicación, negociación y cierre. Optimal Realty acompaña cada etapa ' +
        'bajo una licencia de corredor de Florida, con credenciales de tasador y ' +
        'de administración de asociaciones para el precio y los trámites de ' +
        'condominio, en inglés o español. La calculadora de ganancia neta ' +
        'muestra los costos de cierre detrás de la cifra final antes de listar.',
    },
    updated: '2026-07-26',
  },
  adviceIds: [],
  relatedToolIds: ['net-proceeds'],
  faqIds: ['sellers-process-timeline'],
  status: 'published',
};

/** Lead attribution intent for this subpage's CTA (structural wiring). */
export const SELLING_PROCESS_LEAD_INTENT: LeadIntent = 'sell';

export const SELLING_PROCESS_FAQS: Faq[] = [
  {
    id: 'sellers-process-timeline',
    question: {
      en: 'What happens between contract and closing?',
      es: '¿Qué ocurre entre el contrato y el cierre?',
    },
    answer: {
      en: 'TK_FAQ_SELLERS_PROCESS_TIMELINE',
      es: 'TK_FAQ_SELLERS_PROCESS_TIMELINE',
    },
    scope: { type: 'portal', refId: 'sellers' },
  },
];
