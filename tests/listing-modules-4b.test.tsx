import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { LISTING_L_2026_001 } from '@/content/listings/l-2026-001';
import { LISTING_L_2026_002 } from '@/content/listings/l-2026-002';
import { LISTING_L_2026_003 } from '@/content/listings/l-2026-003';
import type { Faq, Listing, ScorecardEntry } from '@/lib/types';
import { FeatureGroups } from '@/components/listing/FeatureGroups';
import { ListingFaq } from '@/components/listing/ListingFaq';
import { MapEmbedClient } from '@/components/listing/MapEmbedClient';
import { MapFacade } from '@/components/listing/MapFacade';
import { NarrativeBlock } from '@/components/listing/NarrativeBlock';
import { NeighborhoodContext } from '@/components/listing/NeighborhoodContext';
import { PriceHistoryChart } from '@/components/listing/PriceHistoryChart';
import { Scorecard } from '@/components/listing/Scorecard';
import { similarTo } from '@/components/listing/SimilarListings';
import { LISTING_UI } from '@/components/listing/strings';

/**
 * D1 (4b) module contracts: every module renders null cleanly when its data
 * is absent; the price history needs ≥2 events; the scorecard is single-color
 * with no schools/desirability key; the map facade respects the privacy flag
 * and never eager-loads an embed; SimilarListings derives, caps, and dedupes.
 */

function variant(base: Listing, patch: Partial<Listing>): Listing {
  return { ...base, ...patch };
}

describe('M5 — price history', () => {
  it('renders null with fewer than two events', () => {
    expect(
      renderToStaticMarkup(
        <PriceHistoryChart listing={LISTING_L_2026_002} locale="en" />
      )
    ).toBe(''); // condo fixture has no history
    expect(
      renderToStaticMarkup(
        <PriceHistoryChart
          listing={variant(LISTING_L_2026_001, {
            priceHistory: [{ date: '2026-06-18', price: 1, kind: 'listed' }],
          })}
          locale="en"
        />
      )
    ).toBe('');
  });

  it('renders a single-color temporal SVG step line with ≥2 events', () => {
    const markup = renderToStaticMarkup(
      <PriceHistoryChart listing={LISTING_L_2026_001} locale="en" />
    );
    expect(markup).toContain('<svg');
    expect(markup).toContain('stroke-teal'); // the one chart color
    expect(markup).not.toContain('coral'); // never a second series here
    expect(markup).toContain('$1,315,000');
    expect(markup).toContain('$1,285,000');
    expect(markup).toContain('Listed');
    expect(markup).toContain('Reduced');
  });
});

describe('M7 — scorecard (fair-housing constraints)', () => {
  it('renders null when the listing has no scorecard', () => {
    expect(
      renderToStaticMarkup(<Scorecard listing={LISTING_L_2026_001} locale="en" />)
    ).toBe('');
  });

  it('bars are SINGLE color; scores render; TK notes do not', () => {
    const markup = renderToStaticMarkup(
      <Scorecard listing={LISTING_L_2026_003} locale="en" />
    );
    // One bar per entry, every fill the same class — color never encodes.
    expect(markup.match(/bg-teal/g)).toHaveLength(
      LISTING_L_2026_003.scorecard!.length
    );
    expect(markup).toContain('4 / 5');
    expect(markup).toContain('5 / 5');
    expect(markup).not.toContain('TK_');
  });

  it('has no schools/desirability key — unrepresentable and unlabeled', () => {
    // Type-level: the union rejects it.
    // @ts-expect-error — 'schools' is not a ScorecardEntry key (D11 / R-04)
    const bad: ScorecardEntry = { key: 'schools', score: 3, note: { en: '', es: '' } };
    void bad;
    // Chrome-level: no label exists to render such a row.
    expect(Object.keys(LISTING_UI.scorecard)).not.toContain('schools');
    expect(Object.keys(LISTING_UI.scorecard)).not.toContain('desirability');
  });
});

describe('M9 — feature groups', () => {
  it('renders null when empty; renders groups when present', () => {
    expect(
      renderToStaticMarkup(
        <FeatureGroups
          listing={variant(LISTING_L_2026_001, { featureGroups: [] })}
          locale="en"
        />
      )
    ).toBe('');
    const markup = renderToStaticMarkup(
      <FeatureGroups listing={LISTING_L_2026_001} locale="es" />
    );
    expect(markup).toContain('Interior');
    expect(markup).toContain('Piscina climatizada');
  });
});

describe('M10 — map facade', () => {
  it('renders null when the address is withheld (privacy = no pin)', () => {
    expect(
      renderToStaticMarkup(<MapFacade listing={LISTING_L_2026_002} locale="en" />)
    ).toBe('');
  });

  it('initial render is the static facade — never an eager iframe', () => {
    // The client leaf is rendered directly: next/dynamic boundaries render
    // null under renderToStaticMarkup (the real SSR output is asserted in
    // e2e against the served page).
    const markup = renderToStaticMarkup(
      <MapEmbedClient
        lat={25.7215}
        lng={-80.2684}
        label="100 Fixture Boulevard · Coral Gables, FL 33134"
        loadLabel="Load interactive map"
        sourceLabel="Opens an OpenStreetMap embed"
        iframeTitle="Interactive map"
      />
    );
    expect(markup).toContain('Load interactive map');
    expect(markup).not.toContain('<iframe');
    expect(markup).not.toContain('openstreetmap.org');
    // The section shell renders for the open-address fixture.
    expect(
      renderToStaticMarkup(<MapFacade listing={LISTING_L_2026_001} locale="en" />)
    ).toContain('Location');
  });
});

describe('M11 — neighborhood context', () => {
  it('renders null until a published neighborhood resolves (Phase 7)', () => {
    expect(
      renderToStaticMarkup(
        <NeighborhoodContext listing={LISTING_L_2026_001} locale="en" />
      )
    ).toBe('');
    // Even with an id, an unpublished/unknown neighborhood renders null.
    expect(
      renderToStaticMarkup(
        <NeighborhoodContext
          listing={variant(LISTING_L_2026_001, { neighborhoodId: 'nowhere' })}
          locale="en"
        />
      )
    ).toBe('');
  });
});

describe('M12 — narrative + highlights', () => {
  afterEach(() => {
    delete process.env.CONTENT_STRICT;
  });

  it('TK narrative shows a visible placeholder in preview, never raw TK_', () => {
    const markup = renderToStaticMarkup(
      <NarrativeBlock listing={LISTING_L_2026_001} locale="en" />
    );
    expect(markup).toContain('⟨ TK'); // PlaceholderTK
    expect(markup).not.toContain('TK_');
  });

  it('clean narrative renders as prose paragraphs; clean highlights render', () => {
    const markup = renderToStaticMarkup(
      <NarrativeBlock
        listing={variant(LISTING_L_2026_001, {
          narrative: { en: 'First paragraph.\n\nSecond paragraph.', es: 'Uno.\n\nDos.' },
          highlights: [{ en: 'Corner lot', es: 'Lote en esquina' }],
        })}
        locale="en"
      />
    );
    expect(markup).toContain('First paragraph.');
    expect(markup).toContain('Second paragraph.');
    expect(markup).toContain('Corner lot');
  });

  it('under CONTENT_STRICT a TK narrative block vanishes entirely', () => {
    process.env.CONTENT_STRICT = '1';
    expect(
      renderToStaticMarkup(
        <NarrativeBlock listing={LISTING_L_2026_001} locale="en" />
      )
    ).toBe('');
  });
});

describe('M13 — listing FAQ', () => {
  const POOL: Faq[] = [
    {
      id: 'listing-test-faq',
      question: { en: 'Is there a pool?', es: '¿Hay piscina?' },
      answer: { en: 'Yes, heated.', es: 'Sí, climatizada.' },
      scope: { type: 'listing', refId: 'L-2026-001' },
    },
    {
      id: 'listing-test-faq-tk',
      question: { en: 'Unanswered?', es: '¿Sin respuesta?' },
      answer: { en: 'TK_FAQ', es: 'TK_FAQ' },
      scope: { type: 'listing', refId: 'L-2026-001' },
    },
  ];

  it('renders null with no resolvable faqs (the fixtures today)', () => {
    expect(
      renderToStaticMarkup(<ListingFaq listing={LISTING_L_2026_001} locale="en" />)
    ).toBe('');
  });

  it('renders native <details> + FAQPage for TK-clean answers only', () => {
    const markup = renderToStaticMarkup(
      <ListingFaq
        listing={variant(LISTING_L_2026_001, {
          faqIds: ['listing-test-faq', 'listing-test-faq-tk'],
        })}
        locale="en"
        pool={POOL}
      />
    );
    expect(markup).toContain('<details');
    expect(markup).toContain('Is there a pool?');
    expect(markup).toContain('"@type":"FAQPage"');
    expect(markup).not.toContain('Unanswered?'); // TK answer → does not exist
  });
});

describe('SimilarListings — derived, capped, deduped', () => {
  const base = LISTING_L_2026_001;

  it('excludes self, matches by class, caps at 3, dedupes by slug', () => {
    const clone = (slug: string, patch: Partial<Listing> = {}): Listing =>
      variant(base, { slug, id: slug, ...patch });
    const candidates = [
      base, // self — excluded
      clone('a'),
      clone('a'), // duplicate slug — deduped
      clone('b'),
      clone('c'),
      clone('d'), // over the cap
      clone('e', { class: 'land' }), // class mismatch
    ];
    const picked = similarTo(base, candidates);
    expect(picked.map((l) => l.slug)).toEqual(['a', 'b', 'c']);
  });

  it('matches by shared neighborhood even across classes', () => {
    const subject = variant(base, { neighborhoodId: 'n1' });
    const neighbor = variant(base, {
      slug: 'n',
      id: 'n',
      class: 'condo',
      neighborhoodId: 'n1',
    });
    expect(similarTo(subject, [neighbor])).toHaveLength(1);
  });

  it('with the current fixtures, the single-family report finds no match', () => {
    // f2 is a condo, f3 is sold (never a candidate) — derived, not padded.
    expect(
      similarTo(base, [LISTING_L_2026_002]).map((l) => l.slug)
    ).toEqual([]);
  });
});
