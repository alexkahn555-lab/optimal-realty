import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SITE_ORIGIN } from '@/config/origin';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { ContactView } from '@/app/[locale]/[section]/contact-view';
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

  /**
   * Dispatch 6b — with a real origin configured (setup.ts), every @id resolves
   * on it and the placeholder host reaches no built artifact. (With no origin,
   * stripTK already drops the TK-carrying @ids — the closed state self-cleans.)
   */
  it('every @id resolves on the configured origin — never the placeholder', () => {
    const graph = entityGraph('en') as unknown as {
      '@graph': Array<{ '@id'?: string }>;
    };
    const ids = graph['@graph'].map((node) => String(node['@id']));
    expect(ids).toHaveLength(3);
    for (const id of ids) {
      expect(id.startsWith(`${SITE_ORIGIN}/#`)).toBe(true);
    }
    expect(JSON.stringify(graph)).not.toContain('TK_DOMAIN.example');
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
 * Dispatch 6c — the two page-local JSON-LD builders (the Breadcrumbs
 * component and the contact view's graph) route through the SAME stripTK
 * path pageGraph() uses. 6b found both interpolating ${SITE_ORIGIN} raw, so
 * every closed-state page served "item":"https://TK_DOMAIN.example/..." in
 * structured data — live on production, which runs closed today.
 *
 * Open-state output is pinned BYTE-FOR-BYTE against the pre-6c serialized
 * form (templated on SITE_ORIGIN); closed-state output is pinned exactly,
 * with URL-carrying properties omitted entirely — never partial, never a
 * placeholder value.
 */
describe('page-local builders route through stripTK (6c)', () => {
  const ENV_KEY = 'NEXT_PUBLIC_SITE_ORIGIN';
  const initial = process.env[ENV_KEY];

  afterEach(() => {
    if (initial === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = initial;
    vi.resetModules();
  });

  const CRUMBS = [
    { id: 'home', label: { en: 'Home', es: 'Inicio' } },
    { id: 'tools', label: { en: 'Tools', es: 'Herramientas' } },
  ] as const;

  function ldScripts(markup: string): string[] {
    return [
      ...markup.matchAll(
        /<script type="application\/ld\+json">(.*?)<\/script>/gs
      ),
    ].map((m) => m[1] ?? '');
  }

  it('Breadcrumbs OPEN: byte-identical to the pre-6c serialized form', () => {
    const markup = renderToStaticMarkup(
      createElement(Breadcrumbs, { items: [...CRUMBS], locale: 'en' })
    );
    const [script] = ldScripts(markup);
    expect(script).toBe(
      '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[' +
        `{"@type":"ListItem","position":1,"name":"Home","item":"${SITE_ORIGIN}/en"},` +
        `{"@type":"ListItem","position":2,"name":"Tools","item":"${SITE_ORIGIN}/en/tools"}]}`
    );
  });

  it('Breadcrumbs CLOSED: item omitted entirely — no marker, no partial', async () => {
    delete process.env[ENV_KEY];
    vi.resetModules();
    const { Breadcrumbs: ClosedBreadcrumbs } = await import(
      '@/components/seo/Breadcrumbs'
    );
    const markup = renderToStaticMarkup(
      createElement(ClosedBreadcrumbs, { items: [...CRUMBS], locale: 'en' })
    );
    const [script] = ldScripts(markup);
    expect(script).toBe(
      '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[' +
        '{"@type":"ListItem","position":1,"name":"Home"},' +
        '{"@type":"ListItem","position":2,"name":"Tools"}]}'
    );
    expect(markup).not.toMatch(/\bTK_/);
  });

  it('contact graph OPEN: byte-identical to the pre-6c serialized form', () => {
    const markup = renderToStaticMarkup(
      createElement(ContactView, { locale: 'en' })
    );
    const script = ldScripts(markup).find((s) => s.includes('"ContactPage"'));
    expect(script).toBe(
      '{"@context":"https://schema.org","@graph":[' +
        `{"@type":"ContactPage","@id":"${SITE_ORIGIN}/en/contact#contactpage","url":"${SITE_ORIGIN}/en/contact",` +
        '"name":"How do I contact Optimal Realty?","inLanguage":"en","dateModified":"2026-07-20",' +
        `"about":{"@id":"${SITE_ORIGIN}/#agent"}},` +
        `{"@type":"RealEstateAgent","@id":"${SITE_ORIGIN}/#agent","contactPoint":` +
        '{"@type":"ContactPoint","contactType":"customer service","availableLanguage":["en","es"]}}]}'
    );
  });

  it('contact graph CLOSED: @ids, url and the emptied about ref all omitted', async () => {
    delete process.env[ENV_KEY];
    vi.resetModules();
    const { ContactView: ClosedContactView } = await import(
      '@/app/[locale]/[section]/contact-view'
    );
    const markup = renderToStaticMarkup(
      createElement(ClosedContactView, { locale: 'en' })
    );
    const script = ldScripts(markup).find((s) => s.includes('"ContactPage"'));
    expect(script).toBe(
      '{"@context":"https://schema.org","@graph":[' +
        '{"@type":"ContactPage","name":"How do I contact Optimal Realty?","inLanguage":"en","dateModified":"2026-07-20"},' +
        '{"@type":"RealEstateAgent","contactPoint":' +
        '{"@type":"ContactPoint","contactType":"customer service","availableLanguage":["en","es"]}}]}'
    );
    expect(script).not.toMatch(/\bTK_/);
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
