import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { UI } from '@/content/ui-strings';
import { BUYERS_PORTAL } from '@/content/portals/buyers';
import { INVESTORS_PORTAL } from '@/content/portals/investors';
import { LANDLORDS_PORTAL } from '@/content/portals/landlords';
import { SELLERS_PORTAL } from '@/content/portals/sellers';
import { TENANTS_PORTAL } from '@/content/portals/tenants';
import { HOME_VALUATION_SUBPAGE } from '@/content/subpages/home-valuation';
import { NET_PROCEEDS_TOOL } from '@/content/tools/net-proceeds';
import { PortalTemplate } from '@/components/portal/PortalTemplate';
import { SubpageTemplate } from '@/components/portal/SubpageTemplate';

/**
 * PortalTemplate slot behavior: empty advice/listings/faqs render NULL slots
 * (no orphan headings — client copy never blocks or litters a route), while
 * the structural slots always render. Also pins the hub → tool link and the
 * subpage FAQ dedup contract surface.
 *
 * The LeadForm island is stubbed with a props-echoing marker so the LeadCta
 * ATTRIBUTION each template passes (5c) is assertable from static markup —
 * the real island is exercised end-to-end in e2e/portals.spec.ts.
 */

vi.mock('@/components/forms/LeadFormLazy', () => ({
  LeadForm: (props: Record<string, unknown>) => (
    <div
      data-testid="leadform-stub"
      data-source-type={String(props.sourceType)}
      data-portal={String(props.portal)}
      data-intent={String(props.intent)}
    />
  ),
}));

describe('PortalTemplate', () => {
  const markup = renderToStaticMarkup(
    <PortalTemplate
      portal={SELLERS_PORTAL}
      tools={[NET_PROCEEDS_TOOL]}
      advice={[]}
      faqs={[]}
      locale="en"
    />
  );

  it('renders the structural slots', () => {
    expect(markup).toContain(SELLERS_PORTAL.answer.question.en);
    expect(markup).toContain(UI.sections.toolRack.en);
    expect(markup).toContain(UI.sections.decisionHeading.en);
    expect(markup).toContain(UI.sections.leadCtaHeading.en);
    // Mono numeral steps.
    expect(markup).toContain('01');
    expect(markup).toContain(SELLERS_PORTAL.decisionSteps[0]!.label.en);
    // Hub links to the tool route; no engine markup on the hub.
    expect(markup).toContain('href="/en/tools/net-proceeds"');
    expect(markup).not.toContain('data-testid="calc-headline"');
  });

  it('empty slots render null — no orphan headings', () => {
    expect(markup).not.toContain(UI.sections.adviceHeading.en);
    expect(markup).not.toContain(UI.sections.faqHeading.en);
  });

  it('featured listings lit up when Phase 4a registered active listings', () => {
    // Phase 1–3 this slot rendered null; the fixtures now populate it with
    // links into the listing reports (RelatedListings untouched, as designed).
    expect(markup).toContain(UI.sections.featuredListings.en);
    expect(markup).toContain(
      'href="/en/listings/100-fixture-boulevard-coral-gables"'
    );
  });

  it('Service JSON-LD references #agent and never redeclares it', () => {
    expect(markup).toContain('"@type":"Service"');
    expect(markup).toContain('"provider":{"@id"');
    expect(markup).not.toContain('"@type":"RealEstateAgent"');
  });

  it('the TK answer renders as a visible placeholder (5b, Part 3.2)', () => {
    expect(markup).toContain('⟨ TK · PORTAL_SELLERS_ANSWER ⟩');
  });

  it('the full document — prose, placeholders, JSON-LD — has no raw TK_ (5b)', () => {
    expect(markup).not.toMatch(/\bTK_/);
  });

  it('emits the WebPage node alongside Service (5c, Part 4.2)', () => {
    expect(markup).toContain('"@type":"WebPage"');
  });

  it('carries the sellers LeadCta attribution preset (5c)', () => {
    expect(markup).toContain('data-source-type="portal_cta"');
    expect(markup).toContain('data-portal="sellers"');
    expect(markup).toContain('data-intent="sell"');
  });
});

/**
 * Dispatch 5c — the four remaining hubs on the SAME template, no fork. Every
 * prose field is an unfilled placeholder marker: the hub must render visible
 * placeholders for the question (H1), answer, decision and steps; degrade
 * empty tool/advice/faq slots to null; emit Service + WebPage (no FAQPage);
 * carry the per-portal attribution preset; and serve zero raw TK_ strings.
 */
describe('PortalTemplate — the four remaining hubs (5c)', () => {
  const CASES = [
    { portal: BUYERS_PORTAL, intent: 'buy', rail: 'active' },
    { portal: INVESTORS_PORTAL, intent: 'invest', rail: 'sold' },
    { portal: LANDLORDS_PORTAL, intent: 'lease-out', rail: 'none' },
    { portal: TENANTS_PORTAL, intent: 'rent', rail: 'active' },
  ] as const;

  for (const { portal, intent, rail } of CASES) {
    describe(portal.id, () => {
      const byLocale = (['en', 'es'] as const).map((locale) => ({
        locale,
        markup: renderToStaticMarkup(
          <PortalTemplate
            portal={portal}
            tools={[]}
            advice={[]}
            faqs={[]}
            locale={locale}
          />
        ),
      }));
      const marker = `PORTAL_${portal.id.toUpperCase()}`;

      it('renders visible placeholders for question, answer, decision and steps — both locales', () => {
        for (const { markup } of byLocale) {
          expect(markup).toContain(`⟨ TK · ${marker}_QUESTION ⟩`);
          expect(markup).toContain(`⟨ TK · ${marker}_ANSWER ⟩`);
          expect(markup).toContain(`⟨ TK · ${marker}_DECISION ⟩`);
          for (let step = 1; step <= portal.decisionSteps.length; step += 1) {
            expect(markup).toContain(`⟨ TK · ${marker}_STEP_${step}_LABEL ⟩`);
            expect(markup).toContain(`⟨ TK · ${marker}_STEP_${step}_DETAIL ⟩`);
          }
          // The numbered scaffold renders even with unfilled text.
          expect(markup).toContain('01');
        }
      });

      it('serves zero raw TK_ strings — prose, head-adjacent markup, JSON-LD', () => {
        for (const { markup } of byLocale) {
          expect(markup).not.toMatch(/\bTK_/);
        }
      });

      it('breadcrumb degrades the unfilled title to the localized slug', () => {
        for (const { locale, markup } of byLocale) {
          expect(markup).toContain(`aria-current="page">${portal.slug[locale]}<`);
        }
      });

      it('empty tool/advice/faq slots render null — no orphan headings, no FAQPage', () => {
        for (const { markup } of byLocale) {
          expect(markup).not.toContain(UI.sections.toolRack.en);
          expect(markup).not.toContain(UI.sections.toolRack.es);
          expect(markup).not.toContain(UI.sections.adviceHeading.en);
          expect(markup).not.toContain(UI.sections.adviceHeading.es);
          expect(markup).not.toContain(UI.sections.faqHeading.en);
          expect(markup).not.toContain(UI.sections.faqHeading.es);
          expect(markup).not.toContain('"@type":"FAQPage"');
        }
      });

      it('emits Service (serviceType + provider → #agent) and WebPage, never redeclaring the agent', () => {
        for (const { markup } of byLocale) {
          expect(markup).toContain('"@type":"Service"');
          expect(markup).toContain(
            `"serviceType":"${portal.serviceSchema.serviceType}"`
          );
          expect(markup).toContain('"provider":{"@id"');
          expect(markup).toContain('"@type":"WebPage"');
          expect(markup).not.toContain('"@type":"RealEstateAgent"');
        }
      });

      it(`carries the LeadCta attribution preset {portal_cta, ${portal.id}, ${intent}}`, () => {
        for (const { markup } of byLocale) {
          expect(markup).toContain('data-source-type="portal_cta"');
          expect(markup).toContain(`data-portal="${portal.id}"`);
          expect(markup).toContain(`data-intent="${intent}"`);
        }
      });

      it(`featured listings rail: ${rail === 'none' ? 'null (nothing matches)' : `${rail} fixtures render`}`, () => {
        const markup = byLocale[0]!.markup;
        if (rail === 'none') {
          expect(markup).not.toContain(UI.sections.featuredListings.en);
        } else {
          expect(markup).toContain(UI.sections.featuredListings.en);
          expect(markup).toContain(
            rail === 'active'
              ? 'href="/en/listings/100-fixture-boulevard-coral-gables"'
              : 'href="/en/listings/300-example-court-palmetto-bay"'
          );
        }
      });
    });
  }
});

describe('SubpageTemplate', () => {
  const markup = renderToStaticMarkup(
    <SubpageTemplate
      subpage={HOME_VALUATION_SUBPAGE}
      portal={SELLERS_PORTAL}
      tools={[NET_PROCEEDS_TOOL]}
      advice={[]}
      faqs={[]}
      locale="es"
      leadIntent="valuation"
    />
  );

  it('renders article slots with localized crumbs and related tools', () => {
    expect(markup).toContain(HOME_VALUATION_SUBPAGE.answer.question.es);
    expect(markup).toContain(UI.sections.relatedTools.es);
    expect(markup).toContain('href="/es/vendedores"');
    expect(markup).toContain('"@type":"Article"');
    expect(markup).toContain('"author":{"@id"');
  });

  it('empty advice/faqs render null slots', () => {
    expect(markup).not.toContain(UI.sections.adviceHeading.es);
    expect(markup).not.toContain(UI.sections.faqHeading.es);
  });
});
