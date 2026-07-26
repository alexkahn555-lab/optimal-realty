'use client';

import dynamic from 'next/dynamic';

/**
 * LAZY BOUNDARY for the next/image client runtime — the same split-point
 * pattern as LeadFormLazy, for the same reason (Part 8): the listing views are
 * dynamically imported RSC modules, but Turbopack folds their client
 * references into the SEGMENT's shared chunks — a static next/image reference
 * here rides ~5–6 KB gzipped into every [section]/[sub] URL, including legal
 * documents that must ship zero island JS (measured: content routes grew
 * 143.4→148.7 before this boundary existed). next/dynamic inside the client
 * graph is the split: the shared entries carry only this stub, and the image
 * runtime chunk is fetched (and SSR-preloaded, so the gate weighs it) only on
 * URLs that actually render listing media. SSR output is unchanged.
 */
export const MediaImageIsland = dynamic(() =>
  import('./MediaImageClient').then((mod) => mod.MediaImageClient)
);
