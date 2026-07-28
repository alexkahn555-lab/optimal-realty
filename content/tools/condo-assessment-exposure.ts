import type { ToolDef } from '@/lib/types';

/**
 * CONDO-ASSESSMENT-EXPOSURE TOOL — the buyer/investor calculator (engine in
 * lib/calc/condo-assessment.ts; this file is its content surface, dispatch
 * 5g). Structure authored in-house; the title, question, answer, method note
 * and disclaimer are licensed/attorney prose and ship as placeholder markers
 * until the client supplies them (report mode publishes them visibly, strict
 * mode unpublishes — Part 3.2). Part 6.3: the disclaimer on THIS tool needs
 * attorney review before it leaves preview — flagged in the dispatch report.
 * `slug` must match TOOL_SLUG in lib/seo/href.ts — enforced by test.
 */

export const CONDO_ASSESSMENT_TOOL: ToolDef = {
  id: 'condo-assessment',
  slug: {
    en: 'condo-assessment-exposure',
    es: 'exposicion-a-cuotas-especiales',
  },
  title: {
    en: 'TK_TOOL_CONDO_ASSESSMENT_TITLE',
    es: 'TK_TOOL_CONDO_ASSESSMENT_TITLE',
  },
  portalIds: ['buyers', 'investors'],
  answer: {
    question: {
      en: 'TK_TOOL_CONDO_ASSESSMENT_QUESTION',
      es: 'TK_TOOL_CONDO_ASSESSMENT_QUESTION',
    },
    answer: {
      en: 'TK_TOOL_CONDO_ASSESSMENT_ANSWER',
      es: 'TK_TOOL_CONDO_ASSESSMENT_ANSWER',
    },
    updated: '2026-07-28',
  },
  engineId: 'condo-assessment',
  methodNote: {
    en: 'TK_TOOL_CONDO_ASSESSMENT_METHOD',
    es: 'TK_TOOL_CONDO_ASSESSMENT_METHOD',
  },
  disclaimer: {
    en: 'TK_TOOL_CONDO_ASSESSMENT_DISCLAIMER',
    es: 'TK_TOOL_CONDO_ASSESSMENT_DISCLAIMER',
  },
  faqIds: [],
  leadCapture: { enabled: true },
  status: 'published',
};
