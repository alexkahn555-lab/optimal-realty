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
});
