import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { LISTING_L_2026_001 } from '@/content/listings/l-2026-001';
import { LISTING_L_2026_002 } from '@/content/listings/l-2026-002';

/**
 * D2 — the media pipeline's committed outputs hold the Part 8.3 contract:
 * every referenced asset exists, intrinsic dims match the data file exactly
 * (CLS-proof), max edge ≤ 2000 px, ≤ 600 KB per source, an AVIF primary sits
 * beside the JPEG fallback, and — the privacy REQUIREMENT — no EXIF (which is
 * where GPS lives) survives. The _raw inputs deliberately carry EXIF+GPS so
 * the strip assertion is proven against a real difference, not vacuously.
 */

const ROOT = process.cwd();
const MAX_EDGE = 2000;
const MAX_BYTES = 600 * 1024;

const ASSETS = [...LISTING_L_2026_001.media, ...LISTING_L_2026_002.media];

describe('committed listing media', () => {
  it('every asset exists with matching intrinsic dimensions and an AVIF primary', async () => {
    for (const asset of ASSETS) {
      const jpegPath = join(ROOT, 'public', asset.src);
      const avifPath = jpegPath.replace(/\.jpg$/, '.avif');
      expect(existsSync(jpegPath), asset.src).toBe(true);
      expect(existsSync(avifPath), avifPath).toBe(true);

      const jpeg = await sharp(jpegPath).metadata();
      expect(jpeg.width, asset.src).toBe(asset.w);
      expect(jpeg.height, asset.src).toBe(asset.h);

      const avif = await sharp(avifPath).metadata();
      expect(avif.width, avifPath).toBe(asset.w);
      expect(avif.height, avifPath).toBe(asset.h);
    }
  });

  it('respects max edge 2000 px and ≤ 600 KB per source file', () => {
    for (const asset of ASSETS) {
      expect(Math.max(asset.w, asset.h), asset.src).toBeLessThanOrEqual(MAX_EDGE);
      const jpegPath = join(ROOT, 'public', asset.src);
      const avifPath = jpegPath.replace(/\.jpg$/, '.avif');
      expect(statSync(jpegPath).size, asset.src).toBeLessThanOrEqual(MAX_BYTES);
      expect(statSync(avifPath).size, avifPath).toBeLessThanOrEqual(MAX_BYTES);
    }
  });

  it('strips EXIF (incl. GPS) from outputs — and the raws prove it', async () => {
    // The raw drops carry fake EXIF+GPS on purpose; if this ever fails, the
    // strip assertion below has gone vacuous and the pipeline test is blind.
    const rawPath = join(
      ROOT,
      'public',
      'listings',
      'L-2026-001',
      '_raw',
      'hero-01.jpg'
    );
    const raw = await sharp(rawPath).metadata();
    expect(raw.exif, 'raw fixture should carry EXIF').toBeDefined();

    for (const asset of ASSETS) {
      const jpegPath = join(ROOT, 'public', asset.src);
      const avifPath = jpegPath.replace(/\.jpg$/, '.avif');
      const jpeg = await sharp(jpegPath).metadata();
      const avif = await sharp(avifPath).metadata();
      expect(jpeg.exif, `${asset.src} must carry no EXIF`).toBeUndefined();
      expect(avif.exif, `${avifPath} must carry no EXIF`).toBeUndefined();
    }
  });

  it('report initial-viewport weight ≤ 500 KB and index page weight ≤ 900 KB (source bytes)', () => {
    // Source-file upper bound: the optimizer serves smaller derivatives, so if
    // the sources fit, the served weight fits (e2e measures the served bytes).
    const heroBytes = (listing: typeof LISTING_L_2026_001) =>
      statSync(join(ROOT, 'public', listing.media[0]!.src)).size;
    // Report initial viewport = the priority hero only (gallery is lazy).
    expect(heroBytes(LISTING_L_2026_001)).toBeLessThanOrEqual(500 * 1024);
    expect(heroBytes(LISTING_L_2026_002)).toBeLessThanOrEqual(500 * 1024);
    // Index page = every card hero.
    const indexBytes =
      heroBytes(LISTING_L_2026_001) + heroBytes(LISTING_L_2026_002);
    expect(indexBytes).toBeLessThanOrEqual(900 * 1024);
  });
});
