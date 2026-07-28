import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ALL_FAQS,
  portalLabel,
  publishedPortals,
  publishedSubpages,
  publishedTools,
} from '@/lib/content/loaders';
import { BUYERS_PORTAL } from '@/content/portals/buyers';
import { INVESTORS_PORTAL } from '@/content/portals/investors';
import { LANDLORDS_PORTAL } from '@/content/portals/landlords';
import { SELLERS_PORTAL } from '@/content/portals/sellers';
import { TENANTS_PORTAL } from '@/content/portals/tenants';
import { EXCHANGE_1031_SUBPAGE } from '@/content/subpages/1031-exchange';
import { FIRST_TIME_BUYER_PROGRAMS_SUBPAGE } from '@/content/subpages/first-time-buyer-programs';
import { HOME_VALUATION_SUBPAGE } from '@/content/subpages/home-valuation';
import { PROPERTY_MANAGEMENT_SUBPAGE } from '@/content/subpages/property-management';
import { SELLING_PROCESS_SUBPAGE } from '@/content/subpages/selling-process';
import { CONDO_ASSESSMENT_TOOL } from '@/content/tools/condo-assessment-exposure';
import { TAX_RESET_TOOL } from '@/content/tools/property-tax-reset';
import { NET_PROCEEDS_TOOL } from '@/content/tools/net-proceeds';
import { RENTAL_CASHFLOW_TOOL } from '@/content/tools/rental-cash-flow';
import { VACANCY_COST_TOOL } from '@/content/tools/vacancy-cost';
import { AnswerBlock } from '@/components/seo';
import { href } from '@/lib/seo/href';
import { metaFor } from '@/lib/seo/meta';

/**
 * Content ↔ route-registry consistency. Slugs are route-table data living in
 * lib/seo/href.ts; content files carry a matching `slug` field. A mismatch
 * would publish a URL the router can never serve — caught HERE.
 */

const ALL_PORTALS = [
  SELLERS_PORTAL,
  BUYERS_PORTAL,
  INVESTORS_PORTAL,
  LANDLORDS_PORTAL,
  TENANTS_PORTAL,
] as const;

const NEW_PORTALS = [
  BUYERS_PORTAL,
  INVESTORS_PORTAL,
  LANDLORDS_PORTAL,
  TENANTS_PORTAL,
] as const;

/** 5d — the three remaining subpages, paired with their parent portals. */
const NEW_SUBPAGES = [
  { subpage: FIRST_TIME_BUYER_PROGRAMS_SUBPAGE, portal: BUYERS_PORTAL },
  { subpage: EXCHANGE_1031_SUBPAGE, portal: INVESTORS_PORTAL },
  { subpage: PROPERTY_MANAGEMENT_SUBPAGE, portal: LANDLORDS_PORTAL },
] as const;

describe('content ↔ href registry consistency', () => {
  it('sellers portal slug matches PORTAL_SEG', () => {
    expect(href('portal.sellers', 'en')).toBe(`/en/${SELLERS_PORTAL.slug.en}`);
    expect(href('portal.sellers', 'es')).toBe(`/es/${SELLERS_PORTAL.slug.es}`);
  });

  it('every portal slug matches PORTAL_SEG in both locales (5c)', () => {
    for (const portal of ALL_PORTALS) {
      for (const locale of ['en', 'es'] as const) {
        expect(href(`portal.${portal.id}`, locale)).toBe(
          `/${locale}/${portal.slug[locale]}`
        );
      }
    }
  });

  it('subpage slugs match SUBPAGE_SEG (portal-parented)', () => {
    for (const subpage of [HOME_VALUATION_SUBPAGE, SELLING_PROCESS_SUBPAGE]) {
      for (const locale of ['en', 'es'] as const) {
        expect(href(`subpage.${subpage.id}`, locale)).toBe(
          `/${locale}/${SELLERS_PORTAL.slug[locale]}/${subpage.slug[locale]}`
        );
      }
    }
  });

  it('the 5d subpage slugs match SUBPAGE_SEG under their parent portals', () => {
    for (const { subpage, portal } of NEW_SUBPAGES) {
      expect(subpage.portalId).toBe(portal.id);
      expect(portal.subpageIds).toContain(subpage.id);
      for (const locale of ['en', 'es'] as const) {
        expect(href(`subpage.${subpage.id}`, locale)).toBe(
          `/${locale}/${portal.slug[locale]}/${subpage.slug[locale]}`
        );
      }
    }
  });

  it('tool slug matches TOOL_SLUG (dispatch route table)', () => {
    expect(href('tool.net-proceeds', 'en')).toBe(
      `/en/tools/${NET_PROCEEDS_TOOL.slug.en}`
    );
    expect(href('tool.net-proceeds', 'es')).toBe(
      `/es/herramientas/${NET_PROCEEDS_TOOL.slug.es}`
    );
  });

  it('the seller path is published (the TK gate passes on indexable surfaces)', () => {
    // 5c: all five hubs publish in report mode — sellers plus the four
    // registered by this dispatch, in route-map order.
    expect(publishedPortals().map((p) => p.id)).toEqual([
      'sellers',
      'buyers',
      'investors',
      'landlords',
      'tenants',
    ]);
    expect(publishedSubpages().map((s) => s.id)).toEqual([
      'sellers-home-valuation',
      'sellers-selling-process',
      'buyers-first-time-buyer-programs',
      'investors-1031-exchange',
      'landlords-property-management',
    ]);
    expect(publishedTools().map((t) => t.id)).toEqual([
      'net-proceeds',
      'vacancy-cost',
      'rental-cashflow',
      'condo-assessment',
      'tax-reset',
    ]);
  });

  it('the tax-reset tool slug matches TOOL_SLUG (5h route map)', () => {
    expect(href('tool.tax-reset', 'en')).toBe(
      `/en/tools/${TAX_RESET_TOOL.slug.en}`
    );
    expect(href('tool.tax-reset', 'es')).toBe(
      `/es/herramientas/${TAX_RESET_TOOL.slug.es}`
    );
    expect(TAX_RESET_TOOL.slug.en).toBe('property-tax-reset');
    expect(TAX_RESET_TOOL.slug.es).toBe('reajuste-del-impuesto-predial');
    expect(TAX_RESET_TOOL.engineId).toBe('tax-reset');
    expect(TAX_RESET_TOOL.portalIds).toEqual(['buyers']);
  });

  it('the condo-assessment tool slug matches TOOL_SLUG (5g route map)', () => {
    expect(href('tool.condo-assessment', 'en')).toBe(
      `/en/tools/${CONDO_ASSESSMENT_TOOL.slug.en}`
    );
    expect(href('tool.condo-assessment', 'es')).toBe(
      `/es/herramientas/${CONDO_ASSESSMENT_TOOL.slug.es}`
    );
    expect(CONDO_ASSESSMENT_TOOL.slug.en).toBe('condo-assessment-exposure');
    expect(CONDO_ASSESSMENT_TOOL.slug.es).toBe('exposicion-a-cuotas-especiales');
    expect(CONDO_ASSESSMENT_TOOL.engineId).toBe('condo-assessment');
    // Part 2.2: this tool serves BOTH buyers and investors.
    expect(CONDO_ASSESSMENT_TOOL.portalIds).toEqual(['buyers', 'investors']);
  });

  it('the rental-cashflow tool slug matches TOOL_SLUG (5f route map)', () => {
    expect(href('tool.rental-cashflow', 'en')).toBe(
      `/en/tools/${RENTAL_CASHFLOW_TOOL.slug.en}`
    );
    expect(href('tool.rental-cashflow', 'es')).toBe(
      `/es/herramientas/${RENTAL_CASHFLOW_TOOL.slug.es}`
    );
    expect(RENTAL_CASHFLOW_TOOL.slug.en).toBe('rental-cash-flow');
    expect(RENTAL_CASHFLOW_TOOL.slug.es).toBe('flujo-de-caja');
    expect(RENTAL_CASHFLOW_TOOL.engineId).toBe('rental-cashflow');
    expect(RENTAL_CASHFLOW_TOOL.portalIds).toEqual(['investors']);
  });

  it('the vacancy-cost tool slug matches TOOL_SLUG (5e route map)', () => {
    expect(href('tool.vacancy-cost', 'en')).toBe(
      `/en/tools/${VACANCY_COST_TOOL.slug.en}`
    );
    expect(href('tool.vacancy-cost', 'es')).toBe(
      `/es/herramientas/${VACANCY_COST_TOOL.slug.es}`
    );
    expect(VACANCY_COST_TOOL.engineId).toBe('vacancy-cost');
    expect(VACANCY_COST_TOOL.portalIds).toEqual(['landlords']);
  });
});

/**
 * Dispatch 5b — Part 3.2 mode-sensitive answer gate. The sellers answer is a
 * TK_ placeholder marker (broker counsel), and the portal must STILL publish
 * in report mode: the preview with the visible placeholder is the instrument
 * that gets the client to respond. Strict mode retains the unpublish as
 * defense in depth (unreachable in practice — check-content.mjs fails the
 * prebuild first).
 */
describe('mode-sensitive answer publish gate (5b)', () => {
  afterEach(() => {
    delete process.env.CONTENT_STRICT;
  });

  it('the sellers answer IS a TK placeholder — the fixture this gate exists for', () => {
    expect(SELLERS_PORTAL.answer.answer.en).toMatch(/^TK_/);
    expect(SELLERS_PORTAL.answer.answer.es).toMatch(/^TK_/);
  });

  it('report mode (default): a TK-answer portal still publishes', () => {
    expect(publishedPortals().map((p) => p.id)).toContain('sellers');
  });

  it('strict mode: the TK-answer portal unpublishes (defense in depth)', () => {
    process.env.CONTENT_STRICT = '1';
    expect(publishedPortals().map((p) => p.id)).not.toContain('sellers');
    // Clean-answer entities are untouched by the mode switch.
    expect(publishedSubpages().map((s) => s.id)).toEqual([
      'sellers-home-valuation',
      'sellers-selling-process',
    ]);
  });

  it('the published TK answer renders as a visible placeholder, never raw prose', () => {
    const markup = renderToStaticMarkup(
      createElement(AnswerBlock, { block: SELLERS_PORTAL.answer, locale: 'en' })
    );
    expect(markup).toContain('PORTAL_SELLERS_ANSWER'); // ⟨ TK · PORTAL_SELLERS_ANSWER ⟩
    expect(markup).not.toMatch(/\bTK_/);
  });

  it('the sellers meta description is the title, never a marker', () => {
    for (const locale of ['en', 'es'] as const) {
      const meta = metaFor(
        {
          id: 'portal.sellers',
          title: SELLERS_PORTAL.title,
          description: SELLERS_PORTAL.answer.answer,
        },
        locale
      );
      expect(meta.description).toBe(SELLERS_PORTAL.title[locale]);
      expect(JSON.stringify(meta)).not.toMatch(/\bTK_/);
    }
  });
});

/**
 * Dispatch 5c — Part 3.2 mode split extended to the QUESTION (the H1) and the
 * portal TITLE. The four remaining hubs ship every prose field as a TK_
 * placeholder marker and must STILL publish in report mode; strict mode
 * retains the unpublish as defense in depth (check-content.mjs fails the
 * prebuild first).
 */
describe('mode-sensitive question/title publish gate (5c)', () => {
  afterEach(() => {
    delete process.env.CONTENT_STRICT;
  });

  it('the four new hubs carry TK question, answer and title — the live fixtures', () => {
    for (const portal of NEW_PORTALS) {
      for (const locale of ['en', 'es'] as const) {
        expect(portal.answer.question[locale]).toMatch(/^TK_/);
        expect(portal.answer.answer[locale]).toMatch(/^TK_/);
        expect(portal.title[locale]).toMatch(/^TK_/);
        expect(portal.decision[locale]).toMatch(/^TK_/);
      }
    }
  });

  it('report mode (default): all four TK-question hubs publish', () => {
    const ids = publishedPortals().map((p) => p.id);
    for (const portal of NEW_PORTALS) expect(ids).toContain(portal.id);
  });

  it('strict mode: every TK-surfaced portal unpublishes (defense in depth)', () => {
    process.env.CONTENT_STRICT = '1';
    expect(publishedPortals()).toEqual([]);
  });

  it('portalLabel degrades an unfilled title to the structural slug', () => {
    for (const portal of NEW_PORTALS) {
      expect(portalLabel(portal)).toEqual(portal.slug);
    }
    // A filled title is used verbatim — sellers is the live clean fixture.
    expect(portalLabel(SELLERS_PORTAL)).toEqual(SELLERS_PORTAL.title);
  });

  it('metaFor for each new hub falls to the site name — never a marker', () => {
    for (const portal of NEW_PORTALS) {
      for (const locale of ['en', 'es'] as const) {
        const meta = metaFor(
          {
            id: `portal.${portal.id}`,
            title: portal.title,
            description: portal.answer.answer,
          },
          locale
        );
        expect(meta.title).toBeUndefined();
        expect(meta.description).toBe('Optimal Realty');
        expect((meta.openGraph as { title?: string }).title).toBe('Optimal Realty');
        expect(JSON.stringify(meta)).not.toMatch(/\bTK_/);
      }
    }
  });
});

/**
 * Dispatch 5d — the 5c mode split, exercised on SUBPAGES: the three remaining
 * subpages ship title, question and answer as TK_ placeholder markers and
 * must STILL publish in report mode; strict mode unpublishes them while the
 * clean sellers subpages stay (asserted in the 5b describe above).
 */
describe('mode-sensitive subpage publish gate (5d)', () => {
  afterEach(() => {
    delete process.env.CONTENT_STRICT;
  });

  it('the three new subpages carry TK title, question and answer — the live fixtures', () => {
    for (const { subpage } of NEW_SUBPAGES) {
      for (const locale of ['en', 'es'] as const) {
        expect(subpage.title[locale]).toMatch(/^TK_/);
        expect(subpage.answer.question[locale]).toMatch(/^TK_/);
        expect(subpage.answer.answer[locale]).toMatch(/^TK_/);
      }
      expect(subpage.adviceIds).toEqual([]);
      expect(subpage.relatedToolIds).toEqual([]);
      expect(subpage.faqIds).toEqual([]);
    }
  });

  it('report mode (default): all three TK subpages publish', () => {
    const ids = publishedSubpages().map((s) => s.id);
    for (const { subpage } of NEW_SUBPAGES) expect(ids).toContain(subpage.id);
  });

  it('strict mode: the TK subpages unpublish; sellers subpages stay', () => {
    process.env.CONTENT_STRICT = '1';
    expect(publishedSubpages().map((s) => s.id)).toEqual([
      'sellers-home-valuation',
      'sellers-selling-process',
    ]);
  });

  it('portalLabel degrades an unfilled subpage title to the structural slug', () => {
    for (const { subpage } of NEW_SUBPAGES) {
      expect(portalLabel(subpage)).toEqual(subpage.slug);
    }
    // A filled subpage title is used verbatim.
    expect(portalLabel(HOME_VALUATION_SUBPAGE)).toEqual(
      HOME_VALUATION_SUBPAGE.title
    );
  });

  it('metaFor for each new subpage falls to the site name — never a marker', () => {
    for (const { subpage } of NEW_SUBPAGES) {
      for (const locale of ['en', 'es'] as const) {
        const meta = metaFor(
          {
            id: `subpage.${subpage.id}`,
            title: subpage.title,
            description: subpage.answer.answer,
          },
          locale
        );
        expect(meta.title).toBeUndefined();
        expect(meta.description).toBe('Optimal Realty');
        expect(JSON.stringify(meta)).not.toMatch(/\bTK_/);
      }
    }
  });
});

/**
 * Dispatch 5e — the 5c/5d mode split, exercised on the TOOL: vacancy-cost
 * ships title, question, answer, method note and disclaimer as TK_ markers
 * and must STILL publish in report mode; strict unpublishes it while the
 * clean net-proceeds tool stays.
 */
describe('mode-sensitive tool publish gate (5e)', () => {
  afterEach(() => {
    delete process.env.CONTENT_STRICT;
  });

  it('the vacancy tool carries TK title, question, answer, method and disclaimer', () => {
    for (const locale of ['en', 'es'] as const) {
      expect(VACANCY_COST_TOOL.title[locale]).toMatch(/^TK_/);
      expect(VACANCY_COST_TOOL.answer.question[locale]).toMatch(/^TK_/);
      expect(VACANCY_COST_TOOL.answer.answer[locale]).toMatch(/^TK_/);
      expect(VACANCY_COST_TOOL.methodNote[locale]).toMatch(/^TK_/);
      expect(VACANCY_COST_TOOL.disclaimer[locale]).toMatch(/^TK_/);
    }
    expect(VACANCY_COST_TOOL.faqIds).toEqual([]);
    expect(VACANCY_COST_TOOL.leadCapture.enabled).toBe(true);
  });

  it('report mode (default): the TK tool publishes', () => {
    expect(publishedTools().map((t) => t.id)).toContain('vacancy-cost');
  });

  it('strict mode: the TK tools unpublish; net-proceeds stays', () => {
    process.env.CONTENT_STRICT = '1';
    expect(publishedTools().map((t) => t.id)).toEqual(['net-proceeds']);
  });

  it('portalLabel degrades the unfilled tool titles to the structural slugs', () => {
    expect(portalLabel(VACANCY_COST_TOOL)).toEqual(VACANCY_COST_TOOL.slug);
    expect(portalLabel(RENTAL_CASHFLOW_TOOL)).toEqual(RENTAL_CASHFLOW_TOOL.slug);
    expect(portalLabel(CONDO_ASSESSMENT_TOOL)).toEqual(CONDO_ASSESSMENT_TOOL.slug);
    expect(portalLabel(TAX_RESET_TOOL)).toEqual(TAX_RESET_TOOL.slug);
    expect(portalLabel(NET_PROCEEDS_TOOL)).toEqual(NET_PROCEEDS_TOOL.title);
  });

  it('the tax tool carries TK prose everywhere; metaFor falls to the site name (5h)', () => {
    for (const locale of ['en', 'es'] as const) {
      expect(TAX_RESET_TOOL.title[locale]).toMatch(/^TK_/);
      expect(TAX_RESET_TOOL.answer.question[locale]).toMatch(/^TK_/);
      expect(TAX_RESET_TOOL.answer.answer[locale]).toMatch(/^TK_/);
      expect(TAX_RESET_TOOL.methodNote[locale]).toMatch(/^TK_/);
      expect(TAX_RESET_TOOL.disclaimer[locale]).toMatch(/^TK_/);
      const meta = metaFor(
        {
          id: 'tool.tax-reset',
          title: TAX_RESET_TOOL.title,
          description: TAX_RESET_TOOL.answer.answer,
        },
        locale
      );
      expect(meta.title).toBeUndefined();
      expect(meta.description).toBe('Optimal Realty');
      expect(JSON.stringify(meta)).not.toMatch(/\bTK_/);
    }
    expect(TAX_RESET_TOOL.faqIds).toEqual([]);
    expect(TAX_RESET_TOOL.leadCapture.enabled).toBe(true);
  });

  it('the condo tool carries TK prose everywhere; metaFor falls to the site name (5g)', () => {
    for (const locale of ['en', 'es'] as const) {
      expect(CONDO_ASSESSMENT_TOOL.title[locale]).toMatch(/^TK_/);
      expect(CONDO_ASSESSMENT_TOOL.answer.question[locale]).toMatch(/^TK_/);
      expect(CONDO_ASSESSMENT_TOOL.answer.answer[locale]).toMatch(/^TK_/);
      expect(CONDO_ASSESSMENT_TOOL.methodNote[locale]).toMatch(/^TK_/);
      expect(CONDO_ASSESSMENT_TOOL.disclaimer[locale]).toMatch(/^TK_/);
      const meta = metaFor(
        {
          id: 'tool.condo-assessment',
          title: CONDO_ASSESSMENT_TOOL.title,
          description: CONDO_ASSESSMENT_TOOL.answer.answer,
        },
        locale
      );
      expect(meta.title).toBeUndefined();
      expect(meta.description).toBe('Optimal Realty');
      expect(JSON.stringify(meta)).not.toMatch(/\bTK_/);
    }
    expect(CONDO_ASSESSMENT_TOOL.faqIds).toEqual([]);
    expect(CONDO_ASSESSMENT_TOOL.leadCapture.enabled).toBe(true);
  });

  it('the rental tool carries TK prose everywhere; metaFor falls to the site name (5f)', () => {
    for (const locale of ['en', 'es'] as const) {
      expect(RENTAL_CASHFLOW_TOOL.title[locale]).toMatch(/^TK_/);
      expect(RENTAL_CASHFLOW_TOOL.answer.question[locale]).toMatch(/^TK_/);
      expect(RENTAL_CASHFLOW_TOOL.answer.answer[locale]).toMatch(/^TK_/);
      expect(RENTAL_CASHFLOW_TOOL.methodNote[locale]).toMatch(/^TK_/);
      expect(RENTAL_CASHFLOW_TOOL.disclaimer[locale]).toMatch(/^TK_/);
      const meta = metaFor(
        {
          id: 'tool.rental-cashflow',
          title: RENTAL_CASHFLOW_TOOL.title,
          description: RENTAL_CASHFLOW_TOOL.answer.answer,
        },
        locale
      );
      expect(meta.title).toBeUndefined();
      expect(meta.description).toBe('Optimal Realty');
      expect(JSON.stringify(meta)).not.toMatch(/\bTK_/);
    }
    expect(RENTAL_CASHFLOW_TOOL.faqIds).toEqual([]);
    expect(RENTAL_CASHFLOW_TOOL.leadCapture.enabled).toBe(true);
  });

  it('metaFor for the tool falls to the site name — never a marker', () => {
    for (const locale of ['en', 'es'] as const) {
      const meta = metaFor(
        {
          id: 'tool.vacancy-cost',
          title: VACANCY_COST_TOOL.title,
          description: VACANCY_COST_TOOL.answer.answer,
        },
        locale
      );
      expect(meta.title).toBeUndefined();
      expect(meta.description).toBe('Optimal Realty');
      expect(JSON.stringify(meta)).not.toMatch(/\bTK_/);
    }
  });
});

describe('FAQ pool integrity', () => {
  it('faq ids are globally unique', () => {
    const ids = ALL_FAQS.map((faq) => faq.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every referenced faqId exists in the pool', () => {
    const ids = new Set(ALL_FAQS.map((faq) => faq.id));
    const referenced = [
      ...SELLERS_PORTAL.faqIds,
      ...HOME_VALUATION_SUBPAGE.faqIds,
      ...SELLING_PROCESS_SUBPAGE.faqIds,
      ...NET_PROCEEDS_TOOL.faqIds,
    ];
    for (const id of referenced) expect(ids.has(id), id).toBe(true);
  });

  it('subpage faqIds never repeat hub faqIds (one FAQPage node per question)', () => {
    for (const subpage of [HOME_VALUATION_SUBPAGE, SELLING_PROCESS_SUBPAGE]) {
      for (const id of subpage.faqIds) {
        expect(SELLERS_PORTAL.faqIds).not.toContain(id);
      }
    }
  });
});
