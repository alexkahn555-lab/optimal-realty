'use client';

import dynamic from 'next/dynamic';

/**
 * LAZY BOUNDARY for the LeadForm island — import this, never LeadForm
 * directly, from any module a shared page entry can reach. Turbopack folds
 * every statically reachable 'use client' module into the page entry's
 * chunks, and next/dynamic only code-splits when called INSIDE the client
 * graph (from a Server Component the reference stays async:false and merges
 * right back into the entry). This wrapper is the split point: it costs a few
 * hundred bytes in the shared entry, while the real island chunk is fetched
 * (and SSR-preloaded) only on URLs that render a form — which is how legal,
 * tools-hub and about stay at zero island JS (Part 8). Renders and props are
 * identical to LeadForm; SSR output is unchanged (ssr: true default).
 */
export const LeadForm = dynamic(() =>
  import('./LeadForm').then((mod) => mod.LeadForm)
);
