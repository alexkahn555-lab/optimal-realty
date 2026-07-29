import { describe, expect, it } from 'vitest';
import {
  articleNode,
  entityGraph,
  pageGraph,
  placeNode,
  serviceNode,
  webApplicationNode,
  webPageNode,
} from '@/lib/seo/jsonld';
import { FIXTURE_PALMS_NEIGHBORHOOD } from '@/content/neighborhoods/fixture-palms';
import { BUYERS_PORTAL } from '@/content/portals/buyers';
import { SELLERS_PORTAL } from '@/content/portals/sellers';
import { FIRST_TIME_BUYER_PROGRAMS_SUBPAGE } from '@/content/subpages/first-time-buyer-programs';
import { CONDO_ASSESSMENT_TOOL } from '@/content/tools/condo-assessment-exposure';
import { TAX_RESET_TOOL } from '@/content/tools/property-tax-reset';
import { RENTAL_CASHFLOW_TOOL } from '@/content/tools/rental-cash-flow';
import { VACANCY_COST_TOOL } from '@/content/tools/vacancy-cost';

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
 * Dispatch 5e — the calculator WebApplication node built from a fully-TK tool
 * (Part 4.2): name/description strip away; the application category, OS, the
 * free-offer and the provider reference to #agent survive.
 */
describe('webApplicationNode from a TK-title tool (5e)', () => {
  it('the real vacancy tool carries a TK title and question — the live fixture', () => {
    expect(VACANCY_COST_TOOL.title.en).toMatch(/^TK_/);
    expect(VACANCY_COST_TOOL.answer.question.en).toMatch(/^TK_/);
  });

  it('strips name/description; keeps FinanceApplication, Web, price 0, provider', () => {
    // 5f/5g/5h: the same contract holds for every TK-title tool shipped so far.
    for (const tool of [
      VACANCY_COST_TOOL,
      RENTAL_CASHFLOW_TOOL,
      CONDO_ASSESSMENT_TOOL,
      TAX_RESET_TOOL,
    ]) {
      for (const locale of ['en', 'es'] as const) {
        const url = `https://example.com/${locale}/tools/${tool.slug[locale]}`;
        const graph = pageGraph([webApplicationNode(tool, url, locale)]);
        const serialized = JSON.stringify(graph);
        expect(serialized).not.toMatch(/\bTK_/);
        const app = graph['@graph'][0] as Record<string, unknown>;
        expect(app['@type']).toBe('WebApplication');
        expect(app.name).toBeUndefined();
        expect(app.description).toBeUndefined();
        expect(app.applicationCategory).toBe('FinanceApplication');
        expect(app.operatingSystem).toBe('Web');
        expect((app.offers as Record<string, unknown>).price).toBe('0');
        expect((app.provider as Record<string, string>)['@id']).toContain(
          '#agent'
        );
        expect(serialized).not.toContain('"@type":"RealEstateAgent"');
      }
    }
  });
});

/**
 * Dispatch 7a — the neighborhood Place node (Part 4.2): geo and
 * containedInPlace survive, the TK name strips away, and the type is Place —
 * deliberately never Dataset (the stats are single sourced values).
 */
describe('placeNode from the TK-named fixture (7a)', () => {
  it('strips the name; keeps geo + containedInPlace; is never a Dataset', () => {
    for (const locale of ['en', 'es'] as const) {
      const url = `https://example.com/${locale}/neighborhoods/fixture-palms-example`;
      const graph = pageGraph([
        placeNode(FIXTURE_PALMS_NEIGHBORHOOD, url, locale),
      ]);
      const serialized = JSON.stringify(graph);
      expect(serialized).not.toMatch(/\bTK_/);
      const place = graph['@graph'][0] as Record<string, unknown>;
      expect(place['@type']).toBe('Place');
      expect(place.name).toBeUndefined();
      const geo = place.geo as Record<string, unknown>;
      expect(geo['@type']).toBe('GeoCoordinates');
      expect(geo.latitude).toBe(25.75);
      expect(
        (place.containedInPlace as Record<string, unknown>).name
      ).toBe('Miami-Dade County');
      expect(serialized).not.toContain('"@type":"Dataset"');
      expect(serialized).not.toContain('"@type":"RealEstateAgent"');
    }
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
