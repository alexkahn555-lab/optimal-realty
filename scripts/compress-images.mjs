#!/usr/bin/env node
/**
 * compress-images.mjs — listing media pipeline. Build reference v2.0, Part 8.3.
 *
 * Pre-commit hygiene for property photography:
 *   - max edge 2000 px (fit inside, never enlarged)
 *   - ≤ 600 KB per emitted source file (quality steps down until it fits)
 *   - EXIF + GPS stripped  ← privacy REQUIREMENT on property photos, not an
 *     optimization. sharp emits no metadata unless withMetadata()/keepExif is
 *     called — neither is, and the vitest media suite verifies the committed
 *     outputs carry no EXIF block at all.
 *   - AVIF primary + JPEG fallback emitted side by side. Listing data files
 *     reference the .jpg (the next/image optimizer negotiates AVIF/WebP
 *     delivery from it per Accept header; the .avif sits alongside as the
 *     direct-serve primary).
 *   - prints the intrinsic width/height table to paste into the Listing data
 *     file so every MediaAsset carries explicit w/h (CLS-proof).
 *
 * Reads raw drops from  public/listings/<id>/_raw/
 * Emits processed assets to  public/listings/<id>/
 *
 * Phase 4a: wired and exercised against the fixture placeholders (labeled
 * non-photographic graphics). Real photo drops replace the raws with no
 * script change. Auto-orient is applied BEFORE the orientation tag is
 * dropped, so stripping EXIF never mirrors or rotates a photo.
 */

import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const ROOT = process.cwd();
const LISTINGS_DIR = join(ROOT, 'public', 'listings');

const MAX_EDGE = 2000;
const MAX_BYTES = 600 * 1024;
const RAW_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

/** Encode with stepped-down quality until the output fits MAX_BYTES. */
async function encodeUnderBudget(pipeline, format, startQuality) {
  for (let quality = startQuality; quality >= 30; quality -= 10) {
    const buffer =
      format === 'avif'
        ? await pipeline.clone().avif({ quality }).toBuffer()
        : await pipeline.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
    if (buffer.byteLength <= MAX_BYTES) return { buffer, quality };
  }
  throw new Error(`cannot fit ${format} under ${MAX_BYTES / 1024} KB even at quality 30`);
}

async function main() {
  if (!existsSync(LISTINGS_DIR)) {
    console.log('  compress-images: no public/listings yet — nothing to do.');
    return;
  }

  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.log(
      '  compress-images: sharp not installed yet — run `npm install`, then this script.'
    );
    return;
  }

  const listingIds = readdirSync(LISTINGS_DIR).filter((entry) =>
    statSync(join(LISTINGS_DIR, entry)).isDirectory()
  );

  const emitted = [];
  for (const id of listingIds) {
    const rawDir = join(LISTINGS_DIR, id, '_raw');
    if (!existsSync(rawDir)) continue;

    const raws = readdirSync(rawDir).filter((file) =>
      RAW_EXTENSIONS.has(extname(file).toLowerCase())
    );
    for (const raw of raws) {
      const name = basename(raw, extname(raw));
      const outDir = join(LISTINGS_DIR, id);
      mkdirSync(outDir, { recursive: true });

      // rotate() with no args applies the EXIF orientation to the pixels, so
      // dropping the metadata afterwards can never flip a photo. No
      // withMetadata()/keepExif anywhere: EXIF + GPS do not survive.
      const base = sharp(join(rawDir, raw))
        .rotate()
        .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true });

      const jpeg = await encodeUnderBudget(base, 'jpeg', 72);
      const avif = await encodeUnderBudget(base, 'avif', 60);
      const jpegPath = join(outDir, `${name}.jpg`);
      const avifPath = join(outDir, `${name}.avif`);
      await sharp(jpeg.buffer).toFile(jpegPath);
      await sharp(avif.buffer).toFile(avifPath);

      const { width, height } = await sharp(jpeg.buffer).metadata();
      emitted.push({
        asset: `/listings/${id}/${name}.jpg`,
        w: width,
        h: height,
        jpegKb: (jpeg.buffer.byteLength / 1024).toFixed(1),
        avifKb: (avif.buffer.byteLength / 1024).toFixed(1),
      });
    }
  }

  if (emitted.length === 0) {
    console.log(
      `  compress-images: pipeline ready (max edge ${MAX_EDGE}px, ≤${MAX_BYTES / 1024}KB, EXIF+GPS stripped).`
    );
    console.log('  Drop raws into public/listings/<id>/_raw and re-run.');
    return;
  }

  console.log(
    `\n  compress-images — ${emitted.length} asset(s), max edge ${MAX_EDGE}px, EXIF+GPS stripped`
  );
  console.log('  paste w/h into the listing data file (CLS-proof contract):\n');
  for (const e of emitted) {
    console.log(
      `  ${e.asset.padEnd(46)} w:${String(e.w).padStart(4)} h:${String(e.h).padStart(4)}  jpg ${e.jpegKb.padStart(6)} KB · avif ${e.avifKb.padStart(6)} KB`
    );
  }
  console.log('');
}

main().catch((err) => {
  console.error(`  ✗ compress-images: ${err.message}`);
  process.exit(1);
});
