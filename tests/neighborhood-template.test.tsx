import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { UI } from '@/content/ui-strings';
import { FIXTURE_PALMS_NEIGHBORHOOD } from '@/content/neighborhoods/fixture-palms';
import { NeighborhoodTemplate } from '@/components/neighborhood/NeighborhoodTemplate';
import { StatGrid } from '@/components/neighborhood/StatGrid';

/**
 * Dispatch 7a — NeighborhoodTemplate + StatGrid against the published
 * fixture: every slot degrades by omission, every stat carries its visible
 * source + as-of furniture, the JSON-LD is Place + WebPage (never Dataset),
 * and zero raw markers serve. The LeadForm island is stubbed to expose the
 * attribution the template passes (the 5c convention).
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

describe('NeighborhoodTemplate — the published fixture', () => {
  const byLocale = (['en', 'es'] as const).map((locale) => ({
    locale,
    markup: renderToStaticMarkup(
      <NeighborhoodTemplate
        neighborhood={FIXTURE_PALMS_NEIGHBORHOOD}
        faqs={[]}
        locale={locale}
      />
    ),
  }));

  it('renders the demonstration banner — visible truth labeling (4c)', () => {
    for (const { locale, markup } of byLocale) {
      expect(markup).toContain('data-testid="fixture-banner"');
      expect(markup).toContain(UI.fixtureBanner.tag[locale]);
    }
  });

  it('renders visible placeholders for question, answer and overview', () => {
    for (const { markup } of byLocale) {
      expect(markup).toContain('⟨ TK · NBHD_FIXTURE_PALMS_QUESTION ⟩');
      expect(markup).toContain('⟨ TK · NBHD_FIXTURE_PALMS_ANSWER ⟩');
      expect(markup).toContain('⟨ TK · NBHD_FIXTURE_PALMS_OVERVIEW ⟩');
    }
  });

  it('serves zero raw TK_ strings — prose, crumbs, JSON-LD, keys', () => {
    for (const { markup } of byLocale) {
      expect(markup).not.toMatch(/\bTK_/);
    }
  });

  it('crumb label degrades the unfilled name to the locale-invariant slug', () => {
    for (const { markup } of byLocale) {
      expect(markup).toContain('aria-current="page">fixture-palms-example<');
    }
  });

  it('every rendered stat carries its visible source + as-of line (Part 1.3)', () => {
    const markup = byLocale[0]!.markup;
    expect(markup).toContain(UI.neighborhoodStats.medianSalePrice.en);
    expect(markup).toContain('$987,654');
    expect(markup).toContain(`$543 ${UI.statFurniture.perSqFt.en}`);
    expect(markup).toContain(`43 ${UI.statFurniture.daysUnit.en}`);
    const sourceLines = markup.match(
      /Invented fixture figure — template review only, not a market source/g
    );
    expect(sourceLines?.length).toBe(3); // one visible line per rendered stat
    expect(markup).toContain('Jul 28, 2026');
  });

  it('JSON-LD: Place with geo + containedInPlace and WebPage — never Dataset, no FAQPage, no agent redeclare', () => {
    for (const { markup } of byLocale) {
      expect(markup).toContain('"@type":"Place"');
      expect(markup).toContain('"@type":"GeoCoordinates"');
      expect(markup).toContain('"containedInPlace"');
      expect(markup).toContain('Miami-Dade County');
      expect(markup).toContain('"@type":"WebPage"');
      expect(markup).not.toContain('"@type":"Dataset"');
      expect(markup).not.toContain('"@type":"FAQPage"'); // faqIds is empty
      expect(markup).not.toContain('"@type":"RealEstateAgent"');
    }
  });

  it('carries the related-portal LeadCta attribution (buyers)', () => {
    const markup = byLocale[0]!.markup;
    expect(markup).toContain('data-source-type="portal_cta"');
    expect(markup).toContain('data-portal="buyers"');
    expect(markup).toContain('data-intent="buy"');
  });

  it('no stats → NO StatGrid, not an empty grid (degrade by omission)', () => {
    const markup = renderToStaticMarkup(
      <NeighborhoodTemplate
        neighborhood={{ ...FIXTURE_PALMS_NEIGHBORHOOD, stats: undefined }}
        faqs={[]}
        locale="en"
      />
    );
    expect(markup).not.toContain(UI.neighborhoodStats.medianSalePrice.en);
    expect(markup).not.toContain(UI.statFurniture.sourceLabel.en);
  });
});

describe('StatGrid', () => {
  it('renders only the keys present', () => {
    const markup = renderToStaticMarkup(
      <StatGrid
        stats={{
          medianDom: {
            value: 30,
            unit: 'days',
            asOf: '2026-07-28',
            source: 'Invented fixture figure — not a market source',
          },
        }}
        locale="en"
      />
    );
    expect(markup).toContain(UI.neighborhoodStats.medianDom.en);
    expect(markup).not.toContain(UI.neighborhoodStats.medianSalePrice.en);
    expect(markup).not.toContain(UI.neighborhoodStats.medianRentMonthly.en);
  });

  it('renders null for an empty stats object — never an empty grid', () => {
    expect(renderToStaticMarkup(<StatGrid stats={{}} locale="en" />)).toBe('');
  });
});
