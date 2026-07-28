import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LISTING_L_2026_001 } from '@/content/listings/l-2026-001';
import { LISTING_L_2026_002 } from '@/content/listings/l-2026-002';
import { LISTING_L_2026_003 } from '@/content/listings/l-2026-003';
import { isDiscoverable, publishedListings } from '@/lib/content/loaders';
import { ogCard } from '@/components/listing/OgCard';
import { GET, generateStaticParams } from '@/app/listings/[slug]/opengraph-image/route';

/**
 * D3 — the OG card is a branded TYPOGRAPHIC card from structured data: no
 * imagery at all (a fabricated photo shared as "the property" is the exact
 * thing the content-integrity rules ban). Privacy and sold state carry
 * through. The route prerenders one card per DISCOVERABLE listing — a share
 * image is a discovery artifact, so a fixture never gets one (4c); the card
 * component itself is proven against fixture data used as inline test input.
 */

describe('listing OG card', () => {
  it('active card: address, city line, price, facts — and no <img>', () => {
    const markup = renderToStaticMarkup(ogCard(LISTING_L_2026_001));
    expect(markup).toContain('OPTIMAL REALTY');
    expect(markup).toContain('FOR SALE');
    expect(markup).toContain('100 Fixture Boulevard');
    expect(markup).toContain('Coral Gables, FL 33134');
    expect(markup).toContain('$1,285,000');
    expect(markup).toContain('4 bd · 3.5 ba · 2,640 sq ft');
    expect(markup).not.toContain('<img');
  });

  it('privacy-degraded card shows the city form only', () => {
    const markup = renderToStaticMarkup(ogCard(LISTING_L_2026_002));
    expect(markup).toContain('Miami, FL 33131');
    expect(markup).not.toContain('200 Placeholder Way');
    expect(markup).not.toContain('1204');
  });

  it('sold card says SOLD and drops the asking price', () => {
    const markup = renderToStaticMarkup(ogCard(LISTING_L_2026_003));
    expect(markup).toContain('SOLD');
    expect(markup).not.toContain('FOR SALE');
    expect(markup).not.toContain('$765,000');
    expect(markup).not.toContain('$742,500'); // closed price is the page's story, not the share card's
  });

  it('the OG route prerenders one card per DISCOVERABLE listing — zero fixtures', () => {
    const slugs = generateStaticParams().map((p) => p.slug).sort();
    expect(slugs).toEqual(
      publishedListings()
        .filter(isDiscoverable)
        .map((l) => l.slug)
        .sort()
    );
    // Every registered listing is a fixture today, so NO card prerenders.
    for (const listing of [
      LISTING_L_2026_001,
      LISTING_L_2026_002,
      LISTING_L_2026_003,
    ]) {
      expect(slugs).not.toContain(listing.slug);
    }
  });

  it('the GET guard 404s a fixture slug even when requested directly', async () => {
    const response = await GET(
      new Request(
        `http://localhost/listings/${LISTING_L_2026_003.slug}/opengraph-image`
      ),
      { params: Promise.resolve({ slug: LISTING_L_2026_003.slug }) }
    );
    expect(response.status).toBe(404);
  });
});
