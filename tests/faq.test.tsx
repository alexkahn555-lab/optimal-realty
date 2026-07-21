import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FaqSection, buildFaqPageNode } from '@/components/seo';

const mk = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    question: { en: `Q${i}`, es: `P${i}` },
    answer: { en: `A${i}`, es: `R${i}` },
  }));

describe('FaqSection / buildFaqPageNode', () => {
  it('renders null on empty', () => {
    expect(renderToStaticMarkup(<FaqSection items={[]} locale="en" />)).toBe('');
    expect(buildFaqPageNode([], 'en')).toBeNull();
  });

  it('renders native details for each item', () => {
    const html = renderToStaticMarkup(<FaqSection items={mk(2)} locale="en" />);
    expect(html).toContain('<details');
    expect(html).toContain('Q0');
    expect(html).toContain('A1');
  });

  it('caps DOM and schema at 8', () => {
    const html = renderToStaticMarkup(<FaqSection items={mk(10)} locale="en" />);
    expect((html.match(/<details/g) || []).length).toBe(8);
    const node = buildFaqPageNode(mk(10), 'en') as { mainEntity: unknown[] };
    expect(node.mainEntity.length).toBe(8);
  });
});
