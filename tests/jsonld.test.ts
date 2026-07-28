import { describe, expect, it } from 'vitest';
import { entityGraph, pageGraph, serviceNode } from '@/lib/seo/jsonld';
import { SELLERS_PORTAL } from '@/content/portals/sellers';

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

/**
 * Dispatch 5b — the AnswerBlock JSON-LD path. The sellers answer is a TK_
 * placeholder AND the portal publishes (report mode), so the Service node is
 * built from a TK-answer portal on every preview: pageGraph's stripTK must
 * drop the marker before it can reach a <script> tag.
 */
describe('serviceNode from a TK-answer portal (5b)', () => {
  it('the real sellers portal carries a TK answer — the live fixture', () => {
    expect(SELLERS_PORTAL.answer.answer.en).toMatch(/^TK_/);
  });

  it('pageGraph strips the marker: no TK_ anywhere, description omitted', () => {
    for (const locale of ['en', 'es'] as const) {
      const url = `https://example.com/${locale}/sellers`;
      const graph = pageGraph([serviceNode(SELLERS_PORTAL, url, locale)]);
      const serialized = JSON.stringify(graph);
      expect(serialized).not.toMatch(/\bTK_/);
      const service = graph['@graph'][0] as Record<string, unknown>;
      expect(service.description).toBeUndefined();
      // Confirmed fields survive the strip.
      expect(service.name).toBe(SELLERS_PORTAL.title[locale]);
      expect(service.serviceType).toBe(SELLERS_PORTAL.serviceSchema.serviceType);
    }
  });
});
