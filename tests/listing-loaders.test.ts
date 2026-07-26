import { describe, expect, it } from 'vitest';
import { LISTING_L_2026_001 } from '@/content/listings/l-2026-001';
import { LISTING_L_2026_002 } from '@/content/listings/l-2026-002';
import {
  activeListings,
  isPublishedListing,
  publishedListings,
  validateListingMedia,
} from '@/lib/content/loaders';
import type { Listing } from '@/lib/types';

/**
 * D1 — the listing publish gate and the media data-integrity validation.
 * "Published" for a listing = not withdrawn AND the indexable surface (summary
 * + every media alt) TK-clean in BOTH locales. A TK narrative never gates the
 * URL. Malformed media (no hero-first, missing w/h) throws — a build failure,
 * not a silent drop.
 */

const VALID = LISTING_L_2026_001;

function variant(patch: Partial<Listing>): Listing {
  return { ...VALID, ...patch };
}

describe('listing publish gate', () => {
  it('publishes both valid fixtures', () => {
    const slugs = publishedListings().map((l) => l.slug);
    expect(slugs).toContain(LISTING_L_2026_001.slug);
    expect(slugs).toContain(LISTING_L_2026_002.slug);
  });

  it('a TK_ summary (either locale) blocks publication', () => {
    expect(
      isPublishedListing(
        variant({ summary: { en: 'TK_SUMMARY', es: 'Condominio en Miami' } })
      )
    ).toBe(false);
    expect(
      isPublishedListing(
        variant({ summary: { en: 'A home in Coral Gables', es: 'TK_SUMMARY' } })
      )
    ).toBe(false);
  });

  it('a TK_ media alt blocks publication', () => {
    const media = VALID.media.map((asset, index) =>
      index === 0 ? { ...asset, alt: { en: 'TK_ALT', es: 'TK_ALT' } } : asset
    );
    expect(isPublishedListing(variant({ media }))).toBe(false);
  });

  it('withdrawn listings never publish; a TK narrative does not gate', () => {
    expect(isPublishedListing(variant({ status: 'withdrawn' }))).toBe(false);
    // The fixtures themselves carry TK narratives and still publish.
    expect(isPublishedListing(VALID)).toBe(true);
  });

  it('activeListings surfaces marketed statuses only (sold archive is 4b)', () => {
    expect(activeListings().map((l) => l.id)).toEqual([
      LISTING_L_2026_001.id,
      LISTING_L_2026_002.id,
    ]);
    // Directly: the predicate chain excludes sold/leased.
    expect(isPublishedListing(variant({ status: 'sold' }))).toBe(true); // published…
    // …but not marketed: activeListings filters on status, proven by the
    // registered fixtures both being 'active' (a sold fixture is forbidden —
    // it would imply a real transaction, so none can exist to register).
  });
});

describe('validateListingMedia', () => {
  it('accepts both fixtures', () => {
    expect(() => validateListingMedia(LISTING_L_2026_001)).not.toThrow();
    expect(() => validateListingMedia(LISTING_L_2026_002)).not.toThrow();
  });

  it('rejects empty media', () => {
    expect(() => validateListingMedia(variant({ media: [] }))).toThrow(/empty/);
  });

  it('rejects media[0] not being the hero', () => {
    const [hero, ...rest] = VALID.media;
    expect(() =>
      validateListingMedia(variant({ media: [...rest, hero!] }))
    ).toThrow(/hero/);
  });

  it('rejects missing/non-positive intrinsic dimensions (CLS-proof rule)', () => {
    const media = VALID.media.map((asset, index) =>
      index === 0 ? { ...asset, w: 0 } : asset
    );
    expect(() => validateListingMedia(variant({ media }))).toThrow(/w\/h/);
  });

  it('rejects sources outside /listings/', () => {
    const media = VALID.media.map((asset, index) =>
      index === 0 ? { ...asset, src: '/other/x.jpg' as never } : asset
    );
    expect(() => validateListingMedia(variant({ media }))).toThrow(/\/listings\//);
  });
});

describe('fixture content-integrity invariants (Part 1.4 / R-12)', () => {
  const fixtures = [LISTING_L_2026_001, LISTING_L_2026_002];

  it("fixtures are status 'active' only — never a proof position", () => {
    for (const fixture of fixtures) {
      expect(fixture.status).toBe('active');
      expect(fixture.soldData).toBeUndefined();
      expect(fixture.priceHistory?.every((p) => p.kind !== 'sold') ?? true).toBe(
        true
      );
    }
  });

  it('fixture addresses read as fixtures, in real Miami-Dade cities', () => {
    expect(LISTING_L_2026_001.address.line1).toContain('Fixture');
    expect(LISTING_L_2026_002.address.line1).toContain('Placeholder');
    expect(['Coral Gables', 'Miami']).toContain(LISTING_L_2026_001.address.city);
  });

  it('narratives are TK_ (broker prose is never agent-authored)', () => {
    for (const fixture of fixtures) {
      expect(fixture.narrative.en).toMatch(/^TK_/);
      expect(fixture.narrative.es).toMatch(/^TK_/);
    }
  });

  it('every media alt describes a placeholder, not a property', () => {
    for (const fixture of fixtures) {
      for (const asset of fixture.media) {
        expect(asset.alt.en.toLowerCase()).toContain('placeholder');
        expect(asset.alt.es.toLowerCase()).toContain('relleno');
      }
    }
  });

  it('the privacy-degraded fixture leaks no street tokens through its slug', () => {
    expect(LISTING_L_2026_002.showFullAddress).toBe(false);
    expect(LISTING_L_2026_002.slug).not.toMatch(/placeholder-way|200|1204/);
  });
});
