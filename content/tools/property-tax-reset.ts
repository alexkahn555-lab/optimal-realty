import type { ToolDef } from '@/lib/types';

/**
 * PROPERTY-TAX-RESET TOOL — the buyer calculator (engine in
 * lib/calc/tax-reset.ts; this file is its content surface, dispatch 5h — the
 * last Phase 5 calculator). Structure authored in-house; the title, question,
 * answer, method note and disclaimer are licensed/attorney prose and ship as
 * placeholder markers until the client supplies them (report mode publishes
 * them visibly, strict mode unpublishes — Part 3.2). Part 6.3: this engine is
 * why the client's appraiser license matters and must be verified accurate
 * (millage composition, exemption tiers, reassessment timing) before it
 * leaves preview — flagged in the dispatch report. `slug` must match
 * TOOL_SLUG in lib/seo/href.ts — enforced by test.
 */

export const TAX_RESET_TOOL: ToolDef = {
  id: 'tax-reset',
  slug: {
    en: 'property-tax-reset',
    es: 'reajuste-del-impuesto-predial',
  },
  title: { en: 'TK_TOOL_TAX_RESET_TITLE', es: 'TK_TOOL_TAX_RESET_TITLE' },
  portalIds: ['buyers'],
  answer: {
    question: {
      en: 'TK_TOOL_TAX_RESET_QUESTION',
      es: 'TK_TOOL_TAX_RESET_QUESTION',
    },
    answer: {
      en: 'TK_TOOL_TAX_RESET_ANSWER',
      es: 'TK_TOOL_TAX_RESET_ANSWER',
    },
    updated: '2026-07-28',
  },
  engineId: 'tax-reset',
  methodNote: {
    en: 'TK_TOOL_TAX_RESET_METHOD',
    es: 'TK_TOOL_TAX_RESET_METHOD',
  },
  disclaimer: {
    en: 'TK_TOOL_TAX_RESET_DISCLAIMER',
    es: 'TK_TOOL_TAX_RESET_DISCLAIMER',
  },
  faqIds: [],
  leadCapture: { enabled: true },
  status: 'published',
};
