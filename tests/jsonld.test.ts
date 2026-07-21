import { describe, expect, it } from 'vitest';
import { entityGraph } from '@/lib/seo/jsonld';

describe('entityGraph()', () => {
  it('emits no TK_ marker (en and es)', () => {
    for (const locale of ['en', 'es'] as const) {
      const serialized = JSON.stringify(entityGraph(locale));
      expect(/\bTK_/.test(serialized)).toBe(false);
    }
  });

  it('declares exactly three unique @ids', () => {
    const graph = entityGraph('en') as { '@graph': Array<{ '@id'?: string }> };
    const ids = graph['@graph'].map((node) => node['@id']);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(3);
    expect(graph['@graph'].length).toBe(3);
  });

  it('emits the confirmed values', () => {
    const serialized = JSON.stringify(entityGraph('en'));
    for (const value of [
      'Optimal Realty',
      'Raul Perez',
      'BK3446865',
      'RD8416',
      'CAM64581',
      'Miami-Dade County',
    ]) {
      expect(serialized.includes(value)).toBe(true);
    }
  });
});
