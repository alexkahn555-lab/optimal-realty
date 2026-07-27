'use client';

import dynamic from 'next/dynamic';

/**
 * LAZY BOUNDARY for the gallery lightbox shell — same split-point pattern as
 * LeadFormLazy / MediaImageLazy / MapEmbedLazy (Part 8): shared entries carry
 * only this stub; the small shell chunk rides only listing-report URLs (SSR
 * renders the gallery through it, so markup is unchanged), and the heavy
 * overlay chunk is loaded by the shell on FIRST CLICK only.
 */
export const Lightbox = dynamic(() =>
  import('./LightboxShell').then((mod) => mod.LightboxShell)
);
