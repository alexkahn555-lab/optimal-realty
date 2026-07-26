import type { Faq, ToolDef } from '@/lib/types';

/**
 * NET-PROCEEDS TOOL — the flagship seller calculator (engine committed in
 * lib/calc/net-proceeds.ts; this file is its content surface). The AnswerBlock
 * describes strictly WHAT THE CALCULATOR COMPUTES (a confirmed-fact category)
 * and is FLAGGED for client review. Method note and disclaimer are licensed /
 * attorney prose — placeholders until supplied. `slug` must match TOOL_SLUG in
 * lib/seo/href.ts — enforced by test.
 */

export const NET_PROCEEDS_TOOL: ToolDef = {
  id: 'net-proceeds',
  slug: { en: 'net-proceeds', es: 'ganancia-neta' },
  title: { en: 'Net proceeds calculator', es: 'Calculadora de ganancia neta' },
  portalIds: ['sellers'],
  answer: {
    question: {
      en: 'How much will I take home from selling my house?',
      es: '¿Cuánto recibiré por la venta de mi casa?',
    },
    // 49 words / describes only what the engine computes — FLAGGED for review.
    answer: {
      en:
        "This calculator estimates a Florida seller's net proceeds: the sale " +
        'price minus mortgage and lien payoffs, commission, documentary stamp ' +
        'taxes including the Miami-Dade surtax, title and closing fees, prorated ' +
        'property taxes and association dues, and seller concessions. Every ' +
        'default is shown in the assumptions table and can be edited.',
      es:
        'Esta calculadora estima la ganancia neta del vendedor en Florida: el ' +
        'precio de venta menos la cancelación de hipotecas y gravámenes, la ' +
        'comisión, los impuestos de timbre documental incluida la sobretasa de ' +
        'Miami-Dade, los cargos de título y cierre, los prorrateos de impuesto ' +
        'predial y cuotas de asociación, y las concesiones del vendedor. Cada ' +
        'valor predeterminado aparece en la tabla de supuestos y es editable.',
    },
    updated: '2026-07-26',
  },
  engineId: 'net-proceeds',
  methodNote: { en: 'TK_TOOL_NET_PROCEEDS_METHOD', es: 'TK_TOOL_NET_PROCEEDS_METHOD' },
  disclaimer: {
    en: 'TK_TOOL_NET_PROCEEDS_DISCLAIMER',
    es: 'TK_TOOL_NET_PROCEEDS_DISCLAIMER',
  },
  faqIds: ['tool-net-proceeds-accuracy'],
  leadCapture: { enabled: true },
  status: 'published',
};

export const NET_PROCEEDS_FAQS: Faq[] = [
  {
    id: 'tool-net-proceeds-accuracy',
    question: {
      en: 'How accurate is this net proceeds estimate?',
      es: '¿Qué tan precisa es esta estimación de ganancia neta?',
    },
    answer: {
      en: 'TK_FAQ_TOOL_NET_PROCEEDS_ACCURACY',
      es: 'TK_FAQ_TOOL_NET_PROCEEDS_ACCURACY',
    },
    scope: { type: 'tool', refId: 'net-proceeds' },
  },
];
