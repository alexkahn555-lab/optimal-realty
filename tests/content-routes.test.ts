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
import { HOME_VALUATION_SUBPAGE } from '@/content/subpages/home-valuation';
import { SELLING_PROCESS_SUBPAGE } from '@/content/subpages/selling-process';
import { NET_PROCEEDS_TOOL } from '@/content/tools/net-proceeds';
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
    ]);
    expect(publishedTools().map((t) => t.id)).toEqual(['net-proceeds']);
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
