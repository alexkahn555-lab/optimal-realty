import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnswerBlock } from '@/components/seo';

const block = {
  question: { en: 'Q?', es: '¿Q?' },
  answer: { en: 'The answer body.', es: 'El cuerpo.' },
  updated: '2026-07-19' as const,
};

describe('AnswerBlock', () => {
  it('renders the answer and an updated date', () => {
    const html = renderToStaticMarkup(<AnswerBlock block={block} locale="en" />);
    expect(html).toContain('The answer body.');
    expect(html).toContain('Updated');
    expect(html).toContain('2026');
  });

  it('has no container element and no links', () => {
    const html = renderToStaticMarkup(<AnswerBlock block={block} locale="en" />);
    expect(html).not.toMatch(/\b(border|rounded|shadow|bg-)/);
    expect(html).not.toContain('<a ');
  });

  /**
   * Dispatch 5b — an unfilled answer ships VISIBLY as PlaceholderTK in report
   * mode instead of raw marker prose, and the served markup never contains a
   * raw TK_ string (prefix-free id, the 4b PlaceholderTK convention).
   */
  describe('TK answer', () => {
    const tkBlock = {
      question: { en: 'Q?', es: '¿Q?' },
      answer: { en: 'TK_PORTAL_SELLERS_ANSWER', es: 'TK_PORTAL_SELLERS_ANSWER' },
      updated: '2026-07-26' as const,
    };

    it('renders a visible placeholder naming the marker, not the prose', () => {
      const html = renderToStaticMarkup(<AnswerBlock block={tkBlock} locale="en" />);
      expect(html).toContain('⟨ TK · PORTAL_SELLERS_ANSWER ⟩');
      expect(html).not.toMatch(/\bTK_/);
    });

    it('a marker in ONE locale is unfilled in both (the localizedClean contract)', () => {
      const half = { ...tkBlock, answer: { en: 'Real.', es: 'TK_HALF' } };
      for (const locale of ['en', 'es'] as const) {
        const html = renderToStaticMarkup(<AnswerBlock block={half} locale={locale} />);
        expect(html).toContain('⟨ TK · HALF ⟩');
        expect(html).not.toContain('Real.');
      }
    });

    it('still renders the updated line (the placeholder is dated chrome)', () => {
      const html = renderToStaticMarkup(<AnswerBlock block={tkBlock} locale="en" />);
      expect(html).toContain('2026');
    });
  });
});
