import type { Faq, Portal } from '@/lib/types';

/**
 * SELLERS PORTAL — the Phase 3 proving portal (the other four are later phases).
 *
 * Structure authored in-house; prose that requires broker judgment is a
 * placeholder marker. The answer prose is broker counsel (dispatch 5b): it is a
 * placeholder marker until the client supplies it, and in report mode the
 * portal still publishes with the placeholder rendered visibly (Part 3.2).
 * `slug` must match PORTAL_SEG in lib/seo/href.ts — enforced by test.
 */

export const SELLERS_PORTAL: Portal = {
  id: 'sellers',
  slug: { en: 'sellers', es: 'vendedores' },
  title: { en: 'Sellers', es: 'Vendedores' },
  answer: {
    question: {
      en: 'How do I sell a home in Miami-Dade County?',
      es: '¿Cómo vendo una vivienda en el condado de Miami-Dade?',
    },
    answer: {
      en: 'TK_PORTAL_SELLERS_ANSWER',
      es: 'TK_PORTAL_SELLERS_ANSWER',
    },
    updated: '2026-07-26',
  },
  decision: {
    en: 'TK_PORTAL_SELLERS_DECISION',
    es: 'TK_PORTAL_SELLERS_DECISION',
  },
  decisionSteps: [
    {
      label: { en: 'Prepare', es: 'Preparación' },
      detail: {
        en: 'Title, association, and disclosure paperwork for the property.',
        es: 'Documentación de título, de la asociación y divulgaciones de la propiedad.',
      },
    },
    {
      label: { en: 'Price', es: 'Precio' },
      detail: {
        en: 'A list price supported by appraisal-grade analysis of comparable sales.',
        es: 'Un precio de lista respaldado por un análisis de ventas comparables con rigor de tasación.',
      },
    },
    {
      label: { en: 'List and market', es: 'Publicación y mercadeo' },
      detail: {
        en: 'The listing, its media, and outreach to qualified buyers.',
        es: 'La publicación, su material visual y la difusión a compradores calificados.',
      },
    },
    {
      label: { en: 'Negotiate', es: 'Negociación' },
      detail: {
        en: 'Offers, counteroffers, and the contract terms that result.',
        es: 'Ofertas, contraofertas y los términos del contrato resultante.',
      },
    },
    {
      label: { en: 'Close', es: 'Cierre' },
      detail: {
        en: 'Payoffs, prorations, and closing costs through the settlement date.',
        es: 'Cancelaciones, prorrateos y costos de cierre hasta la fecha de liquidación.',
      },
    },
  ],
  toolIds: ['net-proceeds'],
  subpageIds: ['sellers-home-valuation', 'sellers-selling-process'],
  adviceIds: [], // client counsel never blocks a route — AdviceList renders null
  faqIds: ['sellers-cost-to-sell', 'sellers-time-to-sell', 'sellers-pricing'],
  featuredListings: { mode: 'active', limit: 3 },
  serviceSchema: { serviceType: 'Residential seller representation' },
  status: 'published',
};

/** FAQ structure authored; every answer is broker counsel — placeholder only. */
export const SELLERS_FAQS: Faq[] = [
  {
    id: 'sellers-cost-to-sell',
    question: {
      en: 'What does it cost to sell a home in Miami-Dade County?',
      es: '¿Cuánto cuesta vender una vivienda en el condado de Miami-Dade?',
    },
    answer: { en: 'TK_FAQ_SELLERS_COST_TO_SELL', es: 'TK_FAQ_SELLERS_COST_TO_SELL' },
    scope: { type: 'portal', refId: 'sellers' },
  },
  {
    id: 'sellers-time-to-sell',
    question: {
      en: 'How long does a home sale take?',
      es: '¿Cuánto tarda la venta de una vivienda?',
    },
    answer: { en: 'TK_FAQ_SELLERS_TIME_TO_SELL', es: 'TK_FAQ_SELLERS_TIME_TO_SELL' },
    scope: { type: 'portal', refId: 'sellers' },
  },
  {
    id: 'sellers-pricing',
    question: {
      en: 'How is a list price set?',
      es: '¿Cómo se determina el precio de lista?',
    },
    answer: { en: 'TK_FAQ_SELLERS_PRICING', es: 'TK_FAQ_SELLERS_PRICING' },
    scope: { type: 'portal', refId: 'sellers' },
  },
];
