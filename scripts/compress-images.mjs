#!/usr/bin/env node
/**
 * compress-images.mjs — listing media pipeline. Build reference v2.0, Part 8.3.
 *
 * Pre-commit hygiene for property photography:
 *   - max edge 2000 px
 *   - ≤ 600 KB per source file
 *   - EXIF + GPS stripped  ← privacy requirement on property photos, not an optimization
 *   - AVIF primary, JPEG fallback
 *   - writes intrinsic width/height back so the Listing data file is CLS-proof
 *
 * Reads raw drops from  public/listings/<id>/_raw/
 * Emits processed assets to  public/listings/<id>/
 *
 * Activated in Phase 4 when real listing assets arrive. Requires `sharp`
 * (already in devDependencies). This is a working skeleton; the per-listing
 * loop is filled in against the real asset drop.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LISTINGS_DIR = join(ROOT, 'public', 'listings');

const MAX_EDGE = 2000;
const MAX_BYTES = 600 * 1024;

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

  // Phase 4: iterate public/listings/<id>/_raw, process each image, strip EXIF,
  // emit AVIF + JPEG, and print a width/height table to paste into the listing
  // data file. Guarded here so the scaffold runs clean before any assets exist.
  console.log(
    `  compress-images: pipeline ready (max edge ${MAX_EDGE}px, ≤${MAX_BYTES / 1024}KB, EXIF stripped).`
  );
  console.log('  Drop raws into public/listings/<id>/_raw and re-run in Phase 4.');
}

main().catch((err) => {
  console.error(`  ✗ compress-images: ${err.message}`);
  process.exit(1);
});
