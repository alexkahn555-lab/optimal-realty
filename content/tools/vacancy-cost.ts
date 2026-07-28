import type { ToolDef } from '@/lib/types';

/**
 * VACANCY-COST TOOL — the landlord calculator (engine in
 * lib/calc/vacancy-cost.ts; this file is its content surface, dispatch 5e).
 * Structure authored in-house; the title, question, answer, method note and
 * disclaimer are licensed/attorney prose and ship as placeholder markers
 * until the client supplies them (report mode publishes them visibly, strict
 * mode unpublishes — Part 3.2). `slug` must match TOOL_SLUG in
 * lib/seo/href.ts — enforced by test.
 */

export const VACANCY_COST_TOOL: ToolDef = {
  id: 'vacancy-cost',
  slug: { en: 'vacancy-cost', es: 'costo-de-vacancia' },
  title: { en: 'TK_TOOL_VACANCY_COST_TITLE', es: 'TK_TOOL_VACANCY_COST_TITLE' },
  portalIds: ['landlords'],
  answer: {
    question: {
      en: 'TK_TOOL_VACANCY_COST_QUESTION',
      es: 'TK_TOOL_VACANCY_COST_QUESTION',
    },
    answer: {
      en: 'TK_TOOL_VACANCY_COST_ANSWER',
      es: 'TK_TOOL_VACANCY_COST_ANSWER',
    },
    updated: '2026-07-28',
  },
  engineId: 'vacancy-cost',
  methodNote: {
    en: 'TK_TOOL_VACANCY_COST_METHOD',
    es: 'TK_TOOL_VACANCY_COST_METHOD',
  },
  disclaimer: {
    en: 'TK_TOOL_VACANCY_COST_DISCLAIMER',
    es: 'TK_TOOL_VACANCY_COST_DISCLAIMER',
  },
  faqIds: [],
  leadCapture: { enabled: true },
  status: 'published',
};
