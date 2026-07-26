import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { UI } from '@/content/ui-strings';
import { SELLERS_PORTAL } from '@/content/portals/sellers';
import { HOME_VALUATION_SUBPAGE } from '@/content/subpages/home-valuation';
import { NET_PROCEEDS_TOOL } from '@/content/tools/net-proceeds';
import { PortalTemplate } from '@/components/portal/PortalTemplate';
import { SubpageTemplate } from '@/components/portal/SubpageTemplate';

/**
 * PortalTemplate slot behavior: empty advice/listings/faqs render NULL slots
 * (no orphan headings — client copy never blocks or litters a route), while
 * the structural slots always render. Also pins the hub → tool link and the
 * subpage FAQ dedup contract surface.
 */

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
