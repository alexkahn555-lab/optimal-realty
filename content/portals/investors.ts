import type { Portal } from '@/lib/types';

/**
 * INVESTORS PORTAL — hub registered in dispatch 5c (Part 5 route map row 5).
 *
 * Structure authored in-house; every prose field — the client-facing title,
 * the question that becomes the H1, the answer, the decision line, and each
 * decision step — is licensed professional counsel and ships as a placeholder
 * marker until the client supplies it. In report mode the hub still publishes
 * with the placeholders rendered visibly (Part 3.2); strict mode unpublishes.
 * The step COUNT is structural scaffolding (3–5, Part 2.2); the text is not.
 * `slug` must match PORTAL_SEG in lib/seo/href.ts — enforced by test.
 */

export const INVESTORS_PORTAL: Portal = {
  id: 'investors',
  slug: { en: 'investors', es: 'inversionistas' },
  title: { en: 'TK_PORTAL_INVESTORS_TITLE', es: 'TK_PORTAL_INVESTORS_TITLE' },
  answer: {
    question: {
      en: 'TK_PORTAL_INVESTORS_QUESTION',
      es: 'TK_PORTAL_INVESTORS_QUESTION',
    },
    answer: {
      en: 'TK_PORTAL_INVESTORS_ANSWER',
      es: 'TK_PORTAL_INVESTORS_ANSWER',
    },
    updated: '2026-07-28',
  },
  decision: {
    en: 'TK_PORTAL_INVESTORS_DECISION',
    es: 'TK_PORTAL_INVESTORS_DECISION',
  },
  decisionSteps: [
    {
      label: { en: 'TK_PORTAL_INVESTORS_STEP_1_LABEL', es: 'TK_PORTAL_INVESTORS_STEP_1_LABEL' },
      detail: { en: 'TK_PORTAL_INVESTORS_STEP_1_DETAIL', es: 'TK_PORTAL_INVESTORS_STEP_1_DETAIL' },
    },
    {
      label: { en: 'TK_PORTAL_INVESTORS_STEP_2_LABEL', es: 'TK_PORTAL_INVESTORS_STEP_2_LABEL' },
      detail: { en: 'TK_PORTAL_INVESTORS_STEP_2_DETAIL', es: 'TK_PORTAL_INVESTORS_STEP_2_DETAIL' },
    },
    {
      label: { en: 'TK_PORTAL_INVESTORS_STEP_3_LABEL', es: 'TK_PORTAL_INVESTORS_STEP_3_LABEL' },
      detail: { en: 'TK_PORTAL_INVESTORS_STEP_3_DETAIL', es: 'TK_PORTAL_INVESTORS_STEP_3_DETAIL' },
    },
    {
      label: { en: 'TK_PORTAL_INVESTORS_STEP_4_LABEL', es: 'TK_PORTAL_INVESTORS_STEP_4_LABEL' },
      detail: { en: 'TK_PORTAL_INVESTORS_STEP_4_DETAIL', es: 'TK_PORTAL_INVESTORS_STEP_4_DETAIL' },
    },
  ],
  toolIds: [], // investor calculators do not exist yet — 5d+ wires the rack
  subpageIds: ['investors-1031-exchange'],
  adviceIds: [], // client counsel never blocks a route — AdviceList renders null
  faqIds: [],
  featuredListings: { mode: 'sold', limit: 3 },
  serviceSchema: { serviceType: 'Investment property representation' },
  status: 'published',
};
