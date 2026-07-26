'use client';

import dynamic from 'next/dynamic';

/**
 * LAZY BOUNDARY for the calculator island — import this, never CalcIsland
 * directly, from any module a shared page entry can reach. All [sub] URLs
 * share one page entry, and Turbopack folds every statically reachable
 * 'use client' module into that entry's chunks — a static CalcIsland import
 * would ride into every subpage and legal document. next/dynamic only
 * code-splits when called INSIDE the client graph (from a Server Component
 * the reference stays async:false and merges right back into the entry).
 * This wrapper is the split point: the island chunk is fetched (and
 * SSR-preloaded) only on calculator URLs (Part 8: CalcIsland only where
 * used). Renders and props are identical to CalcIsland; SSR output is
 * unchanged (ssr: true default).
 */
export const CalcIsland = dynamic(() =>
  import('./CalcIsland').then((mod) => mod.CalcIsland)
);
