import type { Portal } from '@/lib/types';

/**
 * LANDLORDS PORTAL — hub registered in dispatch 5c (Part 5 route map row 6).
 *
 * Structure authored in-house; every prose field — the client-facing title,
 * the question that becomes the H1, the answer, the decision line, and each
 * decision step — is licensed professional counsel and ships as a placeholder
 * marker until the client supplies it. In report mode the hub still publishes
 * with the placeholders rendered visibly (Part 3.2); strict mode unpublishes.
 * The step COUNT is structural scaffolding (3–5, Part 2.2); the text is not.
 * `slug` must match PORTAL_SEG in lib/seo/href.ts — enforced by test. The ES
 * slug is `propietarios` per the 5c route map (supersedes the Phase 1
 * judgment slug `arrendadores`).
 */

export const LANDLORDS_PORTAL: Portal = {
  id: 'landlords',
  slug: { en: 'landlords', es: 'propietarios' },
  title: { en: 'TK_PORTAL_LANDLORDS_TITLE', es: 'TK_PORTAL_LANDLORDS_TITLE' },
  answer: {
    question: {
      en: 'TK_PORTAL_LANDLORDS_QUESTION',
      es: 'TK_PORTAL_LANDLORDS_QUESTION',
    },
    answer: {
      en: 'TK_PORTAL_LANDLORDS_ANSWER',
      es: 'TK_PORTAL_LANDLORDS_ANSWER',
    },
    updated: '2026-07-28',
  },
  decision: {
    en: 'TK_PORTAL_LANDLORDS_DECISION',
    es: 'TK_PORTAL_LANDLORDS_DECISION',
  },
  decisionSteps: [
    {
      label: { en: 'TK_PORTAL_LANDLORDS_STEP_1_LABEL', es: 'TK_PORTAL_LANDLORDS_STEP_1_LABEL' },
      detail: { en: 'TK_PORTAL_LANDLORDS_STEP_1_DETAIL', es: 'TK_PORTAL_LANDLORDS_STEP_1_DETAIL' },
    },
    {
      label: { en: 'TK_PORTAL_LANDLORDS_STEP_2_LABEL', es: 'TK_PORTAL_LANDLORDS_STEP_2_LABEL' },
      detail: { en: 'TK_PORTAL_LANDLORDS_STEP_2_DETAIL', es: 'TK_PORTAL_LANDLORDS_STEP_2_DETAIL' },
    },
    {
      label: { en: 'TK_PORTAL_LANDLORDS_STEP_3_LABEL', es: 'TK_PORTAL_LANDLORDS_STEP_3_LABEL' },
      detail: { en: 'TK_PORTAL_LANDLORDS_STEP_3_DETAIL', es: 'TK_PORTAL_LANDLORDS_STEP_3_DETAIL' },
    },
    {
      label: { en: 'TK_PORTAL_LANDLORDS_STEP_4_LABEL', es: 'TK_PORTAL_LANDLORDS_STEP_4_LABEL' },
      detail: { en: 'TK_PORTAL_LANDLORDS_STEP_4_DETAIL', es: 'TK_PORTAL_LANDLORDS_STEP_4_DETAIL' },
    },
  ],
  toolIds: [], // landlord calculators do not exist yet — 5d+ wires the rack
  subpageIds: [], // 5d adds them
  adviceIds: [], // client counsel never blocks a route — AdviceList renders null
  faqIds: [],
  featuredListings: { mode: 'leased', limit: 3 },
  serviceSchema: { serviceType: 'Landlord leasing representation' },
  status: 'published',
};
