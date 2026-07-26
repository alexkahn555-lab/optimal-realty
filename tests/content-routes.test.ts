import { describe, expect, it } from 'vitest';
import {
  ALL_FAQS,
  publishedPortals,
  publishedSubpages,
  publishedTools,
} from '@/lib/content/loaders';
import { SELLERS_PORTAL } from '@/content/portals/sellers';
import { HOME_VALUATION_SUBPAGE } from '@/content/subpages/home-valuation';
import { SELLING_PROCESS_SUBPAGE } from '@/content/subpages/selling-process';
import { NET_PROCEEDS_TOOL } from '@/content/tools/net-proceeds';
import { href } from '@/lib/seo/href';

/**
 * Content ↔ route-registry consistency. Slugs are route-table data living in
 * lib/seo/href.ts; content files carry a matching `slug` field. A mismatch
 * would publish a URL the router can never serve — caught HERE.
 */

describe('content ↔ href registry consistency', () => {
  it('sellers portal slug matches PORTAL_SEG', () => {
    expect(href('portal.sellers', 'en')).toBe(`/en/${SELLERS_PORTAL.slug.en}`);
    expect(href('portal.sellers', 'es')).toBe(`/es/${SELLERS_PORTAL.slug.es}`);
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
    expect(publishedPortals().map((p) => p.id)).toEqual(['sellers']);
    expect(publishedSubpages().map((s) => s.id)).toEqual([
      'sellers-home-valuation',
      'sellers-selling-process',
    ]);
    expect(publishedTools().map((t) => t.id)).toEqual(['net-proceeds']);
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
