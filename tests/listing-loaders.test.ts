import { describe, expect, it } from 'vitest';
import { LISTING_L_2026_001 } from '@/content/listings/l-2026-001';
import { LISTING_L_2026_002 } from '@/content/listings/l-2026-002';
import { LISTING_L_2026_003 } from '@/content/listings/l-2026-003';
import {
  activeListings,
  isDiscoverable,
  isMarketed,
  isPublishedListing,
  isSoldArchived,
  publishedListings,
  soldListings,
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

  it('activeListings and soldListings split the registry by status', () => {
    expect(activeListings().map((l) => l.id)).toEqual([
      LISTING_L_2026_001.id,
      LISTING_L_2026_002.id,
    ]);
    expect(soldListings().map((l) => l.id)).toEqual([LISTING_L_2026_003.id]);
  });

  it('the active↔sold flip is a ONE-FIELD edit that swaps index membership', () => {
    // Sold fixture flipped to active: leaves the archive, joins the market.
    const relisted: Listing = { ...LISTING_L_2026_003, status: 'active' };
    expect(isMarketed(relisted)).toBe(true);
    expect(isSoldArchived(relisted)).toBe(false);
    // Active fixture flipped to sold: leaves the market, joins the archive —
    // still published (the URL is permanent), never marketed.
    const closed = variant({ status: 'sold' });
    expect(isPublishedListing(closed)).toBe(true);
    expect(isMarketed(closed)).toBe(false);
    expect(isSoldArchived(closed)).toBe(true);
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
  const activeFixtures = [LISTING_L_2026_001, LISTING_L_2026_002];
  const fixtures = [...activeFixtures, LISTING_L_2026_003];

  it("ACTIVE fixtures carry no sold data — never a proof position", () => {
    for (const fixture of activeFixtures) {
      expect(fixture.status).toBe('active');
      expect(fixture.soldData).toBeUndefined();
      expect(fixture.priceHistory?.every((p) => p.kind !== 'sold') ?? true).toBe(
        true
      );
    }
  });

  it('sold status or soldData WITHOUT isFixture is unrepresentable (restored 4a invariant)', () => {
    // A closed transaction in this registry is either a REAL closing (which
    // no agent may author) or a flagged demonstration fixture. Closed-
    // transaction evidence on a listing that does not carry isFixture is a
    // fabricated transaction — it must FAIL here, over the FULL set, whatever
    // file it arrives in.
    for (const listing of fixtures) {
      const transactionEvidence =
        isSoldArchived(listing) ||
        listing.soldData !== undefined ||
        listing.dates.sold !== undefined ||
        (listing.priceHistory?.some((event) => event.kind === 'sold') ?? false);
      if (transactionEvidence) {
        expect(
          listing.isFixture,
          `${listing.id} carries closed-transaction data without isFixture`
        ).toBe(true);
      }
    }
  });

  it('every registered listing is a typed fixture — the flag is load-bearing', () => {
    // Phase 4 registry truth: only demonstration fixtures exist. The flag
    // drives discovery exclusion and the visible banner; a registered listing
    // WITHOUT it claims to be a real property and must be surfaced here as a
    // deliberate decision, never slipped in.
    for (const fixture of fixtures) {
      expect(fixture.isFixture, `${fixture.id} must carry isFixture`).toBe(true);
    }
    expect(publishedListings().every((l) => l.isFixture === true)).toBe(true);
  });

  it('fixtures are excluded from discovery; the predicate flips on real listings', () => {
    for (const fixture of fixtures) {
      expect(isDiscoverable(fixture)).toBe(false);
    }
    const { isFixture: _flag, ...real } = LISTING_L_2026_001;
    expect(isDiscoverable(real as Listing)).toBe(true);
  });

  it('the ONE sold fixture (4b) reads unmistakably as a fixture', () => {
    // A sold listing sits where proof of a real transaction would sit — the
    // typed flag plus the obviously-fake street name are the safeguards.
    expect(LISTING_L_2026_003.status).toBe('sold');
    expect(LISTING_L_2026_003.isFixture).toBe(true);
    expect(LISTING_L_2026_003.address.line1).toContain('Example');
    expect(LISTING_L_2026_003.soldData).toBeDefined();
    expect(LISTING_L_2026_003.dates.sold).toBeDefined();
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

  it('no fixture registers a scorecard — professional judgment is never invented', () => {
    // Scores ARE the broker's assessment (not neutral shape-data), so a
    // fixture may not carry them as content (4c). M7's rendering contract is
    // proven against an inline-constructed scorecard in
    // tests/listing-modules-4b.test.tsx instead.
    for (const fixture of fixtures) {
      expect(fixture.scorecard, `${fixture.id} must not register a scorecard`).toBeUndefined();
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
