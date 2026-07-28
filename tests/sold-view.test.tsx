import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LISTING_L_2026_001 } from '@/content/listings/l-2026-001';
import { LISTING_L_2026_003 } from '@/content/listings/l-2026-003';
import type { Listing } from '@/lib/types';
import { SoldBanner } from '@/components/listing/SoldBanner';
import { ListingReportView } from '@/app/[locale]/[section]/[sub]/listing-report-view';
import { SoldDetailView } from '@/app/[locale]/[section]/[sub]/sold-detail-view';
import { SoldIndexView } from '@/app/[locale]/[section]/[sub]/sold-index-view';

/**
 * D2 — the sold view is a RECORD, not an offer: WebPage + BreadcrumbList
 * only, never RealEstateListing/Offer. The active→sold status flip is a
 * one-field edit that swaps which view (and which structured data) a listing
 * gets — proven here by rendering both views over flipped variants.
 */

describe('sold detail structured data', () => {
  const markup = renderToStaticMarkup(
    <SoldDetailView listing={LISTING_L_2026_003} locale="en" />
  );

  it('emits WebPage + BreadcrumbList — no RealEstateListing, no Offer', () => {
    expect(markup).toContain('"@type":"WebPage"');
    expect(markup).toContain('"@type":"BreadcrumbList"');
    expect(markup).not.toContain('"@type":"RealEstateListing"');
    expect(markup).not.toContain('"@type":"Offer"');
    expect(markup).not.toContain('InStock');
  });

  it('renders the closed-transaction banner with date, side, closed price', () => {
    expect(markup).toContain('Transaction closed');
    expect(markup).toContain('May 29, 2026');
    expect(markup).toContain('represented the seller');
    expect(markup).toContain('$742,500');
  });

  it('reuses the core modules: identity, gallery, facts — and NO scorecard', () => {
    expect(markup).toContain('300 Example Court');
    expect(markup).toContain('Property facts');
    // The fixture registers no scorecard (a fabricated professional
    // assessment is unrepresentable, 4c) — M7 renders null by contract.
    expect(markup).not.toContain("Broker&#x27;s scorecard");
    // Gallery section is present; its images sit behind the MediaImage
    // dynamic boundary (null under renderToStaticMarkup) — the served hero
    // is asserted in e2e.
    expect(markup).toContain('Media');
  });

  it('opens with the demonstration banner — a fixture never reads as a real transaction', () => {
    expect(markup).toContain('data-testid="fixture-banner"');
    expect(markup).toContain('Demonstration listing');
    const es = renderToStaticMarkup(
      <SoldDetailView listing={LISTING_L_2026_003} locale="es" />
    );
    expect(es).toContain('Propiedad de demostración');
  });

  it('has no lead form and no cost breakdown (record, not a pitch)', () => {
    expect(markup).not.toContain('Talk to a licensed broker');
    expect(markup).not.toContain('Cost breakdown');
  });
});

describe('the active↔sold flip swaps the structured data', () => {
  it('a sold listing flipped to active emits RealEstateListing + Offer', () => {
    const relisted: Listing = { ...LISTING_L_2026_003, status: 'active' };
    const markup = renderToStaticMarkup(
      <ListingReportView listing={relisted} locale="en" />
    );
    expect(markup).toContain('"@type":"RealEstateListing"');
    expect(markup).toContain('"@type":"Offer"');
    expect(markup).toContain('InStock');
    // The report view carries the banner for fixtures too.
    expect(markup).toContain('data-testid="fixture-banner"');
  });

  it('the banner is fixture-gated: a real listing renders none', () => {
    const { isFixture: _flag, ...realShape } = LISTING_L_2026_003;
    const markup = renderToStaticMarkup(
      <SoldDetailView listing={realShape as Listing} locale="en" />
    );
    expect(markup).not.toContain('data-testid="fixture-banner"');
    expect(markup).not.toContain('Demonstration listing');
  });

  it('an active listing flipped to sold emits WebPage and drops the Offer', () => {
    const closed: Listing = { ...LISTING_L_2026_001, status: 'sold' };
    const markup = renderToStaticMarkup(
      <SoldDetailView listing={closed} locale="en" />
    );
    expect(markup).toContain('"@type":"WebPage"');
    expect(markup).not.toContain('"@type":"Offer"');
  });
});

describe('SoldBanner contract', () => {
  it('renders null on non-archived listings', () => {
    expect(
      renderToStaticMarkup(<SoldBanner listing={LISTING_L_2026_001} locale="en" />)
    ).toBe('');
  });

  it('omits the closed price when the data file does not disclose it', () => {
    const undisclosed: Listing = {
      ...LISTING_L_2026_003,
      soldData: { represented: 'seller' },
    };
    const markup = renderToStaticMarkup(
      <SoldBanner listing={undisclosed} locale="en" />
    );
    expect(markup).toContain('represented the seller');
    expect(markup).not.toContain('$742,500');
  });
});

describe('sold index', () => {
  const markup = renderToStaticMarkup(<SoldIndexView locale="es" />);

  it('renders the sold fixture card with CollectionPage + ItemList', () => {
    expect(markup).toContain('300 Example Court');
    expect(markup).toContain('"@type":"CollectionPage"');
    expect(markup).toContain('"@type":"ItemList"');
    expect(markup).toContain('/es/propiedades/300-example-court-palmetto-bay');
  });

  it('the intro is client-reviewed copy — visible placeholder, never raw TK_', () => {
    expect(markup).toContain('SOLD_INDEX_INTRO'); // ⟨ TK · SOLD_INDEX_INTRO ⟩
    expect(markup).not.toContain('TK_');
  });
});
