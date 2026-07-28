import { describe, expect, it } from 'vitest';
import {
  articleNode,
  entityGraph,
  pageGraph,
  serviceNode,
  webPageNode,
} from '@/lib/seo/jsonld';
import { BUYERS_PORTAL } from '@/content/portals/buyers';
import { SELLERS_PORTAL } from '@/content/portals/sellers';
import { FIRST_TIME_BUYER_PROGRAMS_SUBPAGE } from '@/content/subpages/first-time-buyer-programs';

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

/**
 * Dispatch 5c — the four new hubs carry TK title AND answer, so the Service
 * node is built with an unfilled name/description on every preview, and the
 * hub adds a WebPage node (Part 4.2). Both must strip to structural fields.
 */
describe('portal nodes from a TK-title portal (5c)', () => {
  it('the real buyers portal carries a TK title and question — the live fixture', () => {
    expect(BUYERS_PORTAL.title.en).toMatch(/^TK_/);
    expect(BUYERS_PORTAL.answer.question.en).toMatch(/^TK_/);
  });

  it('serviceNode: name and description omitted, serviceType + provider survive', () => {
    for (const locale of ['en', 'es'] as const) {
      const url = `https://example.com/${locale}/buyers`;
      const graph = pageGraph([serviceNode(BUYERS_PORTAL, url, locale)]);
      const serialized = JSON.stringify(graph);
      expect(serialized).not.toMatch(/\bTK_/);
      const service = graph['@graph'][0] as Record<string, unknown>;
      expect(service.name).toBeUndefined();
      expect(service.description).toBeUndefined();
      expect(service.serviceType).toBe(BUYERS_PORTAL.serviceSchema.serviceType);
      expect((service.provider as Record<string, string>)['@id']).toContain(
        '#agent'
      );
    }
  });

  it('webPageNode from TK name/description keeps structural fields only', () => {
    const url = 'https://example.com/en/buyers';
    const graph = pageGraph([
      webPageNode(
        BUYERS_PORTAL.title.en,
        BUYERS_PORTAL.answer.answer.en,
        url,
        'en',
        BUYERS_PORTAL.answer.updated
      ),
    ]);
    const serialized = JSON.stringify(graph);
    expect(serialized).not.toMatch(/\bTK_/);
    const page = graph['@graph'][0] as Record<string, unknown>;
    expect(page['@type']).toBe('WebPage');
    expect(page.name).toBeUndefined();
    expect(page.description).toBeUndefined();
    expect(page.url).toBe(url);
    expect(page.dateModified).toBe(BUYERS_PORTAL.answer.updated);
  });
});

/**
 * Dispatch 5d — the subpage Article node built from a fully-TK subpage
 * (Part 4.2): headline/description strip away, the author reference to the
 * #raul Person node and dateModified survive, the agent is never redeclared.
 */
describe('articleNode from a TK-title subpage (5d)', () => {
  it('the real buyers subpage carries TK title and question — the live fixture', () => {
    expect(FIRST_TIME_BUYER_PROGRAMS_SUBPAGE.title.en).toMatch(/^TK_/);
    expect(FIRST_TIME_BUYER_PROGRAMS_SUBPAGE.answer.question.en).toMatch(/^TK_/);
  });

  it('strips headline/description, keeps author → #raul and dateModified', () => {
    for (const locale of ['en', 'es'] as const) {
      const url = `https://example.com/${locale}/buyers/first-time-buyer-programs`;
      const graph = pageGraph([
        articleNode(FIRST_TIME_BUYER_PROGRAMS_SUBPAGE, url, locale),
      ]);
      const serialized = JSON.stringify(graph);
      expect(serialized).not.toMatch(/\bTK_/);
      const article = graph['@graph'][0] as Record<string, unknown>;
      expect(article['@type']).toBe('Article');
      expect(article.headline).toBeUndefined();
      expect(article.description).toBeUndefined();
      expect((article.author as Record<string, string>)['@id']).toContain(
        '#raul'
      );
      expect((article.publisher as Record<string, string>)['@id']).toContain(
        '#agent'
      );
      expect(article.dateModified).toBe(
        FIRST_TIME_BUYER_PROGRAMS_SUBPAGE.answer.updated
      );
      expect(serialized).not.toContain('"@type":"RealEstateAgent"');
    }
  });
});
