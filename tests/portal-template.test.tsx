import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { UI } from '@/content/ui-strings';
import { LEGAL_PAGES } from '@/content/legal';
import { LISTING_L_2026_001 } from '@/content/listings/l-2026-001';
import { AboutTemplate } from '@/components/portal/AboutTemplate';
import { AdviceList } from '@/components/portal/AdviceList';
import { LegalTemplate } from '@/components/portal/LegalTemplate';
import { FeatureGroups } from '@/components/listing/FeatureGroups';
import { NeighborhoodContext } from '@/components/listing/NeighborhoodContext';
import { BUYERS_PORTAL } from '@/content/portals/buyers';
import { INVESTORS_PORTAL } from '@/content/portals/investors';
import { LANDLORDS_PORTAL } from '@/content/portals/landlords';
import { SELLERS_PORTAL } from '@/content/portals/sellers';
import { TENANTS_PORTAL } from '@/content/portals/tenants';
import { EXCHANGE_1031_SUBPAGE } from '@/content/subpages/1031-exchange';
import { FIRST_TIME_BUYER_PROGRAMS_SUBPAGE } from '@/content/subpages/first-time-buyer-programs';
import { HOME_VALUATION_SUBPAGE } from '@/content/subpages/home-valuation';
import { PROPERTY_MANAGEMENT_SUBPAGE } from '@/content/subpages/property-management';
import { NET_PROCEEDS_TOOL } from '@/content/tools/net-proceeds';
import { PORTAL_INTENT, PortalTemplate } from '@/components/portal/PortalTemplate';
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

// 6a sweep: NeighborhoodContext resolves through publishedNeighborhoods(),
// which is EMPTY until Phase 7 — inject one TK-answer neighborhood so the
// guard is exercisable without touching content/ (everything else real).
vi.mock('@/lib/content/loaders', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/content/loaders')>();
  return {
    ...mod,
    publishedNeighborhoods: () => [
      {
        id: 'test-nbhd',
        slug: 'test-nbhd',
        name: { en: 'Test Neighborhood', es: 'Vecindario de Prueba' },
        county: 'Miami-Dade',
        status: 'published',
        answer: {
          question: { en: 'What is it like?', es: '¿Cómo es?' },
          answer: { en: 'TK_NBHD_TEST_ANSWER', es: 'TK_NBHD_TEST_ANSWER' },
          updated: '2026-07-28',
        },
        overview: { en: 'TK_NBHD_TEST_OVERVIEW', es: 'TK_NBHD_TEST_OVERVIEW' },
        geo: { lat: 25.7, lng: -80.2 },
        relatedPortalIds: [],
        faqIds: [],
        priority: 1,
      },
    ],
  };
});

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

  it('the proof rail renders null while only fixtures exist (5d inversion)', () => {
    // INVERTED by dispatch 5d (explicitly sanctioned): 4c's discovery rule
    // extends to proof rails — a demonstration listing never sits where
    // proof of a real deal sits. Real listings re-light this slot.
    expect(markup).not.toContain(UI.sections.featuredListings.en);
    expect(markup).not.toContain('100-fixture-boulevard-coral-gables');
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
    { portal: BUYERS_PORTAL, intent: 'buy' },
    { portal: INVESTORS_PORTAL, intent: 'invest' },
    { portal: LANDLORDS_PORTAL, intent: 'lease-out' },
    { portal: TENANTS_PORTAL, intent: 'rent' },
  ] as const;

  for (const { portal, intent } of CASES) {
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

      it('the proof rail renders null — fixtures never sit in a proof position (5d inversion)', () => {
        // INVERTED by dispatch 5d (explicitly sanctioned): the 5c assertions
        // rendered active/sold fixtures in the buyers/tenants/investors rails.
        for (const { markup } of byLocale) {
          expect(markup).not.toContain(UI.sections.featuredListings.en);
          expect(markup).not.toContain('fixture-boulevard');
          expect(markup).not.toContain('example-court');
          expect(markup).not.toContain('fixture-condo');
        }
      });
    });
  }
});

/**
 * Dispatch 5d — the three remaining subpages on the SAME SubpageTemplate, no
 * fork. Title, question and answer are unfilled placeholder markers: visible
 * placeholders for question and answer, crumb labels degraded to slugs,
 * Article JSON-LD stripped to structural fields, empty slots null, the
 * parent portal's LeadCta attribution — and zero raw TK_ served.
 */
describe('SubpageTemplate — the three remaining subpages (5d)', () => {
  const CASES = [
    {
      subpage: FIRST_TIME_BUYER_PROGRAMS_SUBPAGE,
      portal: BUYERS_PORTAL,
      marker: 'SUBPAGE_FIRST_TIME_BUYER_PROGRAMS',
    },
    {
      subpage: EXCHANGE_1031_SUBPAGE,
      portal: INVESTORS_PORTAL,
      marker: 'SUBPAGE_1031_EXCHANGE',
    },
    {
      subpage: PROPERTY_MANAGEMENT_SUBPAGE,
      portal: LANDLORDS_PORTAL,
      marker: 'SUBPAGE_PROPERTY_MANAGEMENT',
    },
  ] as const;

  for (const { subpage, portal, marker } of CASES) {
    describe(subpage.id, () => {
      const byLocale = (['en', 'es'] as const).map((locale) => ({
        locale,
        markup: renderToStaticMarkup(
          <SubpageTemplate
            subpage={subpage}
            portal={portal}
            tools={[]}
            advice={[]}
            faqs={[]}
            locale={locale}
            leadIntent={PORTAL_INTENT[portal.id]}
          />
        ),
      }));

      it('renders visible placeholders for question and answer — both locales', () => {
        for (const { markup } of byLocale) {
          expect(markup).toContain(`⟨ TK · ${marker}_QUESTION ⟩`);
          expect(markup).toContain(`⟨ TK · ${marker}_ANSWER ⟩`);
        }
      });

      it('serves zero raw TK_ strings — prose, crumbs, JSON-LD', () => {
        for (const { markup } of byLocale) {
          expect(markup).not.toMatch(/\bTK_/);
        }
      });

      it('crumb labels degrade unfilled titles to the localized slugs', () => {
        for (const { locale, markup } of byLocale) {
          expect(markup).toContain(`href="/${locale}/${portal.slug[locale]}"`);
          expect(markup).toContain(`>${portal.slug[locale]}</a>`);
          expect(markup).toContain(
            `aria-current="page">${subpage.slug[locale]}<`
          );
        }
      });

      it('empty slots render null; Article JSON-LD keeps author → #raul, no FAQPage', () => {
        for (const { markup } of byLocale) {
          expect(markup).not.toContain(UI.sections.relatedTools.en);
          expect(markup).not.toContain(UI.sections.relatedTools.es);
          expect(markup).not.toContain(UI.sections.adviceHeading.en);
          expect(markup).not.toContain(UI.sections.faqHeading.en);
          expect(markup).toContain('"@type":"Article"');
          expect(markup).toContain('"author":{"@id"');
          expect(markup).toContain(`"dateModified":"${subpage.answer.updated}"`);
          expect(markup).not.toContain('"@type":"FAQPage"');
          expect(markup).not.toContain('"@type":"RealEstateAgent"');
        }
      });

      it('carries the parent portal LeadCta attribution', () => {
        for (const { markup } of byLocale) {
          expect(markup).toContain('data-source-type="portal_cta"');
          expect(markup).toContain(`data-portal="${portal.id}"`);
          expect(markup).toContain(`data-intent="${PORTAL_INTENT[portal.id]}"`);
        }
      });
    });
  }
});

/**
 * Dispatch 6a — the raw-marker sweep. LegalTemplate, AboutTemplate and
 * AdviceList passed the UNSTRIPPED marker as the placeholder id since Phase 3
 * (⟨ TK · TK_LEGAL_PRIVACY_BODY ⟩ served the raw string); NeighborhoodContext
 * rendered answer prose with no guard; FeatureGroups keyed and rendered
 * feature labels unfiltered. Every site now routes through the shared
 * PlaceholderTK / clean-filter idioms — pinned here at the markup layer, and
 * at the served-HTML layer by e2e/no-raw-markers.spec.ts.
 */
describe('raw marker sweep (6a)', () => {
  it('LegalTemplate: the attorney body renders a stripped placeholder, never the marker', () => {
    for (const locale of ['en', 'es'] as const) {
      const markup = renderToStaticMarkup(
        <LegalTemplate page={LEGAL_PAGES.privacy} locale={locale} />
      );
      expect(markup).toContain('⟨ TK · LEGAL_PRIVACY_BODY ⟩');
      expect(markup).not.toMatch(/\bTK_/);
    }
  });

  it('AboutTemplate: the bio renders a stripped placeholder, never the marker', () => {
    for (const locale of ['en', 'es'] as const) {
      const markup = renderToStaticMarkup(<AboutTemplate locale={locale} />);
      expect(markup).toContain('⟨ TK · ABOUT_BIO ⟩');
      expect(markup).not.toMatch(/\bTK_/);
    }
  });

  it('AdviceList: a published TK-body section renders a stripped placeholder', () => {
    const markup = renderToStaticMarkup(
      <AdviceList
        advice={[
          {
            id: 'test-advice',
            portalId: 'sellers',
            heading: { en: 'How should I price?', es: '¿Cómo fijo el precio?' },
            body: { en: 'TK_ADVICE_TEST_BODY', es: 'TK_ADVICE_TEST_BODY' },
            reviewedBy: 'raul-perez',
            status: 'published',
          },
        ]}
        locale="en"
      />
    );
    expect(markup).toContain('⟨ TK · ADVICE_TEST_BODY ⟩');
    expect(markup).not.toMatch(/\bTK_/);
  });

  it('NeighborhoodContext: an unfilled answer renders a placeholder; TK overview stays absent', () => {
    const markup = renderToStaticMarkup(
      <NeighborhoodContext
        listing={{ ...LISTING_L_2026_001, neighborhoodId: 'test-nbhd' }}
        locale="en"
      />
    );
    expect(markup).toContain('Test Neighborhood');
    expect(markup).toContain('⟨ TK · NBHD_TEST_ANSWER ⟩');
    expect(markup).not.toContain('NBHD_TEST_OVERVIEW'); // omission, not render
    expect(markup).not.toMatch(/\bTK_/);
  });

  it('FeatureGroups: an unfilled feature label degrades by omission — never a raw key', () => {
    const markup = renderToStaticMarkup(
      <FeatureGroups
        listing={{
          ...LISTING_L_2026_001,
          featureGroups: [
            {
              group: { en: 'Interior', es: 'Interior' },
              items: [
                { en: 'Impact windows', es: 'Ventanas de impacto' },
                { en: 'TK_FEATURE_TEST', es: 'TK_FEATURE_TEST' },
              ],
            },
            {
              group: { en: 'TK_GROUP_TEST', es: 'TK_GROUP_TEST' },
              items: [{ en: 'Pool', es: 'Piscina' }],
            },
          ],
        }}
        locale="en"
      />
    );
    expect(markup).toContain('Impact windows');
    expect(markup).not.toContain('Pool'); // its group label is unfilled
    expect(markup).not.toMatch(/\bTK_/);
  });
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
