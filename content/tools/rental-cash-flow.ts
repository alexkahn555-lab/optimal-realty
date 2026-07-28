import type { ToolDef } from '@/lib/types';

/**
 * RENTAL-CASH-FLOW TOOL — the investor calculator (engine in
 * lib/calc/rental-cashflow.ts; this file is its content surface, dispatch
 * 5f). Structure authored in-house; the title, question, answer, method note
 * and disclaimer are licensed/attorney prose and ship as placeholder markers
 * until the client supplies them (report mode publishes them visibly, strict
 * mode unpublishes — Part 3.2). `slug` must match TOOL_SLUG in
 * lib/seo/href.ts — enforced by test.
 */

export const RENTAL_CASHFLOW_TOOL: ToolDef = {
  id: 'rental-cashflow',
  slug: { en: 'rental-cash-flow', es: 'flujo-de-caja' },
  title: {
    en: 'TK_TOOL_RENTAL_CASHFLOW_TITLE',
    es: 'TK_TOOL_RENTAL_CASHFLOW_TITLE',
  },
  portalIds: ['investors'],
  answer: {
    question: {
      en: 'TK_TOOL_RENTAL_CASHFLOW_QUESTION',
      es: 'TK_TOOL_RENTAL_CASHFLOW_QUESTION',
    },
    answer: {
      en: 'TK_TOOL_RENTAL_CASHFLOW_ANSWER',
      es: 'TK_TOOL_RENTAL_CASHFLOW_ANSWER',
    },
    updated: '2026-07-28',
  },
  engineId: 'rental-cashflow',
  methodNote: {
    en: 'TK_TOOL_RENTAL_CASHFLOW_METHOD',
    es: 'TK_TOOL_RENTAL_CASHFLOW_METHOD',
  },
  disclaimer: {
    en: 'TK_TOOL_RENTAL_CASHFLOW_DISCLAIMER',
    es: 'TK_TOOL_RENTAL_CASHFLOW_DISCLAIMER',
  },
  faqIds: [],
  leadCapture: { enabled: true },
  status: 'published',
};
